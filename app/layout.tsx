import './globals.css';
import { ReactQueryProvider } from '@/lib/react-query-provider';
import { AuthProvider } from '@/components/auth/AuthProvider';
import SkipLink from '@/components/common/SkipLink';

export const metadata = {
  title: 'FibroGuardian Pro',
  description: 'Een app voor fibromyalgiepatiënten om dagelijkse activiteiten en gezondheidsmetrieken te beheren',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="nl">
      <body>
        <SkipLink />
        <ReactQueryProvider>
          <AuthProvider>
            <main id="main-content">
              {children}
            </main>
          </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}