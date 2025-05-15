'use client';
import { useAuth } from '@/components/auth/AuthProvider';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase';

export default function Topbar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [profileName, setProfileName] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase
          .from('profiles')
          .select('voornaam, achternaam, avatar_url')
          .eq('id', user.id)
          .single();
        if (error) {
          console.error('Error fetching profile for topbar:', error);
        } else if (data) {
          setProfileName(`${data.voornaam || ''} ${data.achternaam || ''}`.trim() || user.email || 'Gebruiker');
          setAvatarUrl(data.avatar_url);
        }
      } else {
        setProfileName('');
        setAvatarUrl(null);
      }
    };
    fetchProfile();
  }, [user]);

  // Determine current page title based on pathname (simplified)
  const getPageTitle = () => {
    if (pathname.startsWith('/dashboard')) return 'Dashboard';
    if (pathname.startsWith('/taken')) return 'Mijn Taken';
    if (pathname.startsWith('/reflecties')) return 'Mijn Reflecties';
    if (pathname.startsWith('/rapporten')) return 'Mijn Rapporten';
    if (pathname.startsWith('/instellingen')) return 'Instellingen';
    if (pathname.startsWith('/specialisten/patienten')) return 'Mijn Patiënten';
    if (pathname.startsWith('/specialisten/patient/')) return 'Patiënt Details';
    return 'FibroGuardian';
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-20 md:z-10"> {/* Ensure it's above sidebar on mobile when sidebar is static */}
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Page Title or Breadcrumbs */}
        <div className="flex items-center">
           {/* Mobile menu button placeholder - actual button is in Sidebar for layout reasons */}
          <div className="md:hidden w-10 h-10 mr-2"></div> {/* Spacer for mobile menu button */}
          <h1 className="text-lg font-semibold text-gray-700">{getPageTitle()}</h1>
        </div>

        {/* User Profile / Actions */}
        <div className="flex items-center space-x-4">
          {/* Notifications (Placeholder) */}
          <button className="text-gray-500 hover:text-gray-700 focus:outline-none" aria-label="Notificaties">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>

          {/* Profile Dropdown (Simplified) */}
          {user ? (
            <Link href="/instellingen/profiel" className="flex items-center space-x-2 group">
              <div className="h-8 w-8 rounded-full bg-purple-200 flex items-center justify-center overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profielfoto" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm font-medium text-purple-700">
                    {profileName?.split(' ').map(n => n[0]).join('').toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-purple-600 hidden sm:block">
                {profileName || user.email}
              </span>
            </Link>
          ) : (
            <Link href="/auth/login" className="text-sm font-medium text-purple-600 hover:text-purple-800">
              Inloggen
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}