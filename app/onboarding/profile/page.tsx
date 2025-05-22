'use client';

import React, { useState } from 'react';

import { _useAuth as useAuth } from '@/components/auth/AuthProvider';
import ProgressIndicator from '@/components/onboarding/ProgressIndicator';
import StepNavigation from '@/components/onboarding/StepNavigation';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';

export default function ProfileSetupPage(): JSX.Element {
  const { profile, user } = useAuth();
  const [voornaam, setVoornaam] = useState(profile?.voornaam || '');
  const [achternaam, setAchternaam] = useState(profile?.achternaam || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const isSpecialist = profile?.type === 'specialist';

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const supabase = getSupabaseBrowserClient();

      const { error } = await supabase
        .from('profiles')
        .update({
          voornaam,
          achternaam,
          email,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      setSaveSuccess(true);
    } catch (error) {
      console.error('Error updating profile:', error);
      setSaveError('Er is een fout opgetreden bij het opslaan van uw profiel. Probeer het later opnieuw.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <ProgressIndicator />

      <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
        <h1 className="text-3xl font-bold text-center text-purple-800 mb-6">
          Uw profiel instellen
        </h1>

        <p className="text-lg text-gray-700 mb-6">
          {isSpecialist
            ? 'Vul uw profiel in zodat patiënten u kunnen vinden en contact met u kunnen opnemen. Een volledig profiel helpt bij het opbouwen van vertrouwen.'
            : 'Vul uw profiel in zodat we de app kunnen personaliseren. Deze informatie helpt ons om u beter te ondersteunen.'}
        </p>

        <div className="space-y-6">
          <div>
            <label htmlFor="voornaam" className="block text-sm font-medium text-gray-700 mb-1">
              Voornaam
            </label>
            <input
              type="text"
              id="voornaam"
              value={voornaam}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVoornaam(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
              placeholder="Uw voornaam"
            />
          </div>

          <div>
            <label htmlFor="achternaam" className="block text-sm font-medium text-gray-700 mb-1">
              Achternaam
            </label>
            <input
              type="text"
              id="achternaam"
              value={achternaam}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAchternaam(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
              placeholder="Uw achternaam"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              E-mailadres
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
              placeholder="Uw e-mailadres"
            />
            <p className="mt-1 text-sm text-gray-500">
              Dit e-mailadres wordt gebruikt voor communicatie en notificaties.
            </p>
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`
                px-6 py-2 text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors
                ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}
              `}
            >
              {isSaving ? 'Opslaan...' : 'Profiel opslaan'}
            </button>
          </div>

          {saveError && (
            <div className="p-3 bg-red-50 text-red-700 rounded-md">
              {saveError}
            </div>
          )}

          {saveSuccess && (
            <div className="p-3 bg-green-50 text-green-700 rounded-md">
              Uw profiel is succesvol opgeslagen!
            </div>
          )}
        </div>
      </div>

      <StepNavigation />
    </div>
  );
}
