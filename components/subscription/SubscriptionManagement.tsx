import React from 'react';

'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; 
import Link from 'next/link'; // Import Link
// import { Button } from '@/components/ds/atoms/Button'; // Placeholder
// import { Card } from '@/components/ds/atoms/Card'; // Placeholder
// import { Container } from '@/components/ds/layout/Container'; // Placeholder
// import { Grid } from '@/components/ds/layout/Grid'; // Placeholder
import { useAuth } from '@/components/auth/AuthProvider'; // Gebruik bestaande AuthProvider
// import { useSubscription } from '@/hooks/useSubscription'; // Placeholder hook
// import { formatCurrency } from '@/utils/format'; // Placeholder util - Removed as formatCurrency is defined locally or globally
import { useNotification } from '@/context/NotificationContext'; // Voor feedback

// Placeholder voor useSubscription hook data
interface MockSubscription {
  id: string;
  planId: string;
  planName: string;
  status: 'active' | 'cancelled' | 'past_due' | 'incomplete';
  billingCycle: 'monthly' | 'yearly';
  amount: number;
  renewalDate: string | null;
  patientCount?: number; // Voor specialisten
}

// Placeholder voor useSubscription hook
const useSubscription = (userId: string | undefined) => {
  const [subscription, setSubscription] = useState<MockSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { addNotification } = useNotification();

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      setSubscription(null);
      return;
    }
    // Simuleer API call
    setIsLoading(true);
    setTimeout(() => {
      // Voorbeeld: actieve gebruiker met een 'basic' plan
      setSubscription({
        id: 'sub_mock123',
        planId: 'basic',
        planName: 'Basis Plan',
        status: 'active',
        billingCycle: 'monthly',
        amount: 4.99,
        renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
      setIsLoading(false);
    }, 1000);
  }, [userId]);

  const cancelSubscription = async () => {
    // Simuleer API call
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        if (subscription) {
          setSubscription({ ...subscription, status: 'cancelled' });
          addNotification({type: 'success', message: 'Abonnement succesvol geannuleerd.'});
          resolve();
        } else {
          addNotification({type: 'error', message: 'Kon abonnement niet annuleren.'});
          reject(new Error('Geen abonnement gevonden om te annuleren.'));
        }
      }, 500);
    });
  };

  const updateSubscription = async (updates: Partial<MockSubscription>) => {
     // Simuleer API call
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        if (subscription) {
          setSubscription({ ...subscription, ...updates });
           addNotification({type: 'success', message: 'Abonnement succesvol bijgewerkt.'});
          resolve();
        } else {
          addNotification({type: 'error', message: 'Kon abonnement niet bijwerken.'});
          reject(new Error('Geen abonnement gevonden om bij te werken.'));
        }
      }, 500);
    });
  };

  return { subscription, isLoading, error, cancelSubscription, updateSubscription };
};


// Placeholder voor formatCurrency util
if (typeof formatCurrency !== 'function') {
  // @ts-ignore
  global.formatCurrency = (amount: number, currency = 'EUR') => {
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency }).format(amount);
  };
}


