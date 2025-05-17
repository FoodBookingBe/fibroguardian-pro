'use client';
// import { useEffect } from 'react'; // No longer needed for auto-dismissal here
import { useNotification, Notification } from '@/context/NotificationContext';

const NotificationSystem = () => {
  const { notifications, removeNotification } = useNotification(); // Destructure notifications directly

  // Auto-dismissal logic is handled by NotificationProvider.
  // This component is now purely for rendering the notifications from context.

  if (notifications.length === 0) {
    return null;
  }

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>;
      case 'error':
        return <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>; // Changed icon for error
      case 'warning':
        return <svg className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
      case 'info':
      default:
        return <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    }
  };

  const getBgColor = (type: Notification['type']) => { // Use imported Notification['type']
    switch (type) {
      case 'success': return 'bg-green-50 border-green-300 text-green-700'; // Added text color
      case 'error': return 'bg-red-50 border-red-300 text-red-700';
      case 'warning': return 'bg-yellow-50 border-yellow-300 text-yellow-700';
      case 'info':
      default: return 'bg-blue-50 border-blue-300 text-blue-700';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-[100] w-full max-w-xs sm:max-w-sm space-y-3 pointer-events-none"> {/* Increased z-index */}
      {notifications.map((notification: Notification) => ( // Explicitly type notification
        <div
          key={notification.id}
          className={`rounded-md shadow-lg border p-4 pointer-events-auto transition-all duration-300 ease-out transform
                      ${getBgColor(notification.type)}
                      animate-fadeInRight`} // Added animation class (needs to be defined in CSS)
          role="alert"
          aria-live={(notification.type === 'error' || notification.type === 'warning') ? 'assertive' : 'polite'} // Ensure expression is clean
        >
          <div className="flex items-start">
            <div className="flex-shrink-0 mt-0.5"> {/* Adjusted margin */}
              {getIcon(notification.type)}
            </div>
            <div className="ml-3 w-0 flex-1">
              <p className="text-sm font-medium">
                {notification.message}
              </p>
              {/* notification.details was removed as it's not in Notification type */}
            </div>
            <div className="ml-4 flex-shrink-0 flex">
              <button
                className={`inline-flex rounded-md p-1 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    notification.type === 'success' ? 'hover:bg-green-100 focus:ring-green-600 focus:ring-offset-green-50' :
                    notification.type === 'error'   ? 'hover:bg-red-100 focus:ring-red-600 focus:ring-offset-red-50' :
                    notification.type === 'warning' ? 'hover:bg-yellow-100 focus:ring-yellow-600 focus:ring-offset-yellow-50' :
                                                      'hover:bg-blue-100 focus:ring-blue-600 focus:ring-offset-blue-50'
                }`}
                onClick={() => removeNotification(notification.id)}
                aria-label="Sluit notificatie"
              >
                <span className="sr-only">Sluit</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Add a simple fadeInRight animation to globals.css or a dedicated animation CSS file:
/*
@keyframes fadeInRight {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
.animate-fadeInRight {
  animation: fadeInRight 0.3s ease-out forwards;
}
*/

export default NotificationSystem;