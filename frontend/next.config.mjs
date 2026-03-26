const isProd = process.env.NODE_ENV === "production";
const isStaticExport = !!process.env.NEXT_PUBLIC_STATIC_EXPORT;

const nextConfig = {
  ...(isStaticExport ? { output: "export" } : {}),
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  productionBrowserSourceMaps: false,
  compiler: isProd ? { removeConsole: { exclude: ['error'] } } : undefined,
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
    ],
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  trailingSlash: false,
  ...(isStaticExport ? {} : {
    async redirects() {
      return [
        { source: '/business/:slug', destination: '/:slug', permanent: true },
        { source: '/city/:path*/business/:slug', destination: '/:slug', permanent: true },
        { source: '/category/:path*/business/:slug', destination: '/:slug', permanent: true },
        { source: '/404', destination: '/', permanent: false },
      ]
    },
    async rewrites() {
      const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
      return [
        { source: '/api/:path*', destination: `${backendUrl}/api/:path*` },
      ]
    },
  }),
}

export default nextConfig
