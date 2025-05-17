'use client';
import React, { useState, useCallback } from 'react';
import RapportGeneratorPresentational, {
  RapportDataStateP,
  RapportTypeP,
} from '@/components/rapporten/RapportGeneratorPresentational';
import { useNotification } from '@/context/NotificationContext'; // For feedback

// Helper to get today's date in YYYY-MM-DD format
const getTodayYYYYMMDD = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function RapportGeneratorContainer() {
  const { addNotification } = useNotification();
  const vandaag = getTodayYYYYMMDD();

  const initialRapportData: RapportDataStateP = {
    type: 'weekly',
    format: 'pdf',
    startDatum: '', // Will be set based on type or user input
    eindDatum: vandaag,
    includeTasken: true,
    includeMetrieken: true,
    includeReflecties: true,
    includeInzichten: false,
  };

  const [rapportData, setRapportData] = useState<RapportDataStateP>(initialRapportData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTypeChange = useCallback((type: RapportTypeP) => {
    setRapportData(prev => {
      let newStartDate = prev.startDatum;
      let newEndDate = prev.eindDatum;
      const today = new Date(vandaag);

      if (type === 'daily') {
        // For daily, typically it's for "today" or a specific single day.
        // Let's default to today. Dates will be disabled.
        newStartDate = vandaag;
        newEndDate = vandaag;
      } else if (type === 'weekly') {
        const oneWeekAgo = new Date(today);
        oneWeekAgo.setDate(today.getDate() - 7);
        newStartDate = `${oneWeekAgo.getFullYear()}-${(oneWeekAgo.getMonth() + 1).toString().padStart(2, '0')}-${oneWeekAgo.getDate().toString().padStart(2, '0')}`;
        newEndDate = vandaag;
      } else if (type === 'monthly') {
        const oneMonthAgo = new Date(today);
        oneMonthAgo.setMonth(today.getMonth() - 1);
        newStartDate = `${oneMonthAgo.getFullYear()}-${(oneMonthAgo.getMonth() + 1).toString().padStart(2, '0')}-${oneMonthAgo.getDate().toString().padStart(2, '0')}`;
        newEndDate = vandaag;
      }
      // For 'custom', dates remain as they are or as user sets them.
      return { ...prev, type, startDatum: newStartDate, eindDatum: newEndDate };
    });
  }, [vandaag]);

  const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setRapportData(prev => ({ ...prev, [name]: checked }));
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setRapportData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleGenerateRapport = useCallback(async () => {
    setError(null);
    setLoading(true);
    addNotification({ type: 'info', message: 'Rapportgeneratie gestart...' });

    // Basic validation
    if (rapportData.type === 'custom' && (!rapportData.startDatum || !rapportData.eindDatum)) {
      setError('Voor een aangepast rapport zijn start- en einddatum verplicht.');
      setLoading(false);
      addNotification({ type: 'error', message: 'Start- en einddatum zijn verplicht voor aangepast rapport.' });
      return;
    }
    if (rapportData.type === 'custom' && new Date(rapportData.startDatum) > new Date(rapportData.eindDatum)) {
        setError('Startdatum kan niet na einddatum liggen.');
        setLoading(false);
        addNotification({ type: 'error', message: 'Startdatum kan niet na einddatum liggen.' });
        return;
    }

    console.log('Rapport genereren met data:', rapportData);
    // TODO: Implement actual report generation logic (e.g., API call)
    // This would involve sending rapportData to a backend endpoint.
    // For now, simulate a delay and success/error.
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Example: const response = await fetch('/api/generate-rapport', { method: 'POST', body: JSON.stringify(rapportData) });
      // if (!response.ok) throw new Error('Genereren mislukt');
      // const blob = await response.blob();
      // const url = window.URL.createObjectURL(blob);
      // const a = document.createElement('a');
      // a.href = url;
      // a.download = `rapport-${rapportData.type}.${rapportData.format}`;
      // document.body.appendChild(a);
      // a.click();
      // a.remove();
      // window.URL.revokeObjectURL(url);

      addNotification({ type: 'success', message: 'Rapport succesvol gegenereerd (simulatie)!' });
    } catch (err: any) {
      setError(err.message || 'Fout bij genereren rapport.');
      addNotification({ type: 'error', message: err.message || 'Fout bij genereren rapport.' });
    } finally {
      setLoading(false);
    }
  }, [rapportData, addNotification]);
  
  // Initialize dates on mount for weekly/monthly if not custom
  React.useEffect(() => {
    handleTypeChange(initialRapportData.type);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  return (
    <RapportGeneratorPresentational
      rapportData={rapportData}
      loading={loading}
      error={error}
      vandaag={vandaag}
      onTypeChange={handleTypeChange}
      onCheckboxChange={handleCheckboxChange}
      onInputChange={handleInputChange}
      onGenerateRapport={handleGenerateRapport}
    />
  );
}
