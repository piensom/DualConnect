/**
 * SEO Utilities
 * Generate sitemaps, meta tags, and structured data
 */

const fs = require('fs').promises;
const path = require('path');
const pool = require('../config/database');

/**
 * Generate XML sitemap
 */
async function generateSitemap() {
  const baseUrl = process.env.APP_URL || 'https://dualconnect.com';
  const currentDate = new Date().toISOString().split('T')[0];

  const urls = [];

  // Static pages
  const staticPages = [
    { url: '/', priority: 1.0, changefreq: 'daily' },
    { url: '/src/pages/programs.html', priority: 0.9, changefreq: 'daily' },
    { url: '/src/pages/companies.html', priority: 0.8, changefreq: 'weekly' },
    { url: '/src/pages/blog.html', priority: 0.7, changefreq: 'daily' },
    { url: '/src/pages/stories.html', priority: 0.7, changefreq: 'weekly' },
    { url: '/src/pages/faq.html', priority: 0.6, changefreq: 'monthly' },
    { url: '/src/pages/glossary.html', priority: 0.6, changefreq: 'monthly' },
    { url: '/src/pages/about.html', priority: 0.5, changefreq: 'monthly' },
    { url: '/src/pages/contact.html', priority: 0.5, changefreq: 'monthly' }
  ];

  staticPages.forEach(page => {
    urls.push({
      loc: `${baseUrl}${page.url}`,
      lastmod: currentDate,
      changefreq: page.changefreq,
      priority: page.priority
    });
  });

  // Dynamic program pages
  try {
    const programsResult = await pool.query(
      `SELECT program_id, updated_at FROM programs WHERE is_active = true ORDER BY updated_at DESC LIMIT 1000`
    );

    programsResult.rows.forEach(program => {
      urls.push({
        loc: `${baseUrl}/src/pages/program-details.html?id=${program.program_id}`,
        lastmod: program.updated_at ? program.updated_at.toISOString().split('T')[0] : currentDate,
        changefreq: 'weekly',
        priority: 0.8
      });
    });
  } catch (error) {
    console.error('Error fetching programs for sitemap:', error);
  }

  // Dynamic company pages
  try {
    const companiesResult = await pool.query(
      `SELECT company_id, updated_at FROM companies WHERE is_verified = true ORDER BY updated_at DESC LIMIT 500`
    );

    companiesResult.rows.forEach(company => {
      urls.push({
        loc: `${baseUrl}/src/pages/company-details.html?id=${company.company_id}`,
        lastmod: company.updated_at ? company.updated_at.toISOString().split('T')[0] : currentDate,
        changefreq: 'monthly',
        priority: 0.6
      });
    });
  } catch (error) {
    console.error('Error fetching companies for sitemap:', error);
  }

  // Dynamic blog posts
  try {
    const blogResult = await pool.query(
      `SELECT post_id, slug, published_at FROM blog_posts WHERE status = 'published' ORDER BY published_at DESC LIMIT 500`
    );

    blogResult.rows.forEach(post => {
      urls.push({
        loc: `${baseUrl}/src/pages/blog-post.html?slug=${post.slug}`,
        lastmod: post.published_at ? post.published_at.toISOString().split('T')[0] : currentDate,
        changefreq: 'monthly',
        priority: 0.7
      });
    });
  } catch (error) {
    console.error('Error fetching blog posts for sitemap:', error);
  }

  // Generate XML
  const xml = generateSitemapXML(urls);

  return xml;
}

/**
 * Generate sitemap XML from URLs array
 */
function generateSitemapXML(urls) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  urls.forEach(url => {
    xml += '  <url>\n';
    xml += `    <loc>${escapeXml(url.loc)}</loc>\n`;
    if (url.lastmod) xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
    if (url.changefreq) xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
    if (url.priority) xml += `    <priority>${url.priority}</priority>\n`;
    xml += '  </url>\n';
  });

  xml += '</urlset>';

  return xml;
}

/**
 * Generate robots.txt
 */
function generateRobotsTxt() {
  const baseUrl = process.env.APP_URL || 'https://dualconnect.com';

  return `# Dual Connect Robots.txt
User-agent: *
Allow: /
Disallow: /src/pages/admin/
Disallow: /src/pages/dashboard.html
Disallow: /api/

# Sitemaps
Sitemap: ${baseUrl}/sitemap.xml

# Crawl-delay
Crawl-delay: 10

# Google
User-agent: Googlebot
Allow: /
Crawl-delay: 5

# Bing
User-agent: Bingbot
Allow: /
Crawl-delay: 5
`;
}

/**
 * Generate structured data (JSON-LD) for a program
 */
