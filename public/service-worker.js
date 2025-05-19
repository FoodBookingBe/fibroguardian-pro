// FibroGuardian Service Worker
// Version: 1.0.0

const CACHE_NAME = 'fibroguardian-cache-v1';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/offline',
  '/dashboard',
  '/styles/globals.css',
  '/logo.png',
  '/logo-white.png',
  '/favicon-16x16.png',
  '/icons/fallback-image.svg',
  '/manifest.json'
];

// Install event - precache assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');
  
  // Skip waiting to ensure the new service worker activates immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Caching app shell');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .catch((error) => {
        console.error('[ServiceWorker] Precache error:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');
  
  // Claim clients to ensure the service worker controls all clients immediately
  event.waitUntil(self.clients.claim());
  
  // Remove old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Helper function to determine if a request is an API request
function isApiRequest(url) {
  return url.pathname.startsWith('/api/');
}

// Helper function to determine if a request is a navigation request
function isNavigationRequest(request) {
  return request.mode === 'navigate';
}

// Helper function to determine if a request is an asset request
function isAssetRequest(url) {
  return (
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/images/') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.json')
  );
}

// Fetch event - network first for API, cache first for assets, network with cache fallback for navigation
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }
  
  // Handle API requests - Network only with background sync for POST/PUT/DELETE
  if (isApiRequest(url)) {
    if (event.request.method === 'GET') {
      // For GET API requests, use network with timeout fallback to cache
      event.respondWith(
        networkWithTimeout(event.request, 3000)
          .catch(() => {
            return caches.match(event.request)
              .then((response) => {
                if (response) {
                  return response;
                }
                // If no cached response, return a JSON error
                return new Response(
                  JSON.stringify({ 
                    error: 'Network request failed and no cached data available',
                    offline: true 
                  }),
                  { 
                    status: 503,
                    headers: { 'Content-Type': 'application/json' } 
                  }
                );
              });
          })
      );
    } else {
      // For non-GET API requests, use background sync when offline
      if (!navigator.onLine) {
        // Queue the request for background sync
        event.respondWith(
          new Response(
            JSON.stringify({ 
              message: 'Your request has been queued and will be processed when you are back online.',
              queued: true 
            }),
            { 
              status: 202,
              headers: { 'Content-Type': 'application/json' } 
            }
          )
        );
        
        // Add to background sync queue
        event.waitUntil(
          addToSyncQueue(event.request.clone())
        );
      } else {
        // If online, proceed with the fetch
        event.respondWith(fetch(event.request));
      }
    }
    return;
  }
  
  // Handle asset requests - Cache first, network fallback
  if (isAssetRequest(url)) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            // Update cache in the background
            event.waitUntil(
              fetch(event.request)
                .then((networkResponse) => {
                  if (networkResponse && networkResponse.ok) {
                    caches.open(CACHE_NAME)
                      .then((cache) => cache.put(event.request, networkResponse));
                  }
                })
                .catch(() => {})
            );
            return response;
          }
          
          // If not in cache, fetch from network and cache
          return fetch(event.request)
            .then((networkResponse) => {
              if (!networkResponse || !networkResponse.ok) {
                return networkResponse;
              }
              
              // Clone the response to cache it and return it
              const responseToCache = networkResponse.clone();
              event.waitUntil(
                caches.open(CACHE_NAME)
                  .then((cache) => cache.put(event.request, responseToCache))
              );
              return networkResponse;
            })
            .catch((error) => {
              console.error('[ServiceWorker] Fetch error:', error);
              // For image requests, return fallback image
              if (event.request.destination === 'image') {
                return caches.match('/icons/fallback-image.svg');
              }
              throw error;
            });
        })
    );
    return;
  }
  
  // Handle navigation requests - Network first with cache fallback
  if (isNavigationRequest(event.request)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache the response for future use
          const responseToCache = response.clone();
          event.waitUntil(
            caches.open(CACHE_NAME)
              .then((cache) => cache.put(event.request, responseToCache))
          );
          return response;
        })
        .catch(() => {
          // If offline, try to serve from cache
          return caches.match(event.request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // If not in cache, serve the offline page
              return caches.match('/offline');
            });
        })
    );
    return;
  }
  
  // Default fetch behavior for other requests
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
      .catch(() => {
        // If both cache and network fail, return a simple error response
        return new Response('Network error occurred', { status: 503 });
      })
  );
});

