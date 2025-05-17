'use client';
import { useState, useEffect, ReactElement } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthProvider';
import { useProfile } from '@/hooks/useSupabaseQuery'; // To get profile type
import SidebarPresentational, { MenuItemP } from '@/components/layout/SidebarPresentational';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'; // For loading state

export default function SidebarContainer() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, session } // Removed unused 'session' variable
    = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const { data: profile, isLoading: isLoadingProfile } = useProfile(user?.id, {
    enabled: !!user, // Only fetch if user is available
  });

  const profileType = profile?.type as 'patient' | 'specialist' | null | undefined;

  const toggleSidebar = () => setIsOpen(!isOpen);

  // Close sidebar on route change or outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const sidebarElement = document.getElementById('sidebar');
      const mobileMenuButton = document.getElementById('mobile-menu-button');
      if (isOpen && sidebarElement && !sidebarElement.contains(e.target as Node) && mobileMenuButton && !mobileMenuButton.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setIsOpen(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const handleLogout = async () => {
    setIsOpen(false);
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push('/'); 
  };

  const patientMenuItems: MenuItemP[] = [
    { href: '/dashboard', label: 'Dashboard', iconName: 'home' },
    { href: '/taken', label: 'Mijn Taken', iconName: 'tasks' },
    { href: '/reflecties', label: 'Mijn Reflecties', iconName: 'journal' },
    { href: '/overzicht', label: 'Dag & Week Overzicht', iconName: 'chart' },
    { href: '/rapporten', label: 'Mijn Rapporten', iconName: 'chart' },
    { href: '/mijn-specialisten', label: 'Mijn Specialisten', iconName: 'users' },
    { href: '/instellingen', label: 'Instellingen', iconName: 'settings' },
  ];
  
  const specialistMenuItems: MenuItemP[] = [
    { href: '/dashboard', label: 'Dashboard', iconName: 'home' },
    { href: '/specialisten/patienten', label: 'Mijn Patiënten', iconName: 'users' },
    { href: '/specialisten/taken', label: 'Taken Toewijzen', iconName: 'tasks' },
    { href: '/specialisten/inzichten', label: 'Patiënt Inzichten', iconName: 'chart' },
    { href: '/instellingen', label: 'Instellingen', iconName: 'settings' },
  ];
  
  const menuItems = profileType === 'specialist' ? specialistMenuItems : patientMenuItems;
  
  const renderIcon = (iconName: string): ReactElement => {
    switch (iconName) {
      case 'home': return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
      case 'tasks': return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
      case 'journal': return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
      case 'chart': return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
      case 'settings': return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
      case 'users': return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
      default: return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>;
    }
  };

  // Show a minimal loading state or null while profile type is being determined
  if (!user || isLoadingProfile) {
    // Render a slim, non-interactive sidebar or just the mobile toggle during initial auth/profile load
    return (
      <>
        <button
          id="mobile-menu-button"
          onClick={toggleSidebar} // Still allow toggle for consistency, though content is minimal
          className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white text-gray-600 shadow-md"
          aria-controls="sidebar"
          aria-label="Open menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <aside
          id="sidebar"
          className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-4 border-b border-gray-200">
            <SkeletonLoader type="list" count={1} />
          </div>
          <div className="py-3 px-3">
            <SkeletonLoader type="list" count={5} />
          </div>
        </aside>
      </>
    );
  }
  
  // If user is loaded but profileType is still null (e.g., error fetching profile or new user without profile type yet)
  // We default to patient menu items or could show a specific state.
  // For now, it defaults to patientMenuItems if profileType is not 'specialist'.

  return (
    <SidebarPresentational
      isOpen={isOpen}
      user={user}
      profileType={profileType ?? null}
      menuItems={menuItems}
      pathname={pathname}
      onToggleSidebar={toggleSidebar}
      onLogout={handleLogout}
      renderIcon={renderIcon}
    />
  );
}