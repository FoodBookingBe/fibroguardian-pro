import { NextApiRequest, NextApiResponse } from 'next';

interface ApiCacheOptions {
  /**
   * Maximum age of the cache in seconds
   * @default 60 (1 minute)
   */
  maxAge?: number;
  
  /**
   * Time in seconds to serve stale content while revalidating in the background
   * @default 0 (no stale-while-revalidate)
   */
  staleWhileRevalidate?: number;
  
  /**
   * Custom cache key generator function
   * @default Uses request method and URL as cache key
   */
  cacheKeyFn?: (req: NextApiRequest) => string;
  
  /**
   * Function to determine if a request should be cached
   * @default Only caches GET requests
   */
  shouldCache?: (req: NextApiRequest) => boolean;
}

// In-memory cache store
const apiCache = new Map<string, {
  data: unknown;
  timestamp: number;
}>();

/**
 * Higher-order function that adds caching to a Next.js API route
 * 
 * @param handler The API route handler function
 * @param options Caching options
 * @returns A new handler function with caching
 */
export function withApiCache(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>,
  options: ApiCacheOptions = {}
) {
  const {
    maxAge = 60, // Default: 1 minute
    staleWhileRevalidate = 0,
    cacheKeyFn = defaultCacheKeyFn,
    shouldCache = defaultShouldCache
  } = options;

  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Only cache if the request meets the criteria
    if (!shouldCache(req)) {
      return handler(req, res);
    }

    const cacheKey = cacheKeyFn(req);
    const now = Date.now();
    const cached = apiCache.get(cacheKey);

    // If we have a valid cache entry, use it
    if (cached) {
      const age = (now - cached.timestamp) / 1000; // Convert to seconds
      
      // If the cache is still fresh, return it
      if (age < maxAge) {
        setCacheHeaders(res, maxAge - age, staleWhileRevalidate);
        return res.status(200).json(cached.data);
      }
      
      // If we're in the stale-while-revalidate window, return stale data and revalidate
      if (age < maxAge + staleWhileRevalidate) {
        // Set up background revalidation
        revalidateCache(handler, req, cacheKey).catch(console.error);
        
        // Return stale data with appropriate headers
        setCacheHeaders(res, 0, 0, true);
        return res.status(200).json(cached.data);
      }
    }

    // No valid cache entry, execute handler and cache the result
    const originalJson = res.json;
    res.json = function(data) {
      // Cache the response data
      apiCache.set(cacheKey, {
        data,
        timestamp: now
      });
      
      // Set cache headers
      setCacheHeaders(res, maxAge, staleWhileRevalidate);
      
      // Call the original json method
      return originalJson.call(this, data);
    };

    return handler(req, res);
  };
}

/**
 * Default function to determine if a request should be cached
 * Only caches GET requests
 */
function defaultShouldCache(req: NextApiRequest): boolean {
  return req.method === 'GET';
}

/**
 * Default function to generate a cache key from a request
 * Uses request method and URL as cache key
 */
function defaultCacheKeyFn(req: NextApiRequest): string {
  return `${req.method}:${req.url}:${JSON.stringify(req.query)}`;
}

/**
 * Set appropriate cache control headers on the response
 */
function setCacheHeaders(
  res: NextApiResponse,
  maxAge: number,
  staleWhileRevalidate: number,
  isStale: boolean = false
): void {
  if (isStale) {
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Cache-Status', 'stale');
  } else if (maxAge > 0) {
    const directive = staleWhileRevalidate > 0
      ? `max-age=${Math.floor(maxAge)}, stale-while-revalidate=${Math.floor(staleWhileRevalidate)}`
      : `max-age=${Math.floor(maxAge)}`;
    
    res.setHeader('Cache-Control', directive);
    res.setHeader('X-Cache-Status', 'fresh');
  } else {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Cache-Status', 'uncached');
  }
}

/**
 * Revalidate the cache in the background
 */
async function revalidateCache(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>,
  req: NextApiRequest,
  cacheKey: string
): Promise<void> {
  // Create a mock response object to capture the new data
  const mockRes = {
    status: () => mockRes,
    json: (data: unknown) => {
      apiCache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      return mockRes;
    },
    setHeader: () => mockRes,
    end: () => {}
  } as unknown as NextApiResponse;

  // Execute the handler with the mock response
  await handler(req, mockRes);
}

/**
 * Clear the entire API cache or specific entries
 */
export function clearApiCache(cacheKey?: string): void {
  if (cacheKey) {
    apiCache.delete(cacheKey);
  } else {
    apiCache.clear();
  }
}

/**
 * Get the current size of the API cache
 */
export function getApiCacheSize(): number {
  return apiCache.size;
}

/**
 * Get all cache keys currently in the API cache
 */
export function getApiCacheKeys(): string[] {
  return Array.from(apiCache.keys());
}
