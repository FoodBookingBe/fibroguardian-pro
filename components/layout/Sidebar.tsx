'use client';
import { useState, useEffect, ReactElement } from 'react'; // Added ReactElement
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation'; // Added useRouter
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthProvider'; // Corrected path if needed

// Define an interface for menu items for better type safety
interface MenuItem {
  href: string;
  label: string;
  iconName: string; // Changed from 'icon' to 'iconName' to avoid conflict with ReactElement type
  disabled?: boolean; // Optional: for future use
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter(); // For programmatic navigation
  const { user, session } = useAuth(); // Get session as well for logout logic
  const [isOpen, setIsOpen] = useState(false);
  const [profileType, setProfileType] = useState<'patient' | 'specialist' | null>(null);
  
  useEffect(() => {
    const fetchProfileType = async () => {
      if (!user) {
        setProfileType(null); // Reset if no user
        return;
      }
      try {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase
          .from('profiles')
          .select('type')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        
        if (data && (data.type === 'patient' || data.type === 'specialist')) {
          setProfileType(data.type);
        } else {
          setProfileType(null); // Fallback or if type is unexpected
        }
      } catch (error) {
        console.error('Fout bij ophalen profieltype:', error);
        setProfileType(null);
      }
    };
    
    fetchProfileType();
  }, [user]);
  
  const toggleSidebar = () => setIsOpen(!isOpen);
  
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const sidebarElement = document.getElementById('sidebar');
      const mobileMenuButton = document.getElementById('mobile-menu-button');
      if (isOpen && sidebarElement && !sidebarElement.contains(e.target as Node) && mobileMenuButton && !mobileMenuButton.contains(e.target as Node) ) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);
  
  useEffect(() => {
    if (isOpen) setIsOpen(false); // Close sidebar on route change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);
  
  const patientMenuItems: MenuItem[] = [
    { href: '/dashboard', label: 'Dashboard', iconName: 'home' },
    { href: '/taken', label: 'Mijn Taken', iconName: 'tasks' },
    { href: '/reflecties', label: 'Mijn Reflecties', iconName: 'journal' },
    { href: '/rapporten', label: 'Mijn Rapporten', iconName: 'chart' },
    { href: '/instellingen', label: 'Instellingen', iconName: 'settings' },
  ];
  
  const specialistMenuItems: MenuItem[] = [
    { href: '/dashboard', label: 'Dashboard', iconName: 'home' }, // Common dashboard
    { href: '/specialisten/patienten', label: 'Mijn Patiënten', iconName: 'users' },
    // { href: '/specialisten/taken', label: 'Taken Toewijzen', iconName: 'tasks' }, // Often done from patient detail
    { href: '/specialisten/inzichten', label: 'Patiënt Inzichten', iconName: 'chart' }, // Aggregate insights
    { href: '/instellingen', label: 'Instellingen', iconName: 'settings' },
  ];
  
  const menuItems = profileType === 'specialist' ? specialistMenuItems : patientMenuItems;
  
  const renderIcon = (iconName: string): ReactElement => {
    // SVGs are directly returned as JSX
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
  
  if (!user && !session) return null; // Don't render sidebar if not logged in (or still loading session)

  return (
    <>
      <button
        id="mobile-menu-button"
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white text-gray-600 shadow-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
        aria-expanded={isOpen ? "true" : "false"}
        aria-controls="sidebar"
        aria-label={isOpen ? "Sluit menu" : "Open menu"}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {isOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
        </svg>
      </button>
      
      {isOpen && <div className="fixed inset-0 bg-black bg-opacity-25 z-30 md:hidden" onClick={toggleSidebar} aria-hidden="true"></div>}
      
      <aside
        id="sidebar"
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Hoofdnavigatie"
      >
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <Link href="/dashboard" className="flex items-center space-x-2 group">
              <img src="/logo.png" alt="FibroGuardian Pro Logo" className="h-8 w-8 rounded-md group-hover:opacity-80 transition-opacity" />
              <span className="text-lg font-semibold text-purple-700 group-hover:text-purple-800 transition-colors">FibroGuardian</span>
            </Link>
          </div>
          
          <nav className="flex-1 overflow-y-auto py-3">
            <ul className="space-y-1 px-3">
              {menuItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 ease-in-out group ${
                        isActive ? 'bg-purple-100 text-purple-700 shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <span className={`mr-3 w-5 h-5 ${isActive ? 'text-purple-600' : 'text-gray-400 group-hover:text-gray-500'}`}>
                        {renderIcon(item.iconName)}
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          
          <div className="p-3 border-t border-gray-200 mt-auto"> {/* mt-auto pushes to bottom */}
            <button
              onClick={async () => {
                setIsOpen(false); // Close sidebar before sign out
                const supabase = getSupabaseBrowserClient();
                await supabase.auth.signOut();
                router.push('/'); // Use router for navigation
              }}
              className="flex items-center w-full px-3 py-2.5 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors group"
            >
              <span className="mr-3 text-gray-400 group-hover:text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </span>
              <span>Uitloggen</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}