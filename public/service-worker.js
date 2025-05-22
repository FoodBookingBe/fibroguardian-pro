// FibroGuardian Pro Service Worker
const CACHE_NAME = 'fibroguardian-cache-v1';

// Resources to cache immediately on install
const PRECACHE_RESOURCES = [
  '/',
  '/offline.html',
  '/logo.png',
  '/logo-white.png',
  '/manifest.json',
  '/favicon-16x16.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/fonts/inter-var.woff2'
];

// Critical API routes to cache on first use
const CRITICAL_API_ROUTES = [
  '/api/profiles/me',
  '/api/tasks',
  '/api/reflecties'
];

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing Service Worker...');
  
  // Skip waiting to ensure the new service worker activates immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Precaching resources');
        return cache.addAll(PRECACHE_RESOURCES);
      })
      .catch((error) => {
        console.error('[Service Worker] Precaching failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating Service Worker...');
  
  // Claim clients to ensure the service worker controls all clients immediately
  event.waitUntil(self.clients.claim());
  
  // Clean up old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Helper function to determine if a request is an API request
const isApiRequest = (url) => {
  return url.pathname.startsWith('/api/');
};

// Helper function to determine if a request is a critical API request
const isCriticalApiRequest = (url) => {
  return CRITICAL_API_ROUTES.some(route => url.pathname.startsWith(route));
};

// Helper function to determine if a request is a navigation request
const isNavigationRequest = (request) => {
  return request.mode === 'navigate';
};

// Helper function to determine if a request is for a static asset
const isStaticAsset = (url) => {
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2', '.ttf', '.eot'];
  return staticExtensions.some(ext => url.pathname.endsWith(ext));
};

// Fetch event - handle network requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }
  
  // Strategy for API requests
  if (isApiRequest(url)) {
    if (isCriticalApiRequest(url)) {
      // For critical API routes: network first, then cache, fall back to offline JSON
      event.respondWith(
        fetch(event.request)
          .then((response) => {
            // Cache the successful response
            const clonedResponse = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clonedResponse);
            });
            return response;
          })
          .catch(() => {
            // Try to get from cache
            return caches.match(event.request)
              .then((cachedResponse) => {
                if (cachedResponse) {
                  return cachedResponse;
                }
                
                // If not in cache, return a basic JSON response
                return new Response(
                  JSON.stringify({
                    error: 'offline',
                    message: 'You are currently offline. This data will be updated when you reconnect.'
                  }),
                  {
                    headers: { 'Content-Type': 'application/json' }
                  }
                );
              });
          })
      );
    } else {
      // For non-critical API routes: network only
      return;
    }
  }
  // Strategy for navigation requests
  else if (isNavigationRequest(event.request)) {
    // For navigation: network first, then cache, fall back to offline page
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache the successful response
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clonedResponse);
          });
          return response;
        })
        .catch(() => {
          // Try to get from cache
          return caches.match(event.request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              
              // If not in cache, return the offline page
              return caches.match('/offline.html');
            });
        })
    );
  }
  // Strategy for static assets
  else if (isStaticAsset(url)) {
    // For static assets: cache first, then network
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            // Return cached response
            return cachedResponse;
          }
          
          // If not in cache, fetch from network and cache
          return fetch(event.request)
            .then((response) => {
              // Cache the successful response
              const clonedResponse = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, clonedResponse);
              });
              return response;
            });
        })
    );
  }
  // Default strategy for all other requests
  else {
    // Network first, then cache
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache the successful response
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clonedResponse);
          });
          return response;
        })
        .catch(() => {
          // Try to get from cache
          return caches.match(event.request);
        })
    );
  }
});

// Background sync for offline form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-reflecties') {
    event.waitUntil(syncReflecties());
  } else if (event.tag === 'sync-task-logs') {
    event.waitUntil(syncTaskLogs());
  }
});

// Function to sync reflecties when back online
async function syncReflecties() {
  try {
    // Open IndexedDB
    const db = await openIndexedDB('fibroguardian-offline-db', 'reflecties');
    
    // Get all stored reflecties
    const offlineReflecties = await getAllItems(db, 'reflecties');
    
    // Process each reflectie
    for (const reflectie of offlineReflecties) {
      try {
        // Try to send to server
        const response = await fetch('/api/reflecties', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(reflectie.data)
        });
        
        if (response.ok) {
          // If successful, remove from IndexedDB
          await deleteItem(db, 'reflecties', reflectie.id);
        }
      } catch (error) {
        console.error('[Service Worker] Error syncing reflectie:', error);
      }
    }
  } catch (error) {
    console.error('[Service Worker] Error in syncReflecties:', error);
  }
}

// Function to sync task logs when back online
async function syncTaskLogs() {
  try {
    // Open IndexedDB
    const db = await openIndexedDB('fibroguardian-offline-db', 'taskLogs');
    
    // Get all stored task logs
    const offlineTaskLogs = await getAllItems(db, 'taskLogs');
    
    // Process each task log
    for (const taskLog of offlineTaskLogs) {
      try {
        // Try to send to server
        const response = await fetch('/api/task-logs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(taskLog.data)
        });
        
        if (response.ok) {
          // If successful, remove from IndexedDB
          await deleteItem(db, 'taskLogs', taskLog.id);
        }
      } catch (error) {
        console.error('[Service Worker] Error syncing task log:', error);
      }
    }
  } catch (error) {
    console.error('[Service Worker] Error in syncTaskLogs:', error);
  }
}

// Helper function to open IndexedDB
function openIndexedDB(dbName, storeName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);
    
    request.onerror = (event) => {
      reject('Error opening IndexedDB');
    };
    
    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: 'id' });
      }
    };
  });
}

// Helper function to get all items from IndexedDB
function getAllItems(db, storeName) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    
    request.onerror = (event) => {
      reject('Error getting items from IndexedDB');
    };
    
    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
  });
}

// Helper function to delete an item from IndexedDB
function deleteItem(db, storeName, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);
    
    request.onerror = (event) => {
      reject('Error deleting item from IndexedDB');
    };
    
    request.onsuccess = (event) => {
      resolve();
    };
  });
}

// Push notification event
self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }
  
  try {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'Nieuwe melding van FibroGuardian Pro',
      icon: '/icons/icon-192x192.png',
      badge: '/favicon-16x16.png',
      data: {
        url: data.url || '/'
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'FibroGuardian Pro', options)
    );
  } catch (error) {
    console.error('[Service Worker] Error showing notification:', error);
    
    // Fallback for non-JSON data
    const message = event.data.text();
    
    event.waitUntil(
      self.registration.showNotification('FibroGuardian Pro', {
        body: message,
        icon: '/icons/icon-192x192.png',
        badge: '/favicon-16x16.png'
      })
    );
  }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const url = event.notification.data && event.notification.data.url ? event.notification.data.url : '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});
