import './globals.css'; // Keep this at the top
import { ReactQueryProvider } from '@/lib/react-query-provider';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { NotificationProvider } from '@/context/NotificationContext';
// import NotificationSystem from '@/components/common/NotificationSystem'; // Removed unused import
import SkipLink from '@/components/common/SkipLink';
import { ReactNode } from 'react'; // Import ReactNode
import type { Viewport } from 'next'; // Import Viewport type

// It's generally better to put PWA related tags directly in the <head>
// The 'metadata' object is more for SEO and OpenGraph, though Next.js tries to map some.
export const metadata = {
  title: 'FibroGuardian Pro',
  description: 'Een app voor fibromyalgiepatiënten om dagelijkse activiteiten en gezondheidsmetrieken te beheren.',
  manifest: '/manifest.json',
  // themeColor: '#7c3aed', // Will be handled by generateViewport
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default', // Or 'black-translucent'
    title: 'FibroGuardian Pro',
  },
  icons: {
    icon: [ // General purpose icons
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' }, // Example, covered by manifest too
    ],
    shortcut: ['/icons/favicon.ico'], // For older browsers
    apple: [ // Apple touch icons
      { url: '/icons/apple-touch-icon.png' }, // Default Apple touch icon
      // You can add more sizes if needed, e.g.
      // { url: '/icons/apple-icon-180x180.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [ // Other specific icons like for Android Chrome
      { rel: 'icon', url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
  },
  // viewport is handled by Next.js by default, but we customized it.
  // The manual <meta name="viewport"...> below will take precedence if not removed,
  // or Next.js will add its own if this viewport field is not in metadata.
    // For clarity, we'll keep the manual one for now as it was specifically set.
};

export function generateViewport(): Viewport {
  return {
    themeColor: '#7c3aed',
    // width: 'device-width', // These are typically part of the viewport meta tag itself
    // initialScale: 1,      // rather than themeColor descriptor.
                            // The manual viewport meta tag below handles width/initialScale.
  };
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (<html lang="nl-NL">{/* Ensure consistent casing */}
<head>
        {/* Viewport is set here to ensure it's exactly as desired, overriding Next.js default if any */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* theme-color is now handled by generateViewport */}
        {/* manifest.json is now linked via metadata object */}
        {/* Other PWA related meta tags like application-name, apple-mobile-web-app-capable etc. 
            are often derived from the manifest or covered by metadata's appleWebApp field.
            We will remove the commented out manual tags that are now covered.
        */}
        {/* <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />  */}
        {/* Favicon links are now handled by metadata.icons */}
        {/* <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" /> */}
        {/* <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" /> */}
        {/* <link rel="shortcut icon" href="/icons/favicon.ico" /> */}
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
