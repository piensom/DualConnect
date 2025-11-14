/**
 * API Versioning Middleware
 * Supports multiple API versions for backward compatibility
 */

const { log } = require('../utils/logger');

/**
 * API version detection middleware
 * Supports version via header, query param, or URL path
 */
function detectAPIVersion(req, res, next) {
  let version = null;

  // 1. Check URL path (/api/v1/..., /api/v2/...)
  const pathMatch = req.path.match(/^\/api\/v(\d+)\//);
  if (pathMatch) {
    version = parseInt(pathMatch[1]);
  }

  // 2. Check header (API-Version: 1)
  if (!version && req.headers['api-version']) {
    version = parseInt(req.headers['api-version']);
  }

  // 3. Check query parameter (?version=1)
  if (!version && req.query.version) {
    version = parseInt(req.query.version);
  }

  // Default to latest version if not specified
  if (!version) {
    version = parseInt(process.env.API_DEFAULT_VERSION || '1');
  }

  // Validate version
  const supportedVersions = [1, 2];
  if (!supportedVersions.includes(version)) {
    return res.status(400).json({
      error: {
        message: `Unsupported API version: ${version}. Supported versions: ${supportedVersions.join(', ')}`,
        status: 400,
        code: 'UNSUPPORTED_API_VERSION'
      }
    });
  }

  // Attach version to request
  req.apiVersion = version;

  // Add version to response headers
  res.setHeader('API-Version', version);

  // Log version usage for analytics
  log.debug('API version detected', {
    version,
    path: req.path,
    method: req.method
  });

  next();
}

/**
 * Version-specific route wrapper
 * Routes different versions to different handlers
 */
function versionRoute(routes) {
  return async (req, res, next) => {
    const version = req.apiVersion || 1;
    const handler = routes[`v${version}`] || routes.default;

    if (!handler) {
      return res.status(501).json({
        error: {
          message: `Version ${version} not implemented for this endpoint`,
          status: 501,
          code: 'VERSION_NOT_IMPLEMENTED'
        }
      });
    }

    try {
      await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Deprecation warning middleware
 * Warns clients using deprecated API versions
 */
function deprecationWarning(deprecatedVersions = []) {
  return (req, res, next) => {
    const version = req.apiVersion;

    if (deprecatedVersions.includes(version)) {
      const sunsetDate = process.env[`API_V${version}_SUNSET_DATE`] || 'TBD';

      res.setHeader('Deprecation', 'true');
      res.setHeader('Sunset', sunsetDate);
      res.setHeader('Link', `</api/v${version + 1}/>; rel="successor-version"`);

      log.warn('Deprecated API version used', {
        version,
        path: req.path,
        userAgent: req.get('user-agent'),
        ip: req.ip
      });
    }

    next();
  };
}

/**
 * Response transformer for version compatibility
 * Transforms responses to match version-specific schemas
 */
class ResponseTransformer {
  /**
   * Transform user response for different API versions
   */
  static transformUser(user, version) {
    switch (version) {
      case 1:
        // v1: Basic user info
        return {
          id: user.user_id,
          email: user.email,
          name: `${user.first_name} ${user.last_name}`,
          role: user.role
        };

      case 2:
        // v2: Detailed user info with snake_case
        return {
          user_id: user.user_id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          country_of_origin: user.country_of_origin,
          phone: user.phone,
          preferred_language: user.preferred_language,
          created_at: user.created_at
        };

      default:
        return user;
    }
  }

  /**
   * Transform program response for different API versions
   */
  static transformProgram(program, version) {
    switch (version) {
      case 1:
        // v1: Basic program info
        return {
          id: program.program_id,
          name: program.program_name,
          type: program.program_type,
          company: program.company_name,
          city: program.city,
          description: program.description
        };

      case 2:
        // v2: Full program info with metadata
        return {
          program_id: program.program_id,
          program_name: program.program_name,
          program_type: program.program_type,
          field_of_study: program.field_of_study,
          description: program.description,
          duration_months: program.duration_months,
          language_requirement: program.language_requirement,
          salary_range: {
            min: program.salary_min,
            max: program.salary_max
          },
          dates: {
            start_date: program.start_date,
            application_deadline: program.application_deadline
          },
          company: {
            id: program.company_id,
            name: program.company_name,
            city: program.city,
            state: program.state,
            logo_url: program.logo_url
          },
          stats: {
            views_count: program.views_count,
            applications_count: program.applications_count
          },
          is_active: program.is_active,
          is_bookmarked: program.is_bookmarked || false,
          created_at: program.created_at
        };

      default:
        return program;
    }
  }

  /**
   * Transform pagination response
   */
  static transformPagination(data, total, limit, offset, version) {
    switch (version) {
      case 1:
        // v1: Simple pagination
        return {
          data,
          total,
          page: Math.floor(offset / limit) + 1,
          pages: Math.ceil(total / limit)
        };

      case 2:
        // v2: Detailed pagination with links
        return {
          data,
          pagination: {
            total,
            limit,
            offset,
            has_more: (offset + limit) < total,
            current_page: Math.floor(offset / limit) + 1,
            total_pages: Math.ceil(total / limit)
          }
        };

      default:
        return { data, total, limit, offset };
    }
  }
}

/**
 * Middleware to transform response based on API version
 */
function transformResponse(transformer) {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = function(data) {
      const version = req.apiVersion || 1;
      const transformed = transformer(data, version);
      return originalJson(transformed);
    };

    next();
  };
}

/**
 * Breaking changes tracker
 * Documents breaking changes between versions
 */
const BREAKING_CHANGES = {
  v2: [
    {
      type: 'field_renamed',
      old: 'id',
      new: 'user_id',
      resource: 'User',
      description: 'User ID field renamed for consistency'
    },
    {
      type: 'field_renamed',
      old: 'name',
      new: 'first_name + last_name',
      resource: 'User',
      description: 'Name split into separate fields'
    },
    {
      type: 'response_structure',
      resource: 'Program',
      description: 'Program response now includes nested company and dates objects'
    },
    {
      type: 'pagination_changed',
      resource: 'All paginated endpoints',
      description: 'Pagination response structure changed to include more metadata'
    }
  ]
};

/**
 * Get breaking changes for a version
 */
function getBreakingChanges(version) {
  return BREAKING_CHANGES[`v${version}`] || [];
}

/**
 * Migration guide endpoint
 */
function migrationGuideHandler(req, res) {
  const { from, to } = req.query;

  if (!from || !to) {
    return res.status(400).json({
      error: 'Query parameters "from" and "to" are required'
    });
  }

  const fromVersion = parseInt(from);
  const toVersion = parseInt(to);

  const changes = [];
  for (let v = fromVersion + 1; v <= toVersion; v++) {
    const versionChanges = getBreakingChanges(v);
    if (versionChanges.length > 0) {
      changes.push({
        version: v,
        changes: versionChanges
      });
    }
  }

  res.json({
    from: fromVersion,
    to: toVersion,
    breaking_changes: changes,
    migration_steps: [
      'Update API version in your requests',
      'Update response field mappings',
      'Test all endpoints',
      'Deploy and monitor'
    ],
    documentation_url: `/api/docs/migration/v${fromVersion}-to-v${toVersion}`
  });
}

module.exports = {
  detectAPIVersion,
  versionRoute,
  deprecationWarning,
  ResponseTransformer,
  transformResponse,
  getBreakingChanges,
  migrationGuideHandler
};
