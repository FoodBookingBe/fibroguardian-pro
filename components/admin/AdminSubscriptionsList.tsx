'use client';

import { Abonnement, Profile } from '@/types'; // Assuming Abonnement and Profile types are correct
import React from 'react';

// Define a type for the subscription data that includes user profile information
export type SubscriptionWithUserProfile = Abonnement & {
  profiles: Pick<Profile, 'voornaam' | 'achternaam'> & { email?: string }; // Email might come from auth user
};

interface AdminSubscriptionsListProps {
  subscriptions: SubscriptionWithUserProfile[];
}

const AdminSubscriptionsList: React.FC<AdminSubscriptionsListProps> = ({ subscriptions }) => {
  if (!subscriptions || subscriptions.length === 0) {
    return <p className="text-gray-500 dark:text-gray-400">Geen abonnementen gevonden.</p>;
  }

  const getPlanDisplayName = (planType: string | null | undefined) => {
    if (!planType) return 'N/A';
    switch (planType.toLowerCase()) {
      case 'basis': return 'Basis';
      case 'premium': return 'Premium';
      case 'enterprise': return 'Enterprise';
      default: return planType;
    }
  };

  return (
    <div className="overflow-x-auto mt-6">
      <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <thead>
          <tr className="w-full bg-gray-100 dark:bg-gray-700 text-left text-gray-600 dark:text-gray-200 uppercase text-sm leading-normal">
            <th className="py-3 px-6">Gebruiker</th>
            <th className="py-3 px-6">Email</th>
            <th className="py-3 px-6">Plan Type</th>
            <th className="py-3 px-6">Stripe Sub ID</th>
            <th className="py-3 px-6">Max. Patiënten</th>
            <th className="py-3 px-6">Verloopt Op</th>
            <th className="py-3 px-6">Status</th>
            <th className="py-3 px-6">Acties</th>
          </tr>
        </thead>
        <tbody className="text-gray-700 dark:text-gray-300 text-sm font-light">
          {subscriptions.map((sub: any) => {
            const userName = `${sub.profiles?.voornaam || ''} ${sub.profiles?.achternaam || ''}`.trim() || 'N/A';
            const userEmail = sub.profiles?.email || 'N/A'; // Assuming email might be on the joined profile data
            const isActive = sub.verloopt_op ? new Date(sub.verloopt_op) > new Date() : true; // Basic status check

            return (
              <tr key={sub.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                <td className="py-3 px-6 whitespace-nowrap">{userName}</td>
                <td className="py-3 px-6">{userEmail}</td>
                <td className="py-3 px-6">{getPlanDisplayName(sub.plan_type)}</td>
                <td className="py-3 px-6">{sub.stripe_subscription_id || 'N/A'}</td>
                <td className="py-3 px-6 text-center">{sub.max_patienten ?? 'N/A'}</td>
                <td className="py-3 px-6">
                  {sub.verloopt_op ? new Date(sub.verloopt_op).toLocaleDateString('nl-NL') : 'N/A'}
                </td>
                <td className="py-3 px-6">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {isActive ? 'Actief' : 'Verlopen'}
                  </span>
                </td>
                <td className="py-3 px-6">
                  <button className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200">
                    Details
                  </button>
                  {/* Add more actions like cancel, renew, etc. later */}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AdminSubscriptionsList;
