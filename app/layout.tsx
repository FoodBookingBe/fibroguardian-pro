import './globals.css'; // Keep this at the top
import { ReactQueryProvider } from '@/lib/react-query-provider';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { NotificationProvider } from '@/context/NotificationContext';
import NotificationSystem from '@/components/common/NotificationSystem';
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
  return (
    <html lang="nl">
      <head>
        {/* Standard Viewport */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />

        {/* PWA primary color */}
        <meta name="theme-color" content="#7c3aed" />
        
        {/* Web Application Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Apple specific meta tags for PWA */}
        <meta name="application-name" content="FibroGuardian Pro" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="FibroGuardian Pro" /> {/* Consistent title */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* Favicons and Apple Touch Icons (ensure these files exist in /public/icons/) */}
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" /> 
        {/* <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" /> */}
        {/* <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180x180.png" /> */}
        {/* <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-167x167.png" /> */}
        
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
        <link rel="shortcut icon" href="/favicon.ico" />

        {/* Add more icons as needed, e.g. for different resolutions or maskable icons */}
        <link rel="icon" href="/icons/icon-192x192.png" sizes="192x192" type="image/png"/>
        <link rel="icon" href="/icons/icon-512x512.png" sizes="512x512" type="image/png"/>

      </head>
      <body>
        <SkipLink />
        <ReactQueryProvider>
          <AuthProvider>
            <NotificationProvider>
              <NotificationSystem />
              <main id="main-content" className="flex-grow"> {/* Ensure main can grow */}
                {children}
              </main>
            </NotificationProvider>
          </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}