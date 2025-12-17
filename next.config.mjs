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
