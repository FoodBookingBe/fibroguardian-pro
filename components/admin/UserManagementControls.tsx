'use client';

'use client';

import React, { useState } from 'react';
import AddUserForm from './AddUserForm'; // Import the form component
import { Profile } from '@/types'; // For onUserAdded callback type

const UserManagementControls: React.FC = () => {
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);

  const handleUserAdded = (newUser: Profile) => {
    // TODO: Refresh the user list on the page or update state
    console.log('New user added (in parent):', newUser);
    // For now, just log. In a real app, you'd trigger a re-fetch of users.
    setIsAddUserModalOpen(false); // Close modal on success
  };

  const handleOpenEditModal = (user: Profile) => {
    setEditingUser(user);
    setIsEditUserModalOpen(true);
  };

  const handleUserUpdated = (updatedUser: Profile) => {
    // TODO: Refresh the user list or update the specific user in the list
    console.log('User updated (in parent):', updatedUser);
    setIsEditUserModalOpen(false);
    setEditingUser(null);
  };

  // We need to pass handleOpenEditModal to AdminUsersList via AdminUsersPage props
  // This component itself doesn't render AdminUsersList directly.
  // For now, we'll set up the modal structure here.
  // The actual passing of the handler will be a subsequent step.

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Gebruikersbeheer</h1>
        <button
          onClick={() => setIsAddUserModalOpen(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          Nieuwe Gebruiker Toevoegen
        </button>
      </div>
      
      {isAddUserModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex justify-center items-center p-4">
          <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Nieuwe Gebruiker Toevoegen</h2>
              <button 
                onClick={() => setIsAddUserModalOpen(false)} 
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label="Sluit venster" // Add aria-label for accessibility
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
                onClick={() => {
                  setIsEditUserModalOpen(false);
                  setEditingUser(null);
                }} 
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label="Sluit venster"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            {/* <EditUserForm 
              user={editingUser}
              onClose={() => { setIsEditUserModalOpen(false); setEditingUser(null); }}
              onUserUpdated={handleUserUpdated}
            /> */}
            <p>Edit form voor {editingUser.voornaam} komt hier...</p> 
            {/* Placeholder for EditUserForm */}
          </div>
        </div>
      )}
    </>
  );
};

export default UserManagementControls;
