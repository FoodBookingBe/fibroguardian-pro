'use client';

import React, { useState, useEffect } from 'react';
import AdminUsersList from './AdminUsersList';
import AddUserForm from './AddUserForm';
import EditUserForm from './EditUserForm'; // Import the EditUserForm
import { Profile } from '@/types';

interface UsersPageClientViewProps {
  initialUsers: Profile[];
  fetchError?: string | null;
}

const UsersPageClientView: React.FC<UsersPageClientViewProps> = ({ initialUsers, fetchError }) => {
  const [users, setUsers] = useState<Profile[]>(initialUsers);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [currentFetchError, setCurrentFetchError] = useState<string | null>(fetchError || null);

  useEffect(() => {
    setUsers(initialUsers); // Sync if initialUsers prop changes (e.g., after server-side re-fetch)
  return undefined; // Add default return
  }, [initialUsers]);

  useEffect(() => {
    setCurrentFetchError(fetchError || null);
  return undefined; // Add default return
  }, [fetchError]);


  const handleUserAdded = (newUser: Profile) => {
    // TODO: Ideally, re-fetch the list or add to local state optimistically
    // For now, we'd need a way to trigger re-fetch in the parent server component or use client-side fetching.
    // router.refresh() could work if data fetching in page.tsx is re-run.
    setUsers(prevUsers => [newUser, ...prevUsers]); // Optimistic update
    setIsAddUserModalOpen(false);
    alert('Gebruiker (simulatie) toegevoegd. Implementeer daadwerkelijke API en lijstvernieuwing.');
  };

  const handleOpenEditModal = (user: Profile) => {
    setEditingUser(user);
    setIsEditUserModalOpen(true);
  };

  const handleUserUpdated = (updatedUser: Profile) => {
    setUsers(prevUsers => prevUsers.map(u => u.id === updatedUser.id ? updatedUser : u)); // Optimistic update
    setIsEditUserModalOpen(false);
    setEditingUser(null);
    alert('Gebruiker (simulatie) bijgewerkt. Implementeer daadwerkelijke API en lijstvernieuwing.');
  };
  
  // TODO: Implement handleDeleteUser

  return (
    <div> {/* This outer div is fine, page.tsx will be wrapped by layout's <main> */}
      <div className="flex justify-between items-center mb-8"> {/* Match AdminDashboardPage mb-8 */}
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Gebruikersbeheer</h1> {/* Match AdminDashboardPage h1 */}
        <button
          onClick={() => setIsAddUserModalOpen(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          Nieuwe Gebruiker Toevoegen
        </button>
      </div>

      {/* Main content block with consistent styling */}
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6"> {/* Match AdminDashboardPage section styling */}
        {currentFetchError && (
          <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800" role="alert">
            <span className="font-medium">Fout bij ophalen gebruikers:</span> {currentFetchError}
          </div>
        )}
        {/* TODO: Implement UserFilterControls */}
        <AdminUsersList users={users} onEditUser={handleOpenEditModal} onDeleteUser={(userId: unknown) => alert(`Verwijder gebruiker ${userId} (TODO)`)} />
      </div>

      {isAddUserModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex justify-center items-center p-4">
          <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Nieuwe Gebruiker Toevoegen</h2>
              <button 
                onClick={() => setIsAddUserModalOpen(false)} 
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label="Sluit venster"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <AddUserForm 
              onClose={() => setIsAddUserModalOpen(false)} 
              onUserAdded={handleUserAdded} 
            />
          </div>
        </div>
      )}

      {isEditUserModalOpen && editingUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex justify-center items-center p-4">
          <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Gebruiker Bewerken</h2>
              <button 
                onClick={() => { setIsEditUserModalOpen(false); setEditingUser(null); }} 
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label="Sluit venster"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <EditUserForm 
              user={editingUser}
              onClose={() => { setIsEditUserModalOpen(false); setEditingUser(null); }}
              onUserUpdated={handleUserUpdated}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPageClientView;
