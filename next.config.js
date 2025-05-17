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

// Bundle Analyzer configuratie
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

// Combineer PWA en Bundle Analyzer met de hoofdconfiguratie
const nextConfig = withPWA(withBundleAnalyzer({
  reactStrictMode: true,
  swcMinify: false, // Disabled for testing. Overweeg true voor productie.
  cacheMaxMemorySize: 50 * 1024 * 1024, // 50MB in bytes
  
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
    const { securityHeaders } = await import('./lib/security-headers.js'); // Import dynamisch
    return [
      {
        source: '/(.*)', // Pas toe op alle routes
        headers: securityHeaders,
      },
    ];
  },
})); // Zorg dat de withBundleAnalyzer correct wordt afgesloten

module.exports = nextConfig;
