import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/*/admin/', '/api/', '/*/api/'],
    },
    sitemap: 'https://app.somespai.net/sitemap.xml',
  };
}
