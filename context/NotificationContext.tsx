"use client";
// context/NotificationContext.tsx
import { createContext, useContext, useState, ReactNode } from 'react';

// Definieer typen voor notificaties
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationAction {
  label: string;
  onClick: () => void;
}

export interface Notification {
  id: string;
  type: NotificationType;
  message: string; // Kan HTML bevatten als isHtml true is
  duration?: number; // in milliseconden, 0 of negatief voor persistent
  action?: NotificationAction;
  isHtml?: boolean;
  icon?: React.ReactNode; // Custom icon kan hier worden meegegeven
}

// Context type
interface NotificationContextType {
  notifications: Notification[];
  // Update addNotification signature to accept new properties
  addNotification: (notificationDetails: Omit<Notification, 'id'>) => string; // Returns the ID of the new notification
  removeNotification: (id: string) => void;
}

// Context aanmaken
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Provider component
export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const addNotification = (notificationDetails: Omit<Notification, 'id'>): string => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 7);
    const newNotification: Notification = { 
      id, 
      ...notificationDetails,
      duration: notificationDetails.duration === undefined ? 5000 : notificationDetails.duration, // Default duration
    };
    setNotifications(prev => [...prev, newNotification]);
    
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }
    return id; // Return the ID so it can be programmatically removed if needed
  };
  
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };
  
  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
      {/* NotificationList wordt hier gerenderd om globaal beschikbaar te zijn */}
      {/* De import zal werken zodra NotificationList.tsx is aangemaakt */}
      <NotificationList 
        notifications={notifications} 
        onDismiss={removeNotification} 
      />
    </NotificationContext.Provider>
  );
}

// Hook voor gebruik in componenten
export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification moet binnen een NotificationProvider gebruikt worden');
  }
  return context;
}

// Notification List component (te implementeren in stap 1.2)
// Deze import zal pas werken na creatie van het bestand.
// Voor nu, om circular dependency issues te vermijden bij het direct aanmaken,
// kan deze import tijdelijk gecommentarieerd worden of de NotificationList direct hier gedefinieerd worden.
// Volgens het plan wordt het apart aangemaakt, dus we gaan ervan uit dat dit later werkt.
import { NotificationList } from '@/components/ui/NotificationList';
