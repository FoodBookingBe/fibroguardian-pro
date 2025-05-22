import React from 'react';

'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';
import AddSpecialistButtonContainer from '@/containers/specialisten/AddSpecialistButtonContainer'; // Updated import
import { useAuth } from '@/components/auth/AuthProvider';
import SpecialistLoadingSkeleton from '@/components/specialisten/SpecialistLoadingSkeleton';
import EmptySpecialistState from '@/components/specialisten/EmptySpecialistState';
import SpecialistsList from '@/components/specialisten/SpecialistsList';
import { Profile as Specialist } from '@/types'; // Use Profile and alias as Specialist for minimal changes

interface MijnSpecialistenClientProps {
  user: User;
  specialists: Specialist[]; // This will now refer to Profile aliased as Specialist
  userProfile: unknown;
}

export default function MijnSpecialistenClient({ user: serverUser, specialists, userProfile }: MijnSpecialistenClientProps) {
  // Use the authenticated user from context to ensure consistency
  const { user, loading: authLoading } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Initialize localSpecialists with the specialists prop.
  // The type Specialist is an alias for Profile here due to the import.
  const [localSpecialists, setLocalSpecialists] = useState<Specialist[]>(specialists);
  const [isLoading, setIsLoading] = useState(false); // Added for remove operation

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Remove debug logging for production
  
  // If auth is loading or not yet client-side, show a generic loading state
  if (authLoading || !isClient) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" aria-label="Laden..."></div>
        </div>
      </div>
    );
  }
  
  // After client has mounted and auth is no longer loading
  if (!user) { // Rely on the user from AuthProvider once client-side
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-700">Authenticatie is vereist. U wordt mogelijk doorgestuurd naar de login pagina.</p>
        </div>
      </div>
    );
  }

  // At this point, user is authenticated and we are on the client
  // Hooks for error, localSpecialists, isLoading were moved up

  const handleRemoveSpecialist = async (specialistId: string) => {
    if (!user || !window.confirm('Weet u zeker dat u deze specialist wilt verwijderen?')) return;

    setIsLoading(true); // Set loading true for this specific operation
    try {
      const supabase = getSupabaseBrowserClient();
      
      const { error: deleteError } = await supabase // Renamed error to avoid conflict
        .from('specialist_patienten')
        .delete()
        .eq('specialist_id', specialistId)
        .eq('patient_id', user.id);

      if (deleteError) throw deleteError;

      setLocalSpecialists(prev => prev.filter(s => s.id !== specialistId));
    } catch (err: unknown) {
      console.error('Error removing specialist:', err);
      setError(err.message || 'Er is een fout opgetreden bij het verwijderen.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Mijn Specialisten</h1>
          <AddSpecialistButtonContainer /> {/* Updated component */}
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
            {error}
          </div>
        )}

        {isLoading && <SpecialistLoadingSkeleton /> } 
        
        {!isLoading && localSpecialists.length === 0 && <EmptySpecialistState />}
        
        {!isLoading && localSpecialists.length > 0 && (
          <SpecialistsList specialists={localSpecialists} onRemove={handleRemoveSpecialist} />
        )}
      </div>
  );
}
