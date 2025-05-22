
// Fix voor ontbrekende property 'addNotification' op Element type
declare module "react" {
  interface Element {
    addNotification?: unknown;
  }
}
import React from 'react';
'use client';

import { useEffect } from 'react';

import { useNotification } from '@/context/NotificationContext';
import { initializeOfflineSupport, isOnline } from '@/utils/service-worker';

export default function ServiceWorkerInitializer(): JSX.Element {
  const { addNotification } = useNotification();
  
  useEffect(() => {
    // Initialize service worker
    initializeOfflineSupport().catch(error => {
      console.error('Failed to initialize service worker:', error);
    });
    
    // Listen for online/offline events
    const handleOnline = () => {
      addNotification({
        type: 'success',
        message: 'Online: U bent weer online. Uw gegevens worden gesynchroniseerd.',
        duration: 5000
      });
    };
    
    const handleOffline = () => {
      addNotification({
        type: 'warning',
        message: 'Offline: U bent offline. Sommige functies zijn nog steeds beschikbaar.',
        duration: 5000
      });
    };
    
    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Show initial status notification if offline
    if (!isOnline()) {
      addNotification({
        type: 'warning',
        message: 'Offline: U bent offline. Sommige functies zijn nog steeds beschikbaar.',
        duration: 5000
      });
    }
    
    // Listen for service worker update events
    const handleServiceWorkerUpdate = (event: CustomEvent) => {
      const registration = event.detail;
      
      addNotification({
        type: 'info',
        message: 'Update beschikbaar: Er is een nieuwe versie van de app beschikbaar. Vernieuw de pagina om de update te installeren.',
        duration: 0, // Don't auto-dismiss
        action: {
          label: 'Vernieuwen',
          onClick: () => {
            if (registration && registration.waiting) {
              registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            } else {
              window.location.reload();
            }
          }
        }
      });
    };
    
    window.addEventListener('serviceWorkerUpdateReady', handleServiceWorkerUpdate as EventListener);
    
    // Clean up event listeners
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('serviceWorkerUpdateReady', handleServiceWorkerUpdate as EventListener);
    };
  }, [addNotification]);
  
  // This component doesn't render anything
  return <></>; // Empty fragment instead of null
}
