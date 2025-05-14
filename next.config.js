/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development', // Disable PWA in development for faster HMR
  register: true, // Register the service worker
  skipWaiting: true, // Skip waiting for service worker activation
  // fallbacks: { // Optional: define fallbacks for offline
    // document: '/_offline', // app/offline.tsx page
    // image: '/static/images/fallback.png',
    // font: '/static/fonts/fallback.woff2',
  // },
  // runtimeCaching: [ // Optional: example runtime caching
    // {
    //   urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
    //   handler: 'CacheFirst',
    //   options: {
    //     cacheName: 'google-fonts',
    //     expiration: {
    //       maxEntries: 4,
    //       maxAgeSeconds: 365 * 24 * 60 * 60, // 365 days
    //     },
    //   },
    // },
  // ],
});

const nextConfig = withPWA({
  reactStrictMode: true,
  swcMinify: true,
  cacheMaxMemorySize: 50 * 1024 * 1024, // 50MB in bytes (Next.js expects bytes)
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fibroguardian.be',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000', // Assuming default dev port, adjust if different
        pathname: '/**',
      },
      // Add Supabase storage hostname if NEXT_PUBLIC_SUPABASE_URL is set
      ...(process.env.NEXT_PUBLIC_SUPABASE_URL
        ? [
            {
              protocol: 'https',
              hostname: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname,
              port: '',
              pathname: '/**',
            },
          ]
        : []),
    ],
  },
  
  experimental: {
    // isrMemoryCacheSize is now cacheMaxMemorySize at the top level
    optimizeCss: true,
    // serverActions: true, // Server Actions are enabled by default
  },
  
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          {
            key: 'Content-Security-Policy',
            value: process.env.NODE_ENV === 'production'
              ? "default-src 'self'; script-src 'self' 'unsafe-eval' https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https: *.supabase.co; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com; frame-src https://js.stripe.com;"
              : "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https: *.supabase.co; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com http://localhost:*; frame-src https://js.stripe.com;",
          },
        ],
      },
    ];
  },
});

module.exports = nextConfig;