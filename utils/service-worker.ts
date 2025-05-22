/**
 * Service Worker Registration Utility
 * 
 * This utility handles the registration and management of the service worker
 * for offline support and caching in FibroGuardian Pro.
 */

// Check if service workers are supported
export const isServiceWorkerSupported = () => {
  return 'serviceWorker' in navigator;
};

// Register the service worker
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!isServiceWorkerSupported()) {
    console.warn('Service workers are not supported in this browser.');
    return null;
  }
  
  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/'
    });
    
    console.log('Service Worker registered successfully:', registration);
    
    // Check if there's a waiting service worker
    if (registration.waiting) {
      console.log('New Service Worker is waiting to activate.');
      notifyUserOfUpdate(registration);
    }
    
    // Listen for new service workers
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      
      if (!newWorker) return;
      
      console.log('New Service Worker is installing...');
      
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('New Service Worker is installed and waiting.');
          notifyUserOfUpdate(registration);
        }
      });
    });
    
    // Listen for controller changes
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      
      console.log('New Service Worker is activated, reloading page...');
      refreshing = true;
      window.location.reload();
    });
    
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
};

// Unregister all service workers
export const unregisterServiceWorkers = async (): Promise<boolean> => {
  if (!isServiceWorkerSupported()) {
    return false;
  }
  
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    
    for (const registration of registrations) {
      await registration.unregister();
      console.log('Service Worker unregistered successfully.');
    }
    
    return true;
  } catch (error) {
    console.error('Service Worker unregistration failed:', error);
    return false;
  }
};

// Update the service worker
export const updateServiceWorker = async (): Promise<void> => {
  if (!isServiceWorkerSupported()) {
    return;
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Check for updates
    await registration.update();
    console.log('Service Worker update check completed.');
  } catch (error) {
    console.error('Service Worker update check failed:', error);
  }
};

// Notify the user of a service worker update
const notifyUserOfUpdate = (registration: ServiceWorkerRegistration): void => {
  // Create a custom event that can be listened to by the application
  const event = new CustomEvent('serviceWorkerUpdateReady', { detail: registration });
  window.dispatchEvent(event);
  
  // You could also show a notification or UI element here
  console.log('New version of the application is available. Refresh to update.');
};

// Check if the user is online
export const isOnline = (): boolean => {
  return navigator.onLine;
};

// Listen for online/offline events
export const setupOnlineOfflineListeners = (
  onOnline: () => void = () => {},
  onOffline: () => void = () => {}
): () => void => {
  const handleOnline = () => {
    console.log('Application is online.');
    onOnline();
  };
  
  const handleOffline = () => {
    console.log('Application is offline.');
    onOffline();
  };
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  // Return a cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

// Define types for offline data
export interface OfflineData {
  [key: string]: unknown;
}

// Store data in IndexedDB for offline use
export const storeOfflineData = async (
  storeName: string,
  data: OfflineData,
  id?: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const dbName = 'fibroguardian-offline-db';
    const request = indexedDB.open(dbName, 1);
    
    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB.'));
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: 'id' });
      }
    };
    
    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      
      // Generate a unique ID if not provided
      const itemId = id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const item = {
        id: itemId,
        data,
        timestamp: Date.now()
      };
      
      const storeRequest = store.put(item);
      
      storeRequest.onerror = () => {
        reject(new Error('Failed to store data in IndexedDB.'));
      };
      
      storeRequest.onsuccess = () => {
        resolve(itemId);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    };
  });
};

// Retrieve data from IndexedDB
export const getOfflineData = async (
  storeName: string,
  id: string
): Promise<OfflineData | null> => {
  return new Promise((resolve, reject) => {
    const dbName = 'fibroguardian-offline-db';
    const request = indexedDB.open(dbName, 1);
    
    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB.'));
    };
    
    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(storeName)) {
        resolve(null);
        return;
      }
      
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const getRequest = store.get(id);
      
      getRequest.onerror = () => {
        reject(new Error('Failed to retrieve data from IndexedDB.'));
      };
      
      getRequest.onsuccess = (event) => {
        const result = (event.target as IDBRequest).result;
        resolve(result ? result.data : null);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    };
  });
};

// Get all offline data from a store
export const getAllOfflineData = async (
  storeName: string
): Promise<OfflineData[]> => {
  return new Promise((resolve, reject) => {
    const dbName = 'fibroguardian-offline-db';
    const request = indexedDB.open(dbName, 1);
    
    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB.'));
    };
    
    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(storeName)) {
        resolve([]);
        return;
      }
      
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const getAllRequest = store.getAll();
      
      getAllRequest.onerror = () => {
        reject(new Error('Failed to retrieve data from IndexedDB.'));
      };
      
      getAllRequest.onsuccess = (event) => {
        const results = (event.target as IDBRequest).result;
        resolve(results.map((item: { data: OfflineData }) => item.data));
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    };
  });
};

// Delete data from IndexedDB
export const deleteOfflineData = async (
  storeName: string,
  id: string
): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const dbName = 'fibroguardian-offline-db';
    const request = indexedDB.open(dbName, 1);
    
    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB.'));
    };
    
    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(storeName)) {
        resolve(false);
        return;
      }
      
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const deleteRequest = store.delete(id);
      
      deleteRequest.onerror = () => {
        reject(new Error('Failed to delete data from IndexedDB.'));
      };
      
      deleteRequest.onsuccess = () => {
        resolve(true);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    };
  });
};

// Extend ServiceWorkerRegistration interface to include sync property
interface ExtendedServiceWorkerRegistration extends ServiceWorkerRegistration {
  sync?: {
    register(tag: string): Promise<void>;
  };
}

// Trigger a background sync
export const triggerBackgroundSync = async (
  syncTag: string
): Promise<boolean> => {
  if (!isServiceWorkerSupported() || !('SyncManager' in window)) {
    console.warn('Background Sync is not supported in this browser.');
    return false;
  }
  
  try {
    const registration = await navigator.serviceWorker.ready as ExtendedServiceWorkerRegistration;
    
    if (!registration.sync) {
      console.warn('Background Sync API is not available.');
      return false;
    }
    
    await registration.sync.register(syncTag);
    console.log(`Background Sync registered with tag: ${syncTag}`);
    return true;
  } catch (error) {
    console.error('Failed to register Background Sync:', error);
    return false;
  }
};

// Initialize the service worker and offline support
export const initializeOfflineSupport = async (): Promise<void> => {
  // Register the service worker
  await registerServiceWorker();
  
  // Setup online/offline listeners
  setupOnlineOfflineListeners(
    // Online callback
    () => {
      console.log('Application is back online. Syncing data...');
      
      // Trigger background syncs
      triggerBackgroundSync('sync-reflecties');
      triggerBackgroundSync('sync-task-logs');
    },
    // Offline callback
    () => {
      console.log('Application is offline. Data will be stored locally.');
    }
  );
  
  // Check for updates periodically
  setInterval(() => {
    updateServiceWorker();
  }, 60 * 60 * 1000); // Check every hour
};
