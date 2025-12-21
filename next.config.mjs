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
  // Source maps configuration
  // In production, source maps are disabled for security and performance
  // In development, they are enabled for debugging
  productionBrowserSourceMaps: false, // Disable source maps in production (recommended for security)
  // Note: Source maps in dev mode are handled by Turbopack automatically
  // The warnings about missing 'mappings' field are known Turbopack issues in dev mode
  // and don't affect functionality
  // Optimize JavaScript bundle size and code splitting
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Optimize chunk splitting for better caching and parallel loading
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Separate vendor chunks for better caching
            framework: {
              name: 'framework',
              chunks: 'all',
              test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|next)[\\/]/,
              priority: 40,
              enforce: true,
            },
            lib: {
              test: /[\\/]node_modules[\\/]/,
              name(module) {
                const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)?.[1];
                return `npm.${packageName?.replace('@', '')}`;
              },
              priority: 30,
              minChunks: 1,
              reuseExistingChunk: true,
            },
            commons: {
              name: 'commons',
              minChunks: 2,
              priority: 20,
            },
            shared: {
              name: 'shared',
              minChunks: 2,
              priority: 10,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }
    return config;
  },
};

export default withNextIntl(nextConfig);
