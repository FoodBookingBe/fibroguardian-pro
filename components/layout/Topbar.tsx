'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { getSupabaseBrowserClient } from '@/lib/supabase'; // Corrected import and function name
import Link from 'next/link';

export default function Topbar() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<{ voornaam?: string; achternaam?: string; avatar_url?: string }>({});
  const [menuOpen, setMenuOpen] = useState(false);
  
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        const supabaseClient = getSupabaseBrowserClient(); // Corrected usage
        const { data } = await supabaseClient
          .from('profiles')
          .select('voornaam, achternaam, avatar_url')
          .eq('id', user.id)
          .single();
        
        if (data) {
          setProfileData(data);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    
    fetchProfile();
  }, [user]);
  
  const handleLogout = async () => {
    const supabaseClient = getSupabaseBrowserClient(); // Corrected usage
    await supabaseClient.auth.signOut();
    window.location.href = '/';
  };
  
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="flex justify-between items-center px-4 py-2">
        <div className="flex items-center md:hidden">
          {/* Hamburger menu icon is already in Sidebar component */}
        </div>
        
        <div className="flex-1 flex justify-end items-center">
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 transition-colors"
              aria-expanded={menuOpen ? "true" : "false"}
              aria-controls="user-menu"
            >
              <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden">
                {profileData.avatar_url ? (
                  <img
                    src={profileData.avatar_url}
                    alt="Profielfoto"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="font-medium text-purple-800">
                    {profileData.voornaam?.charAt(0) || ''}
                    {profileData.achternaam?.charAt(0) || ''}
                  </span>
                )}
              </div>
              <span className="hidden md:inline-block text-sm text-gray-700">
                {profileData.voornaam} {profileData.achternaam}
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            
            {menuOpen && (
              <div
                id="user-menu"
                className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20"
              >
                <Link
                  href="/instellingen"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setMenuOpen(false)}
                >
                  Profiel Instellingen
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Uitloggen
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}