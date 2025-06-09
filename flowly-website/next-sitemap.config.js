/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://www.myflowly.com',
  generateRobotsTxt: true,
  exclude: [
    '/api/*',
    '/dashboard/*',
    '/settings/*',
    '/checkout/*',
    '/server-sitemap-index.xml',
  ],
  additionalPaths: async (config) => [
    await config.transform(config, '/'),
    await config.transform(config, '/pricing'),
    await config.transform(config, '/login'),
    await config.transform(config, '/signup'),
    await config.transform(config, '/blog'),
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/settings/', '/checkout/', '/_next/'],
      },
    ],
    additionalSitemaps: [
      'https://www.myflowly.com/sitemap.xml',
    ],
  },
  changefreq: 'daily',
  priority: 0.7,
  sitemapSize: 5000,
  generateIndexSitemap: false,
} 