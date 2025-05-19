// components/admin/AdminUsersList.tsx
import React from 'react';
import { Profile } from '@/types'; // Assuming Profile type includes id, email, type/role

interface AdminUsersListProps {
  users: Profile[];
}

const AdminUsersList: React.FC<AdminUsersListProps> = ({ users }) => {
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
          {users.map((user) => (
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
                {/* Placeholder for action buttons */}
                <button className="text-blue-500 hover:text-blue-700 mr-2">Bewerken</button>
                <button className="text-red-500 hover:text-red-700">Verwijderen</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminUsersList;
