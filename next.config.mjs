import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // App Router включен по умолчанию, experimental.appDir больше не нужен
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  // Increase body size limit for Server Actions to support bulk file uploads (20-30 files)
  // Note: Using experimental.serverActions as some Next.js versions require it
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb', // Allow up to 50MB for bulk uploads
    },
  },
};

export default withNextIntl(nextConfig);
