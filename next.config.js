/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development', // Disable PWA in development for faster HMR
  register: true, // Register the service worker
  skipWaiting: true, // Skip waiting for service worker activation
  fallbacks: { 
    document: '/offline', // Points to app/offline/page.tsx
    // image: '/static/images/fallback-image.png', // Optional: provide a fallback image
    // font: '/static/fonts/fallback-font.woff2',  // Optional: provide a fallback font
  },
  runtimeCaching: [ 
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i, // Matches Supabase Auth, DB, and Storage
      handler: 'NetworkFirst',
      options: {
        cacheName: 'supabase-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60, // 1 day
        },
        networkTimeoutSeconds: 10, // Timeout for network request before falling back to cache
      },
    },
    {
      urlPattern: /\/api\//, // Matches internal API routes
      handler: 'NetworkFirst',
      options: {
        cacheName: 'internal-api-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60, // 1 day
        },
        networkTimeoutSeconds: 10,
      },
    },
    // Example for caching Google Fonts (if used, though we determined system fonts are used)
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
  ], // Correctly close the runtimeCaching array
});

// Bundle Analyzer configuratie
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

// Combineer PWA en Bundle Analyzer met de hoofdconfiguratie
const nextConfig = withPWA(withBundleAnalyzer({
  reactStrictMode: true,
  swcMinify: true, // Enabled for production.
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
