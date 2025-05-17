'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useProfile } from '@/hooks/useSupabaseQuery';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import TopbarPresentational, { TopbarProfileData } from '@/components/layout/TopbarPresentational';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'; // For loading state

export default function TopbarContainer() {
  const { user } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: fullProfile, isLoading: isLoadingProfile } = useProfile(user?.id, {
    enabled: !!user,
    // select option removed, will derive TopbarProfileData from fullProfile
  });

  // Derive TopbarProfileData from the fullProfile
  const profileData: TopbarProfileData = {
    voornaam: fullProfile?.voornaam,
    achternaam: fullProfile?.achternaam,
    avatar_url: fullProfile?.avatar_url,
  };

  const toggleMenu = useCallback(() => {
    setMenuOpen(prev => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);

  const handleLogout = async () => {
    closeMenu(); // Close menu first
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push('/'); 
  };

  // Close menu on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const menuButton = document.querySelector('[aria-controls="user-menu"]'); // More robust selector
      const menu = document.getElementById('user-menu');

      if (
        menuOpen &&
        menuButton && !menuButton.contains(event.target as Node) &&
        menu && !menu.contains(event.target as Node)
      ) {
        closeMenu();
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [menuOpen, closeMenu]);
  
  // Don't render Topbar if user is not available or profile is still loading initially
  // This prevents a flash of unstyled content or missing user data
  if (!user || (isLoadingProfile && !fullProfile)) {
    // Render a minimal placeholder or null during critical loading
    // This matches the behavior of the original Topbar which wouldn't have profileData yet
    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
            <div className="flex justify-end items-center px-4 py-2">
                <div className="h-8 w-24"> {/* Placeholder for profile button area */}
                    <SkeletonLoader type="card" count={1} className="h-full w-full" />
                </div>
            </div>
        </header>
    );
  }

  return (
    <TopbarPresentational
      profileData={profileData}
      menuOpen={menuOpen}
      onToggleMenu={toggleMenu}
      onLogout={handleLogout}
      onCloseMenu={closeMenu}
    />
  );
}
