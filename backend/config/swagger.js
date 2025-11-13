const swaggerJsdoc = require('swagger-jsdoc');

/**
 * Swagger/OpenAPI Configuration
 * Auto-generates API documentation from JSDoc comments
 */

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Dual Connect API',
      version: '1.0.0',
      description: 'Educational platform API connecting students with Ausbildung and Duales Studium programs in Germany',
      contact: {
        name: 'Dual Connect Team',
        email: 'support@dualconnect.com',
        url: 'https://dualconnect.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.APP_URL || 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://api.dualconnect.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token'
        },
        csrfToken: {
          type: 'apiKey',
          in: 'header',
          name: 'X-CSRF-Token',
          description: 'CSRF protection token'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                status: { type: 'integer' },
                code: { type: 'string' }
              }
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            user_id: { type: 'integer' },
            email: { type: 'string', format: 'email' },
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            role: { type: 'string', enum: ['user', 'admin'] },
            country_of_origin: { type: 'string' },
            phone: { type: 'string' },
            preferred_language: { type: 'string', enum: ['de', 'en', 'tr', 'ar', 'es'] },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Program: {
          type: 'object',
          properties: {
            program_id: { type: 'integer' },
            program_name: { type: 'string' },
            program_type: { type: 'string', enum: ['ausbildung', 'duales_studium'] },
            field_of_study: { type: 'string' },
            description: { type: 'string' },
            duration_months: { type: 'integer' },
            language_requirement: { type: 'string' },
            salary_min: { type: 'number' },
            salary_max: { type: 'number' },
            start_date: { type: 'string', format: 'date' },
            application_deadline: { type: 'string', format: 'date' },
            is_active: { type: 'boolean' },
            views_count: { type: 'integer' },
            applications_count: { type: 'integer' },
            company_id: { type: 'integer' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Application: {
          type: 'object',
          properties: {
            application_id: { type: 'integer' },
            user_id: { type: 'integer' },
            program_id: { type: 'integer' },
            status: { type: 'string', enum: ['pending', 'under_review', 'approved', 'rejected', 'withdrawn'] },
            motivation_letter: { type: 'string' },
            cv_url: { type: 'string' },
            additional_documents: { type: 'array', items: { type: 'string' } },
            submitted_at: { type: 'string', format: 'date-time' },
            reviewed_at: { type: 'string', format: 'date-time' }
          }
        },
        Company: {
          type: 'object',
          properties: {
            company_id: { type: 'integer' },
            company_name: { type: 'string' },
            industry: { type: 'string' },
            city: { type: 'string' },
            state: { type: 'string' },
            website: { type: 'string', format: 'uri' },
            description: { type: 'string' },
            employee_count: { type: 'string' },
            logo_url: { type: 'string' },
            is_verified: { type: 'boolean' }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            token: { type: 'string' },
            refreshToken: { type: 'string' },
            user: { $ref: '#/components/schemas/User' }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'first_name', 'last_name'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            country_of_origin: { type: 'string' },
            phone: { type: 'string' },
            preferred_language: { type: 'string', enum: ['de', 'en', 'tr', 'ar', 'es'] }
          }
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            data: { type: 'array' },
            total: { type: 'integer' },
            limit: { type: 'integer' },
            offset: { type: 'integer' },
            hasMore: { type: 'boolean' }
          }
        },
        HealthCheck: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['ok', 'degraded'] },
            timestamp: { type: 'string', format: 'date-time' },
            uptime: { type: 'number' },
            environment: { type: 'string' },
            database: { type: 'string', enum: ['connected', 'disconnected'] },
            cache: { type: 'string', enum: ['connected', 'disconnected'] }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        ForbiddenError: {
          description: 'Access forbidden - insufficient permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        RateLimitError: {
          description: 'Too many requests',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    },
    tags: [
      { name: 'Authentication', description: 'User authentication endpoints' },
      { name: 'Programs', description: 'Education program management' },
      { name: 'Applications', description: 'Application management' },
      { name: 'Companies', description: 'Company directory' },
      { name: 'Users', description: 'User management' },
      { name: 'Bookmarks', description: 'Saved programs' },
      { name: 'Blog', description: 'Blog posts and articles' },
      { name: 'Stories', description: 'Success stories' },
      { name: 'FAQ', description: 'Frequently asked questions' },
      { name: 'Health', description: 'System health and monitoring' }
    ]
  },
  apis: ['./backend/routes/*.js', './backend/server.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