// Network with timeout helper
function networkWithTimeout(request, timeout) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(reject, timeout);
    
    fetch(request).then((response) => {
      clearTimeout(timeoutId);
      resolve(response);
    }, reject);
  });
}

// Background sync queue
const syncQueue = [];

// Add request to sync queue
async function addToSyncQueue(request) {
  try {
    // Clone the request to read its body
    const requestClone = request.clone();
    const body = await requestClone.text();
    
    // Store the request details
    syncQueue.push({
      url: request.url,
      method: request.method,
      headers: Array.from(request.headers.entries()),
      body: body,
      timestamp: Date.now()
    });
    
    // Store the queue in IndexedDB
    await storeQueue();
    
    // Register a sync if supported
    if ('sync' in self.registration) {
      await self.registration.sync.register('fibroguardian-sync');
    }
  } catch (error) {
    console.error('[ServiceWorker] Error adding to sync queue:', error);
  }
}

// Store queue in IndexedDB
async function storeQueue() {
  // Implementation would store syncQueue in IndexedDB
  // This is a simplified version
  console.log('[ServiceWorker] Stored sync queue:', syncQueue);
}

// Sync event - process queued requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'fibroguardian-sync') {
    event.waitUntil(processQueue());
  }
});

// Process the sync queue
async function processQueue() {
  try {
    // Process each queued request
    const promises = syncQueue.map(async (queuedRequest) => {
      try {
        // Recreate the request
        const request = new Request(queuedRequest.url, {
          method: queuedRequest.method,
          headers: new Headers(queuedRequest.headers),
          body: queuedRequest.body,
          mode: 'cors',
          credentials: 'include'
        });
        
        // Send the request
        const response = await fetch(request);
        
        // Check if successful
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        
        console.log('[ServiceWorker] Successfully processed queued request:', queuedRequest.url);
        return true;
      } catch (error) {
        console.error('[ServiceWorker] Error processing queued request:', error);
        return false;
      }
    });
    
    // Wait for all requests to complete
    const results = await Promise.all(promises);
    
    // Remove successful requests from the queue
    syncQueue.filter((_, index) => !results[index]);
    
    // Update the stored queue
    await storeQueue();
  } catch (error) {
    console.error('[ServiceWorker] Error processing queue:', error);
  }
}

// Push notification event
self.addEventListener('push', (event) => {
  if (!event.data) {
    console.log('[ServiceWorker] Push received but no data');
    return;
  }
  
  try {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'Nieuwe melding van FibroGuardian',
      icon: '/logo.png',
      badge: '/favicon-16x16.png',
      data: data.data || {},
      actions: data.actions || [],
      vibrate: [100, 50, 100],
      tag: data.tag || 'fibroguardian-notification',
      renotify: data.renotify || false
    };
    
    event.waitUntil(
      self.registration.showNotification(
        data.title || 'FibroGuardian',
        options
      )
    );
  } catch (error) {
    console.error('[ServiceWorker] Error showing notification:', error);
    
    // Fallback to simple notification
    event.waitUntil(
      self.registration.showNotification('FibroGuardian', {
        body: 'Er is een nieuwe melding beschikbaar',
        icon: '/logo.png'
      })
    );
  }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/dashboard';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then((clientList) => {
        // Check if a window is already open
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Message event - handle messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Log service worker lifecycle events
self.addEventListener('statechange', (event) => {
  console.log('[ServiceWorker] State changed:', self.state);
});
