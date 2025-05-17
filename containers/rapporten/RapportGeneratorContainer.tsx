'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthProvider';
import { useNotification } from '@/context/NotificationContext';
import RapportGeneratorPresentational, { RapportDataStateP, RapportTypeP } from '@/components/rapporten/RapportGeneratorPresentational';
import { Task, TaskLog, Inzicht, Profile, Reflectie } from '@/types'; // Added Reflectie

// Helper to format date to YYYY-MM-DD
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export default function RapportGeneratorContainer() {
  const router = useRouter();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const vandaag = new Date();
  const eenWeekTerug = new Date();
  eenWeekTerug.setDate(vandaag.getDate() - 7);
  const eenMaandTerug = new Date();
  eenMaandTerug.setMonth(vandaag.getMonth() - 1);

  const [rapportData, setRapportData] = useState<RapportDataStateP>({
    type: 'weekly',
    format: 'pdf',
    startDatum: formatDate(eenWeekTerug),
    eindDatum: formatDate(vandaag),
    includeTasken: true,
    includeMetrieken: true,
    includeReflecties: true,
    includeInzichten: true,
  });

  const handleTypeChange = (type: RapportTypeP) => {
    let startDatum = rapportData.startDatum;
    switch (type) {
      case 'daily':
        startDatum = formatDate(vandaag);
        break;
      case 'weekly':
        startDatum = formatDate(eenWeekTerug);
        break;
      case 'monthly':
        startDatum = formatDate(eenMaandTerug);
        break;
      // For 'custom', keep existing startDatum
    }
    setRapportData(prev => ({
      ...prev,
      type,
      startDatum,
      eindDatum: formatDate(vandaag), // Always set end date to today for non-custom types
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setRapportData(prev => ({ ...prev, [name]: checked }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setRapportData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerateRapport = async () => {
    setLoading(true);
    setError(null);

    if (!user) {
      addNotification({ type: 'error', message: 'U moet ingelogd zijn om een rapport te genereren.' });
      setLoading(false);
      return;
    }

    try {
      if (!rapportData.startDatum || !rapportData.eindDatum) {
        throw new Error('Start- en einddatum zijn verplicht');
      }
      if (new Date(rapportData.startDatum) > new Date(rapportData.eindDatum)) {
        throw new Error('Startdatum moet voor einddatum liggen');
      }
      if (!rapportData.includeTasken && !rapportData.includeMetrieken && 
          !rapportData.includeReflecties && !rapportData.includeInzichten) {
        throw new Error('Selecteer ten minste één type gegevens om op te nemen in het rapport');
      }

      const supabaseClient = getSupabaseBrowserClient();
      const fetchedReportData: {
        taken?: Task[];
        logs?: TaskLog[];
        reflecties?: Reflectie[];
        inzichten?: Inzicht[];
        profiel?: Profile | null;
      } = {};

      if (rapportData.includeTasken) {
        const { data, error } = await supabaseClient
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          // Optionally filter tasks by date range if applicable, e.g., created_at or a due_date
          // For now, fetching all tasks as per original logic
          ;
        if (error) throw error;
        fetchedReportData.taken = data || [];
      }

      if (rapportData.includeMetrieken) {
        const { data, error } = await supabaseClient
          .from('task_logs')
          .select('*, tasks(titel)') // Join with tasks to get title
          .eq('user_id', user.id)
          .gte('start_tijd', rapportData.startDatum)
          .lte('start_tijd', `${rapportData.eindDatum}T23:59:59`);
        if (error) throw error;
        fetchedReportData.logs = data || [];
      }

      if (rapportData.includeReflecties) {
        const { data, error } = await supabaseClient
          .from('reflecties')
          .select('*')
          .eq('user_id', user.id)
          .gte('datum', rapportData.startDatum)
          .lte('datum', rapportData.eindDatum);
        if (error) throw error;
        fetchedReportData.reflecties = data || [];
      }

      if (rapportData.includeInzichten) {
        const { data, error } = await supabaseClient
          .from('inzichten')
          .select('*')
          .eq('user_id', user.id)
          .gte('created_at', `${rapportData.startDatum}T00:00:00`)
          .lte('created_at', `${rapportData.eindDatum}T23:59:59`);
        if (error) throw error;
        fetchedReportData.inzichten = data || [];
      }

      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (profileError) throw profileError;
      fetchedReportData.profiel = profile;
      
      // Store data for the preview page
      localStorage.setItem('fibroGuardianRapportData', JSON.stringify(fetchedReportData));
      localStorage.setItem('fibroGuardianRapportOpties', JSON.stringify(rapportData));
      
      addNotification({type: 'success', message: 'Rapportdata succesvol verzameld. Voorbeeld wordt geladen...'});
      router.push(`/rapporten/preview?format=${rapportData.format}`);

    } catch (err: any) {
      console.error('Fout bij genereren rapport:', err);
      setError(err.message || 'Er is een fout opgetreden bij het genereren van het rapport');
      addNotification({ type: 'error', message: err.message || 'Fout bij genereren rapport.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <RapportGeneratorPresentational
      rapportData={rapportData}
      loading={loading}
      error={error}
      vandaag={formatDate(vandaag)}
      onTypeChange={handleTypeChange}
      onCheckboxChange={handleCheckboxChange}
      onInputChange={handleInputChange}
      onGenerateRapport={handleGenerateRapport}
    />
  );
}