'use client';
import React, { createContext, useContext, useReducer, ReactNode, Dispatch, useCallback } from 'react'; // Added Dispatch and useCallback

type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification { // Exporting for potential use elsewhere
  id: string;
  message: string;
  type: NotificationType;
  duration?: number; // In milliseconds
  details?: string; // Optional more details
}

interface NotificationState {
  notifications: Notification[];
}

// Define a more specific type for the payload of ADD_NOTIFICATION
type AddNotificationPayload = Omit<Notification, 'id'>;

type NotificationAction = 
  | { type: 'ADD_NOTIFICATION'; payload: AddNotificationPayload }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }; // Payload is the id of the notification to remove

interface NotificationContextType {
  state: NotificationState;
  addNotification: (notification: AddNotificationPayload) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

function notificationReducer(state: NotificationState, action: NotificationAction): NotificationState {
  switch (action.type) {
    case 'ADD_NOTIFICATION':
      // Prevent duplicate messages if desired, or allow them
      // For now, allowing duplicates as IDs will be unique
      return {
        ...state,
        notifications: [
          ...state.notifications,
          {
            id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, // More unique ID
            ...action.payload,
          },
        ],
      };
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(
          notification => notification.id !== action.payload
        ),
      };
    default:
      // For exhaustive check, though not strictly necessary with TypeScript
      // const _exhaustiveCheck: never = action; 
      return state;
  }
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(notificationReducer, {
    notifications: [],
  });

  const addNotification = useCallback((notification: AddNotificationPayload) => {
    const newId = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    dispatch({ 
      type: 'ADD_NOTIFICATION', 
      // Manually construct the full notification object with ID here
      // to ensure the setTimeout uses the correct ID generated at this point.
      payload: { ...notification, id: newId } as Notification 
    });

    if (notification.duration) {
      setTimeout(() => {
        dispatch({ 
          type: 'REMOVE_NOTIFICATION', 
          payload: newId // Use the ID generated when adding
        });
      }, notification.duration);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]); // dispatch is stable, but include if ESLint insists

  const removeNotification = useCallback((id: string) => {
    dispatch({ 
      type: 'REMOVE_NOTIFICATION', 
      payload: id 
    });
  }, [dispatch]); // dispatch is stable

  return (
    <NotificationContext.Provider
      value={{
        state,
        addNotification,
        removeNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}