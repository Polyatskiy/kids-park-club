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
};

export default nextConfig;
