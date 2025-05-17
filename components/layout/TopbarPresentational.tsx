'use client';
import React from 'react';
import Link from 'next/link';

export interface TopbarProfileData {
  voornaam?: string;
  achternaam?: string;
  avatar_url?: string;
}

interface TopbarPresentationalProps {
  profileData: TopbarProfileData;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onLogout: () => Promise<void>;
  onCloseMenu: () => void; // To close menu when a link is clicked
}

export default function TopbarPresentational({
  profileData,
  menuOpen,
  onToggleMenu,
  onLogout,
  onCloseMenu,
}: TopbarPresentationalProps) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="flex justify-between items-center px-4 py-2">
        <div className="flex items-center md:hidden">
          {/* Hamburger menu icon is handled by Sidebar component */}
        </div>
        
        <div className="flex-1 flex justify-end items-center">
          <div className="relative">
            <button
              onClick={onToggleMenu}
              className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 transition-colors"
              aria-expanded={menuOpen ? 'true' : 'false'}
              aria-controls="user-menu"
              aria-label="Gebruikersmenu"
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
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            
            {menuOpen && (
              <div
                id="user-menu"
                className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20"
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="user-menu-button" // Assuming button has id="user-menu-button" or similar
              >
                <Link
                  href="/instellingen"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={onCloseMenu}
                  role="menuitem"
                >
                  Profiel Instellingen
                </Link>
                <button
                  onClick={async () => {
                    await onLogout();
                    onCloseMenu();
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  role="menuitem"
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