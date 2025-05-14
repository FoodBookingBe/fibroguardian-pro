/**
 * Snelheidsbeperking (rate limiting) voor API endpoints
 * Beschermt tegen brute force en DDoS aanvallen
 */

export interface RateLimitOptions { // Exporting for potential use in API routes
  windowMs: number;   // Tijdsvenster in milliseconden
  maxRequests: number; // Maximum toegestane verzoeken in het tijdsvenster
  message?: string;   // Bericht bij overschrijding
  statusCode?: number; // HTTP status code bij overschrijding
}

interface RateLimitRecord {
  count: number;
  resetTime: number; // Timestamp when the count resets
}

// In-memory opslag voor rate limiting. 
// Voor productie is een gedistribueerde store zoals Redis aanbevolen.
const ipRequestMap = new Map<string, RateLimitRecord>();

// Periodiek opruimen van verlopen rate limit records
// This interval should be less than the shortest windowMs to ensure timely cleanup.
// For very short windowMs, this cleanup might not be efficient enough.
const cleanupInterval = 60 * 1000; // 1 minute
setInterval(() => {
  const now = Date.now();
  ipRequestMap.forEach((record, ip) => {
    if (record.resetTime < now) {
      ipRequestMap.delete(ip);
    }
  });
}, cleanupInterval);

export interface RateLimitResult { // Exporting for use in API routes
    success: boolean; 
    message?: string; 
    remaining: number; 
    reset: number; // Seconds until reset
    limit: number; // The maxRequests limit
    statusCode?: number; // The status code to return on limit exceeded
}

export async function rateLimit(
  // Identifier for the rate limit (e.g., IP address, user ID)
  identifier: string, 
  options?: Partial<RateLimitOptions> // Options can be partial
): Promise<RateLimitResult> {
  const now = Date.now();
  
  const config: RateLimitOptions = {
    windowMs: 60 * 1000, // 1 minuut
    maxRequests: 60,      
    message: 'Te veel verzoeken, probeer het later opnieuw.',
    statusCode: 429,
    ...options // Override defaults with provided options
  };
  
  let record = ipRequestMap.get(identifier);
  
  if (!record || record.resetTime < now) {
    record = {
      count: 0,
      resetTime: now + config.windowMs
    };
  }
  
  record.count += 1;
  ipRequestMap.set(identifier, record);
  
  const remaining = Math.max(0, config.maxRequests - record.count);
  const resetInSeconds = Math.ceil((record.resetTime - now) / 1000);
  
  if (record.count > config.maxRequests) {
    return {
      success: false,
      message: config.message,
      remaining,
      reset: resetInSeconds,
      limit: config.maxRequests,
      statusCode: config.statusCode
    };
  }
  
  return {
    success: true,
    remaining,
    reset: resetInSeconds,
    limit: config.maxRequests,
  };
}

// Voorbeeld implementatie in een API route:
/*
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, RateLimitResult } from '@/lib/security/rateLimit';

export async function POST(req: NextRequest) {
  // Use a more reliable way to get IP if behind a proxy, e.g., 'x-real-ip' or 'cf-connecting-ip'
  const ip = req.ip || req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown_ip';
  
  const limiterResult: RateLimitResult = await rateLimit(ip, {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100         // 100 requests per 15 minutes per IP
  });
  
  if (!limiterResult.success) {
    return NextResponse.json(
      { error: limiterResult.message },
      { 
        status: limiterResult.statusCode || 429, 
        headers: { 
          'Retry-After': String(limiterResult.reset), // In seconds
          'X-RateLimit-Limit': String(limiterResult.limit),
          'X-RateLimit-Remaining': String(limiterResult.remaining),
          'X-RateLimit-Reset': String(limiterResult.reset) 
        } 
      }
    );
  }
  
  // Proceed with normal request processing...
  return NextResponse.json({ message: "Success", remainingRequests: limiterResult.remaining });
}
*/