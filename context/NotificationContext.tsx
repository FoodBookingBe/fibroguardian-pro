// context/NotificationContext.tsx
import { createContext, useContext, useState, ReactNode } from 'react';

// Definieer typen voor notificaties
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number; // in milliseconden
}

// Context type
interface NotificationContextType {
  notifications: Notification[];
  addNotification: (type: NotificationType, message: string, duration?: number) => void;
  removeNotification: (id: string) => void;
}

// Context aanmaken
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Provider component
export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const addNotification = (type: NotificationType, message: string, duration = 5000) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 7); // Ensure more unique ID
    setNotifications(prev => [...prev, { id, type, message, duration }]);
    
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
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
