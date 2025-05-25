
// components/ui/NotificationList.tsx
import { Notification } from '@/context/NotificationContext';
import { ReactNode, useEffect, useState } from 'react'; // Import ReactNode

interface NotificationListProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

export function NotificationList({ notifications, onDismiss }: NotificationListProps) {
  if (!notifications || notifications.length === 0) {
    return <></>; // Empty fragment instead of null
  }

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-3 max-w-xs sm:max-w-sm w-full"> {/* Increased z-index, gap, w-full */}
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
}

interface NotificationItemProps {
  notification: Notification; // Notification type now includes action, isHtml, icon
  onDismiss: (id: string) => void;
}

function NotificationItem({ notification, onDismiss }: NotificationItemProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    return undefined; // Add default return
  }, []);

  const typeStyles = {
    success: 'bg-green-100 border-green-500 text-green-800', // Adjusted colors for better contrast/look
    error: 'bg-red-100 border-red-500 text-red-800',
    warning: 'bg-yellow-100 border-yellow-500 text-yellow-800',
    info: 'bg-blue-100 border-blue-500 text-blue-800',
  };

  // Default icons, can be overridden by notification.icon
  const defaultTypeIcons: Record<Notification['type'], ReactNode> = {
    success: (
      <svg className="h-6 w-6 text-green-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"> {/* Increased size slightly */}
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
    error: (
      <svg className="h-6 w-6 text-red-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    ),
    warning: (
      <svg className="h-6 w-6 text-yellow-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
    info: (
      <svg className="h-6 w-6 text-blue-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    ),
  };

  const iconToRender = notification.icon || defaultTypeIcons[notification.type];

  return (
    <div
      className={`transform transition-all duration-300 ease-in-out ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'} border-l-4 ${typeStyles[notification.type]} p-4 shadow-lg rounded-md flex items-start w-full`}
      role="alert"
      aria-live={notification.type === 'error' ? 'assertive' : 'polite'}
    >
      <div className="flex-shrink-0 mr-3">
        {iconToRender}
      </div>
      <div className="flex-grow">
        {notification.isHtml ? (
          <div className="text-sm font-medium" dangerouslySetInnerHTML={{ __html: notification.message }} />
        ) : (
          <p className="text-sm font-medium">{notification.message}</p>
        )}
        {notification.action && (
          <button
            onClick={notification.action.onClick}
            className="mt-2 text-xs font-semibold underline hover:opacity-80" // Adjusted style
          >
            {notification.action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        className="ml-3 -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex items-center justify-center h-8 w-8 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
        onClick={() => onDismiss(notification.id)}
        aria-label="Sluiten"
      >
        <span className="sr-only">Sluiten</span>
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
