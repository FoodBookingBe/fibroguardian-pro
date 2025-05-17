// lib/security-headers.js

// Haal de Supabase URL op uit environment variabelen
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseHostname = '';
if (supabaseUrl) {
  try {
    supabaseHostname = new URL(supabaseUrl).hostname;
  } catch (e) {
    console.error('Invalid NEXT_PUBLIC_SUPABASE_URL for CSP:', e);
  }
}

// Dynamische bronnen voor CSP
const connectSrcDirectives = [
  "'self'", // Staat verbindingen naar hetzelfde origin toe
  'https://*.vercel-insights.com', // Voor Vercel Analytics/Speed Insights
  'https://vitals.vercel-insights.com', // Voor Vercel Web Vitals
];

if (supabaseHostname) {
  connectSrcDirectives.push(`https://${supabaseHostname}`); // Supabase API
  connectSrcDirectives.push(`wss://${supabaseHostname}`);   // Supabase Realtime (WebSockets)
}

// Overweeg om specifieke hostnames voor afbeeldingen en andere resources toe te voegen
// indien die bekend zijn en niet alleen 'self' of data:.
const imgSrcDirectives = [
  "'self'",
  "data:", // Voor inline base64 afbeeldingen
  "blob:", // Voor afbeeldingen gegenereerd via blobs (bv. URL.createObjectURL)
  // Voeg hier andere vertrouwde image CDNs of storage providers toe
  // Voorbeeld: 'https://images.unsplash.com',
  // Als je Supabase Storage gebruikt voor afbeeldingen en de bucket URL is anders dan de hoofd API URL:
  // `https://<project-ref>.<service>.supabase.co` (vervang met je daadwerkelijke storage URL)
];
if (supabaseHostname && supabaseHostname.includes('supabase.co')) {
    // Typical Supabase storage URL pattern, e.g., xyz.supabase.co/storage/v1/...
    // This might need to be more specific if your storage URL is different.
    imgSrcDirectives.push(`https://${supabaseHostname}`);
}


const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' ${process.env.NODE_ENV === 'development' ? "'unsafe-eval'" : ''} https://*.vercel-insights.com;
  style-src 'self' 'unsafe-inline';
  img-src ${imgSrcDirectives.join(' ')};
  font-src 'self' data:;
  connect-src ${connectSrcDirectives.join(' ')};
  frame-ancestors 'none';
  form-action 'self';
  base-uri 'self';
  object-src 'none';
  upgrade-insecure-requests;
`.replace(/\s{2,}/g, ' ').trim(); // Verwijder overtollige witruimte

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy,
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block', // Hoewel modernere browsers dit negeren t.v.v. CSP
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin', // Goede balans tussen privacy en functionaliteit
  },
  {
    key: 'Permissions-Policy',
    // Wees specifiek over welke features je nodig hebt. Voorbeeld:
    value: 'camera=(), microphone=(), geolocation=(), payment=(), interest-cohort=()',
  },
  {
    key: 'Strict-Transport-Security', // Zorgt dat browser alleen HTTPS gebruikt
    value: 'max-age=63072000; includeSubDomains; preload', // 2 jaar
  },
  // Optioneel: Cross-Origin-Opener-Policy (COOP) en Cross-Origin-Embedder-Policy (COEP)
  // voor extra beveiliging tegen cross-origin aanvallen, maar vereisen zorgvuldige configuratie.
  // {
  //   key: 'Cross-Origin-Opener-Policy',
  //   value: 'same-origin-allow-popups' // Of 'same-origin'
  // },
  // {
  //   key: 'Cross-Origin-Embedder-Policy',
  //   value: 'require-corp' // Of 'credentialless'
  // }
];

// De validatie functie met Zod is een goed patroon, maar Zod zelf is niet hier gedefinieerd.
// Dit zou in een apart validatie utility bestand moeten staan, bv. utils/validation.ts
// en Zod moet als dependency worden toegevoegd.
// Voorbeeld (conceptueel, Zod moet geïnstalleerd zijn):
/*
import { z, ZodError, ZodSchema } from 'zod';

export function validateAndSanitizeApiInput<T>(
  data: unknown, 
  schema: ZodSchema<T>, 
  // sanitizeFn is optioneel; Zod kan transformaties doen
): { data: T | null; error: string | null } { // Consistent return type
  try {
    const validatedData = schema.parse(data);
    return { data: validatedData, error: null };
  } catch (error) {
    if (error instanceof ZodError) {
      const errorMessage = error.errors.map(e => 
        `${e.path.join('.') || 'input'}: ${e.message}` // Geef 'input' als pad leeg is
      ).join('; ');
      return { data: null, error: errorMessage };
    }
    // Vang andere onverwachte errors
    console.error("Validation error (non-Zod):", error);
    return { data: null, error: 'Invalid input data due to an unexpected error.' };
  }
}
*/

module.exports = { securityHeaders };
