// Service Worker for offline functionality and caching
const CACHE_NAME = 'fibroguardian-v1.1'; // Increment version on significant changes

// Resources to pre-cache on install
const PRECACHE_ASSETS = [
  '/', // Home page
  '/offline.html', // Dedicated offline fallback page
  '/manifest.json',
  // Key icons (ensure these paths are correct and files exist)
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // '/logo.png', // Assuming logo.png is in /public
  // Add other critical static assets like a global CSS file if not inlined or handled by Next.js build
];

// Install service worker and pre-cache important resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Pre-caching offline page and core assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('[ServiceWorker] Skip waiting on install');
        return self.skipWaiting(); // Activate new SW immediately
      })
      .catch(error => {
        console.error('[ServiceWorker] Pre-caching failed:', error);
      })
  );
});

// Clean up old caches upon activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[ServiceWorker] Claiming clients');
      return self.clients.claim(); // Take control of open clients
    })
  );
});

// Network-first, then cache, then offline fallback for navigation
// Stale-while-revalidate for other assets
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests like Google Fonts, Supabase API (handled by app logic or other caching)
  if (!request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // Skip Chrome extension requests
  if (request.url.startsWith('chrome-extension://')) {
    return;
  }

  // For HTML navigation requests, try network first, then cache, then offline page
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // If network successful, cache the response for future offline use
          if (response.ok) {
            const clonedResponse = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clonedResponse));
          }
          return response;
        })
        .catch(async () => {
          // Network failed, try to get from cache
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          // If not in cache, return the offline fallback page
          return caches.match('/offline.html');
        })
    );
    return;
  }

  // For other static assets (CSS, JS, Images not handled by Next/Image optimization)
  // Use a stale-while-revalidate strategy
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(request).then(cachedResponse => {
        const fetchPromise = fetch(request).then(networkResponse => {
          if (networkResponse.ok) { // Check if the network response is valid
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(error => {
          console.warn('[ServiceWorker] Fetch failed for:', request.url, error);
          // Optionally return a fallback for specific asset types if needed
          // For now, if cache miss and network fails, it will result in browser's default error
        });
        return cachedResponse || fetchPromise;
      });
    })
  );
});

// Listen to messages from the app (e.g., to clear cache)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_CACHE_AND_REFRESH') {
    caches.delete(CACHE_NAME).then(() => {
      console.log('[ServiceWorker] Cache cleared by app message.');
      // Optionally, notify clients to refresh or handle refresh in the app
      // event.ports[0].postMessage({ success: true });
    });
  }
});

// Basic Push Notification handlers (can be expanded)
self.addEventListener('push', (event) => {
  if (!event.data) {
    console.log('[ServiceWorker] Push event but no data');
    return;
  }
  try {
    const data = event.data.json();
    console.log('[ServiceWorker] Push Received:', data);
    const title = data.title || 'FibroGuardian Melding';
    const options = {
      body: data.body || 'Je hebt een nieuwe melding.',
      icon: data.icon || '/icons/icon-192x192.png',
      badge: data.badge || '/icons/badge-72x72.png', // Ensure this icon exists
      vibrate: [100, 50, 100],
      data: { url: data.url || '/' }, // URL to open on click
      actions: data.actions || [] // e.g. [{ action: 'explore', title: 'Bekijk' }]
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch (e) {
    console.error('[ServiceWorker] Error processing push data:', e);
  }
});

self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification click Received.');
  event.notification.close();
  const urlToOpen = event.notification.data.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});