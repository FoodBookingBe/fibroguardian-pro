'use client'; // Mark as a Client Component

// components/admin/AdminUsersList.tsx
import React from 'react';
import { Profile } from '@/types';

interface AdminUsersListProps {
  users: Profile[];
  onEditUser: (user: Profile) => void;
  onDeleteUser: (userId: string) => void;
}

const AdminUsersList: React.FC<AdminUsersListProps> = ({ users, onEditUser, onDeleteUser }) => {
  if (!users || users.length === 0) {
    return <p className="text-gray-500 dark:text-gray-400">Geen gebruikers gevonden.</p>;
  }

  return (
    <div className="overflow-x-auto mt-6">
      <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <thead>
          <tr className="w-full bg-gray-100 dark:bg-gray-700 text-left text-gray-600 dark:text-gray-200 uppercase text-sm leading-normal">
            <th className="py-3 px-6">ID</th>
            {/* <th className="py-3 px-6">Email</th> */} {/* Email is not directly in profiles table */}
            <th className="py-3 px-6">Voornaam</th>
            <th className="py-3 px-6">Achternaam</th>
            <th className="py-3 px-6">Rol</th>
            <th className="py-3 px-6">Postcode</th>
            <th className="py-3 px-6">Gemeente</th>
            <th className="py-3 px-6">Aangemaakt op</th>
            <th className="py-3 px-6">Acties</th>
          </tr>
        </thead>
        <tbody className="text-gray-700 dark:text-gray-300 text-sm font-light">
          {users.map((user: unknown) => (
            <tr key={user.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
              <td className="py-3 px-6 whitespace-nowrap">{user.id}</td>
              {/* <td className="py-3 px-6">{user.email || 'N/A'}</td> */}
              <td className="py-3 px-6">{user.voornaam || 'N/A'}</td>
              <td className="py-3 px-6">{user.achternaam || 'N/A'}</td>
              <td className="py-3 px-6">
                <span
                  className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                    ${user.type === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100' : ''}
                    ${user.type === 'specialist' ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100' : ''}
                    ${user.type === 'patient' ? 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100' : ''}
                    ${!['admin', 'specialist', 'patient'].includes(user.type || '') ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100' : ''}
                  `}
                >
                  {user.type || 'N/A'}
                </span>
              </td>
              <td className="py-3 px-6">{user.postcode || 'N/A'}</td>
              <td className="py-3 px-6">{user.gemeente || 'N/A'}</td>
              <td className="py-3 px-6">
                {user.created_at ? new Date(user.created_at).toLocaleDateString('nl-NL') : 'N/A'}
              </td>
              <td className="py-3 px-6">
                <button 
                  onClick={() => onEditUser(user)}
                  className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 mr-3"
                >
                  Bewerken
                </button>
                <button 
                  onClick={() => onDeleteUser(user.id)}
                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200"
                >
                  Verwijderen
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminUsersList;
