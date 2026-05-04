import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/lib/i18n/request.ts');

/** @type {import('next').NextConfig} */

const isExport = process.env.NEXT_EXPORT === 'true';

const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
  experimental: {},
  output: isExport ? 'export' : undefined,
  // Para rutas relativas en export estático
  basePath: isExport ? '/app.somespai' : undefined,
  assetPrefix: isExport ? '/app.somespai/' : undefined,
};

export default withNextIntl(nextConfig);
