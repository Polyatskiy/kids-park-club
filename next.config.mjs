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
    // Reduced formats: only webp to minimize transformations
    formats: ['image/webp'],
    // Optimized device sizes for common breakpoints (reduced from 8 to 5 sizes)
    deviceSizes: [640, 828, 1200, 1920, 2048],
    // Optimized image sizes for thumbnails and icons (reduced from 8 to 5 sizes)
    imageSizes: [32, 64, 96, 128, 256],
    // Cache for 31 days (2678400 seconds) to reduce transformations and cache writes
    minimumCacheTTL: 2678400,
    // Quality allowlist to reduce possible transformations
    // Lower quality = smaller files = fewer cache reads/writes
    quality: 80,
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
  
  // Compiler configuration to reduce legacy JavaScript polyfills
  compiler: {
    // Remove console.log in production (optional, but recommended)
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'], // Keep error and warn logs
    } : false,
  },
  
  // Note: SWC minify is enabled by default in Next.js 13+ (no need to specify)
  // browserslist configuration in package.json tells Next.js/SWC to target modern browsers only
  // This prevents adding unnecessary polyfills for features like Array.prototype.at, flat, etc.
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
      
      // Resolve configuration to help reduce polyfills
      // Modern browsers support ES6+ natively, so we don't need polyfills
      config.resolve = {
        ...config.resolve,
        alias: {
          ...config.resolve.alias,
        },
      };
    }
    return config;
  },
};

export default withNextIntl(nextConfig);