export function SubscriptionManagement(): JSX.Element {
  const { user } = useAuth();
  const { subscription, isLoading, error, cancelSubscription, updateSubscription } = useSubscription(user?.id);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  
  const handleCancelClick = () => {
    if (!confirmCancel) {
      setConfirmCancel(true);
      return;
    }
    handleCancelConfirm();
  };
  
  const handleCancelConfirm = async () => {
    if (!subscription) return;
    
    try {
      setIsProcessing(true);
      await cancelSubscription();
      // router.refresh(); // Kan nuttig zijn, of laat React Query invalidation het werk doen
    } catch (err: unknown) {
      console.error('Error cancelling subscription:', err);
      // Notificatie wordt al afgehandeld in de mock hook
    } finally {
      setIsProcessing(false);
      setConfirmCancel(false);
    }
  };
  
  const handleUpgrade = () => {
    router.push('/pricing?upgrade=true'); // Stuur gebruiker naar prijzenpagina
  };
  
  const handleChangeBilling = async (newCycle: 'monthly' | 'yearly') => {
    if (!subscription || subscription.billingCycle === newCycle) return;
    
    try {
      setIsProcessing(true);
      await updateSubscription({ billingCycle: newCycle });
      // router.refresh();
    } catch (err: unknown) {
      console.error('Error updating billing cycle:', err);
    } finally {
      setIsProcessing(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="p-6 bg-white rounded-lg shadow-md animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-2/3 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2 mb-6"></div>
          <div className="h-10 bg-gray-300 rounded w-1/4"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="p-6 border-red-300 bg-red-100 text-red-700 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-2">Er is een fout opgetreden</h2>
          <p>{error.message || 'Kon abonnementsinformatie niet laden'}</p>
          <button 
            className="mt-4 px-4 py-2 border border-red-300 text-red-700 rounded hover:bg-red-200"
            onClick={() => router.refresh()} // Simpele refresh
          >
            Probeer opnieuw
          </button>
        </div>
      </div>
    );
  }
  
  if (!subscription || subscription.status === 'cancelled') {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Geen actief abonnement</h2>
          <p className="text-gray-600 mb-6">
            U heeft momenteel geen actief abonnement. Upgrade naar een betaald plan om toegang te krijgen tot premium functies.
          </p>
          <button 
            className="px-6 py-2 bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-700"
            onClick={() => router.push('/pricing')}
          >
            Bekijk abonnementen
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-6 text-gray-800">Uw abonnement</h2>
        
        <div className="border-b border-gray-200 pb-4 mb-6">
          <div className="flex items-baseline">
            <span className="text-2xl font-bold text-purple-700">
              {subscription.planName}
            </span>
            <span className="ml-2 text-sm text-gray-500">
              ({subscription.billingCycle === 'monthly' ? 'Maandelijks' : 'Jaarlijks'})
            </span>
          </div>
          
          <p className="text-gray-600 mt-1">
            {formatCurrency(subscription.amount)} per {subscription.billingCycle === 'monthly' ? 'maand' : 'jaar'}
          </p>
          
          {subscription.renewalDate && (
            <p className="text-sm text-gray-500 mt-2">
              Volgende facturering op {new Date(subscription.renewalDate).toLocaleDateString('nl-NL', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-700 mb-3">Factureringsperiode wijzigen</h3>
            <div className="flex space-x-2">
              <button
                className={`px-4 py-2 text-sm rounded-md w-full ${subscription.billingCycle === 'monthly' ? 'bg-purple-600 text-white cursor-default' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                disabled={isProcessing || subscription.billingCycle === 'monthly'}
                onClick={() => handleChangeBilling('monthly')}
              >
                Maandelijks
              </button>
              <button
                className={`px-4 py-2 text-sm rounded-md w-full ${subscription.billingCycle === 'yearly' ? 'bg-purple-600 text-white cursor-default' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                disabled={isProcessing || subscription.billingCycle === 'yearly'}
                onClick={() => handleChangeBilling('yearly')}
              >
                Jaarlijks <span className="text-xs">(Bespaar)</span>
              </button>
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-700 mb-3">Abonnement beheren</h3>
            <div className="flex space-x-2">
              <button
                className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 w-full"
                onClick={handleUpgrade}
                disabled={isProcessing}
              >
                Upgraden
              </button>
              <button
                className={`px-4 py-2 text-sm rounded-md w-full ${confirmCancel ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                onClick={handleCancelClick}
                disabled={isProcessing}
              >
                {isProcessing && confirmCancel ? 'Bezig...' : confirmCancel ? 'Bevestig Annulering' : 'Annuleren'}
              </button>
            </div>
            {confirmCancel && !isProcessing && (
              <p className="text-xs text-red-600 mt-2">
                Klik nogmaals om te bevestigen. Uw abonnement loopt door tot het einde van de huidige factureringsperiode.
              </p>
            )}
          </div>
        </div>
        
        <div className="mt-8 text-sm text-gray-500 text-center">
          <p>
            Vragen over uw abonnement?{' '}
            <Link href="/contact" className="text-purple-600 hover:underline">
              Neem contact op
            </Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
