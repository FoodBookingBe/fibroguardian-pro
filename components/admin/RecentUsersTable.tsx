import React from 'react';

'use client';

import { Profile } from '@/types'; // Assuming Profile type is in @/types
import Link from 'next/link';

interface RecentUsersTableProps {
  users: Profile[]; // Expects an array of Profile objects
}

export default function RecentUsersTable({ users }: RecentUsersTableProps) {
  const formatDate = (dateString: Date | string | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-BE', {
      day: '2-digit',
      month: 'short', // Using short month name
      year: 'numeric',
    });
  };

  return (
    <div className="overflow-x-auto rounded-lg shadow">
      <table className="min-w-full divide-y divide-gray-200 bg-white">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
            >
              Naam
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
            >
              Email (from auth, not in profile table)
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
            >
              Type
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
            >
              Geregistreerd op
            </th>
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">Details</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {users.map((user: unknown) => (
            <tr key={user.id}>
              <td className="whitespace-nowrap px-6 py-4">
                <div className="flex items-center">
                  {user.avatar_url && (
                    <div className="mr-4 h-10 w-10 flex-shrink-0">
                      <img className="h-10 w-10 rounded-full" src={user.avatar_url} alt="" />
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-medium text-gray-900">{user.voornaam} {user.achternaam}</div>
                    {/* <div className="text-sm text-gray-500">{user.email}</div> Placeholder, email is not in profiles table */}
                  </div>
                </div>
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {/* Email is typically in auth.users, not profiles. This column might need adjustment or data enrichment. */}
                N/A 
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 capitalize">{user.type}</td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {formatDate(user.created_at)}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                <Link href={`/admin/users/${user.id}`} className="text-purple-600 hover:text-purple-900">
                  Details
                </Link>
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                Geen recente gebruikers gevonden.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
