import './globals.css'; // Keep this at the top
import { ReactQueryProvider } from '@/lib/react-query-provider';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { NotificationProvider } from '@/context/NotificationContext';
// import NotificationSystem from '@/components/common/NotificationSystem'; // Removed unused import
import SkipLink from '@/components/common/SkipLink';
import { ReactNode } from 'react'; // Import ReactNode

// It's generally better to put PWA related tags directly in the <head>
// The 'metadata' object is more for SEO and OpenGraph, though Next.js tries to map some.
export const metadata = {
  title: 'FibroGuardian Pro',
  description: 'Een app voor fibromyalgiepatiënten om dagelijkse activiteiten en gezondheidsmetrieken te beheren.',
  // manifest: '/manifest.json', // This will be linked in <head> directly
  // themeColor: '#7c3aed', // This will be in <head>
  // appleWebApp: { // These are better as direct meta tags
  //   capable: true,
  //   statusBarStyle: 'default',
  //   title: 'FibroGuardian',
  // },
  // viewport: 'width=device-width, initial-scale=1, maximum-scale=1', // This will be in <head>
};

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (<html lang="nl-NL">{/* Ensure consistent casing */}
<head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#7c3aed" />
        {/* <link rel="manifest" href="/manifest.json" /> */}
        {/* <meta name="application-name" content="FibroGuardian Pro" /> */}
        {/* <meta name="apple-mobile-web-app-capable" content="yes" /> */}
        {/* <meta name="apple-mobile-web-app-status-bar-style" content="default" /> */}
        {/* <meta name="apple-mobile-web-app-title" content="FibroGuardian Pro" /> */}
        {/* <meta name="format-detection" content="telephone=no" /> */}
        {/* <meta name="mobile-web-app-capable" content="yes" /> */}
        {/* <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />  */}
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="shortcut icon" href="/icons/favicon.ico" />
        {/* <link rel="icon" href="/icons/icon-192x192.png" sizes="192x192" type="image/png"/> */}
        {/* <link rel="icon" href="/icons/icon-512x512.png" sizes="512x512" type="image/png"/> */}
</head>
<body>
        <SkipLink />
        <ReactQueryProvider>
          <AuthProvider>
            <NotificationProvider>
              {/* NotificationList is rendered inside NotificationProvider */}
              <main id="main-content" className="flex-grow"> {/* Ensure main can grow */}
                {children}
              </main>
            </NotificationProvider>
          </AuthProvider>
        </ReactQueryProvider>
</body>
</html>);
}
