import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://grafoseducacional.com.br';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/api/',
          '/_next/',
          '/admin/',
          '/professor/',
          '/aluno/',
          '/responsaveis/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