function generateProgramStructuredData(program, company) {
  const baseUrl = process.env.APP_URL || 'https://dualconnect.com';

  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOccupationalProgram',
    name: program.program_name,
    description: program.description,
    provider: {
      '@type': 'Organization',
      name: company.company_name,
      address: {
        '@type': 'PostalAddress',
        addressLocality: company.city,
        addressRegion: company.state,
        addressCountry: 'DE'
      },
      url: company.website
    },
    offers: {
      '@type': 'Offer',
      category: program.program_type === 'ausbildung' ? 'Vocational Training' : 'Dual Study Program',
      price: program.salary_min,
      priceCurrency: 'EUR'
    },
    educationalCredentialAwarded: program.program_type === 'duales_studium' ? 'Bachelor Degree' : 'Vocational Certificate',
    timeToComplete: `P${program.duration_months}M`,
    applicationDeadline: program.application_deadline,
    startDate: program.start_date,
    url: `${baseUrl}/src/pages/program-details.html?id=${program.program_id}`
  };
}

/**
 * Generate meta tags for a page
 */
function generateMetaTags(options) {
  const {
    title,
    description,
    keywords,
    image,
    url,
    type = 'website',
    author,
    publishedTime,
    modifiedTime
  } = options;

  const baseUrl = process.env.APP_URL || 'https://dualconnect.com';
  const defaultImage = `${baseUrl}/images/og-default.jpg`;

  const tags = [];

  // Basic meta tags
  if (title) {
    tags.push(`<title>${escapeHtml(title)} | Dual Connect</title>`);
    tags.push(`<meta name="title" content="${escapeHtml(title)} | Dual Connect">`);
  }

  if (description) {
    tags.push(`<meta name="description" content="${escapeHtml(description)}">`);
  }

  if (keywords) {
    tags.push(`<meta name="keywords" content="${escapeHtml(keywords)}">`);
  }

  if (author) {
    tags.push(`<meta name="author" content="${escapeHtml(author)}">`);
  }

  // Open Graph tags
  tags.push(`<meta property="og:type" content="${type}">`);
  tags.push(`<meta property="og:site_name" content="Dual Connect">`);

  if (title) {
    tags.push(`<meta property="og:title" content="${escapeHtml(title)}">`);
  }

  if (description) {
    tags.push(`<meta property="og:description" content="${escapeHtml(description)}">`);
  }

  if (url) {
    tags.push(`<meta property="og:url" content="${baseUrl}${url}">`);
  }

  if (image) {
    tags.push(`<meta property="og:image" content="${baseUrl}${image}">`);
    tags.push(`<meta property="og:image:alt" content="${escapeHtml(title || 'Dual Connect')}">`);
  } else {
    tags.push(`<meta property="og:image" content="${defaultImage}">`);
  }

  if (publishedTime) {
    tags.push(`<meta property="article:published_time" content="${publishedTime}">`);
  }

  if (modifiedTime) {
    tags.push(`<meta property="article:modified_time" content="${modifiedTime}">`);
  }

  // Twitter Card tags
  tags.push(`<meta name="twitter:card" content="summary_large_image">`);

  if (title) {
    tags.push(`<meta name="twitter:title" content="${escapeHtml(title)}">`);
  }

  if (description) {
    tags.push(`<meta name="twitter:description" content="${escapeHtml(description)}">`);
  }

  if (image) {
    tags.push(`<meta name="twitter:image" content="${baseUrl}${image}">`);
  } else {
    tags.push(`<meta name="twitter:image" content="${defaultImage}">`);
  }

  // Canonical URL
  if (url) {
    tags.push(`<link rel="canonical" href="${baseUrl}${url}">`);
  }

  return tags.join('\n');
}

/**
 * Generate breadcrumb structured data
 */
function generateBreadcrumbStructuredData(breadcrumbs) {
  const baseUrl = process.env.APP_URL || 'https://dualconnect.com';

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: `${baseUrl}${crumb.url}`
    }))
  };
}

/**
 * Escape HTML for meta tags
 */
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Escape XML for sitemap
 */
function escapeXml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Save sitemap to file
 */
async function saveSitemap() {
  const xml = await generateSitemap();
  const sitemapPath = path.join(__dirname, '../../sitemap.xml');
  await fs.writeFile(sitemapPath, xml);
  console.log('✓ Sitemap generated:', sitemapPath);
  return sitemapPath;
}

/**
 * Save robots.txt to file
 */
async function saveRobotsTxt() {
  const txt = generateRobotsTxt();
  const robotsPath = path.join(__dirname, '../../robots.txt');
  await fs.writeFile(robotsPath, txt);
  console.log('✓ Robots.txt generated:', robotsPath);
  return robotsPath;
}

module.exports = {
  generateSitemap,
  generateRobotsTxt,
  generateProgramStructuredData,
  generateMetaTags,
  generateBreadcrumbStructuredData,
  saveSitemap,
  saveRobotsTxt
};
