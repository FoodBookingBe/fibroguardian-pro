// lib/security-headers.ts
// Bevat beveiligingsheaders voor Next.js

// Definieert de Content-Security-Policy (CSP) header
// Deze header helpt XSS-aanvallen te voorkomen door te bepalen welke bronnen geladen mogen worden
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://cdn.jsdelivr.net;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: blob: https://*.supabase.co https://fibroguardian.be;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://*.supabase.co https://api.stripe.com;
  frame-src 'self' https://js.stripe.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  block-all-mixed-content;
  upgrade-insecure-requests;
`;

// Exporteert een array van beveiligingsheaders
export const _securityHeaders = [
  // X-DNS-Prefetch-Control: Controleert DNS prefetching
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  // Strict-Transport-Security: Dwingt HTTPS af
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  // X-XSS-Protection: Biedt XSS-bescherming in oudere browsers
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  // X-Frame-Options: Voorkomt clickjacking door framing te beperken
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  // X-Content-Type-Options: Voorkomt MIME-type sniffing
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  // Referrer-Policy: Controleert welke referrer-informatie wordt verzonden
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  // Content-Security-Policy: Implementeert de hierboven gedefinieerde CSP
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy.replace(/\s{2,}/g, ' ').trim()
  },
  // Permissions-Policy: Beperkt toegang tot browser features
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()'
  }
];
