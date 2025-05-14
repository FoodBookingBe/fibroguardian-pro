/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Image optimalisatie configuratie
  images: {
    domains: [
      'fibroguardian.be',
      'localhost',
      // Supabase storage domain voor avatars en andere afbeeldingen
      process.env.NEXT_PUBLIC_SUPABASE_URL
        ? process.env.NEXT_PUBLIC_SUPABASE_URL.replace('https://', '').split('/')[0] // Ensure only hostname is used
        : '',
    ].filter(Boolean), // Filter out empty string if env var is not set
  },
  
  // Statische pagina's optimalisatie
  experimental: {
    // Verhoog limiet voor statische pagina's
    isrMemoryCacheSize: 50,
    // Optimaliseer laden van third-party scripts
    optimizeCss: true,
    // Optimaliseer Next.js voor servercomponenten
    serverActions: true,
  },
  
  // Security headers voor alle pagina's
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: process.env.NODE_ENV === 'production'
              ? "default-src 'self'; script-src 'self' 'unsafe-eval' https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com; frame-src https://js.stripe.com"
              : "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com http://localhost:*; frame-src https://js.stripe.com",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;