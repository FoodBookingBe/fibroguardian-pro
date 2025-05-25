'use client';
import { User } from '@supabase/supabase-js';
import Link from 'next/link';
import { ReactElement } from 'react';

export interface MenuItemP {
  href: string;
  label: string;
  iconName: string;
  disabled?: boolean;
}

interface SidebarPresentationalProps {
  isOpen: boolean;
  user: User | null; // User object for potential display or conditional rendering
  profileType: 'patient' | 'specialist' | 'admin' | null;
  menuItems: MenuItemP[];
  pathname: string;
  onToggleSidebar: () => void;
  onLogout: () => Promise<void>;
  renderIcon: (iconName: string) => ReactElement;
}

export default function SidebarPresentational({
  isOpen,
  user,
  // profileType, // Not directly used in rendering logic here, menuItems are pre-calculated
  menuItems,
  pathname,
  onToggleSidebar,
  onLogout,
  renderIcon,
}: SidebarPresentationalProps) {
  // If no user, don't render the sidebar content (container might return null earlier)
  if (!user) return <></>; // Empty fragment instead of null

  return (
    <>
      <button
        id="mobile-menu-button"
        onClick={onToggleSidebar}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white text-gray-600 shadow-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
        aria-controls="sidebar"
        aria-label={isOpen ? "Sluit menu" : "Open menu"}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {isOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
        </svg>
      </button>

      {isOpen && <div className="fixed inset-0 bg-black bg-opacity-25 z-30 md:hidden" onClick={onToggleSidebar} aria-hidden="true"></div>}

      <aside
        id="sidebar"
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
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
              {menuItems.map((item: MenuItemP) => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 ease-in-out group ${isActive ? 'bg-purple-100 text-purple-700 shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
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

          <div className="p-3 border-t border-gray-200 mt-auto">
            <button
              onClick={onLogout}
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
