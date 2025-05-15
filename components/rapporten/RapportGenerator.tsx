'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase'; // Corrected import

type RapportType = 'daily' | 'weekly' | 'monthly' | 'custom';
type RapportFormat = 'pdf' | 'csv';

export default function RapportGenerator() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Datum helpers
  const vandaag = new Date();
  const eenWeekTerug = new Date();
  eenWeekTerug.setDate(vandaag.getDate() - 7);
  const eenMaandTerug = new Date();
  eenMaandTerug.setMonth(vandaag.getMonth() - 1);
  
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };
  
  const [rapportData, setRapportData] = useState({
    type: 'weekly' as RapportType,
    format: 'pdf' as RapportFormat,
    startDatum: formatDate(eenWeekTerug),
    eindDatum: formatDate(vandaag),
    includeTasken: true,
    includeMetrieken: true,
    includeReflecties: true,
    includeInzichten: true,
  });
  
  // Update rapport type en pas datums aan
  const handleTypeChange = (type: RapportType) => {
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
      // Voor custom behouden we de bestaande startdatum
    }
    
    setRapportData(prev => ({
      ...prev,
      type,
      startDatum,
      eindDatum: formatDate(vandaag),
    }));
  };
  
  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setRapportData(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  
  // Handle algemene changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setRapportData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Generate rapport
  const handleGenerateRapport = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Validatie
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
      
      const supabaseClient = getSupabaseBrowserClient(); // Corrected usage
      const { data: { user } } = await supabaseClient.auth.getUser();
      
      if (!user) {
        throw new Error('Niet ingelogd');
      }
      
      // Data ophalen voor het rapport
      const data: any = {};
      
      // Taken
      if (rapportData.includeTasken) {
        const { data: taken, error: takenError } = await supabaseClient
          .from('tasks')
          .select('*')
          .eq('user_id', user.id);
        
        if (takenError) throw takenError;
        data.taken = taken;
      }
      
      // Task logs (metrieken)
      if (rapportData.includeMetrieken) {
        const { data: logs, error: logsError } = await supabaseClient
          .from('task_logs')
          .select('*')
          .eq('user_id', user.id)
          .gte('start_tijd', rapportData.startDatum)
          .lte('start_tijd', `${rapportData.eindDatum}T23:59:59`);
        
        if (logsError) throw logsError;
        data.logs = logs;
      }
      
      // Reflecties
      if (rapportData.includeReflecties) {
        const { data: reflecties, error: reflectiesError } = await supabaseClient
          .from('reflecties')
          .select('*')
          .eq('user_id', user.id)
          .gte('datum', rapportData.startDatum)
          .lte('datum', rapportData.eindDatum);
        
        if (reflectiesError) throw reflectiesError;
        data.reflecties = reflecties;
      }
      
      // Inzichten
      if (rapportData.includeInzichten) {
        const { data: inzichten, error: inzichtenError } = await supabaseClient
          .from('inzichten')
          .select('*')
          .eq('user_id', user.id)
          .gte('created_at', `${rapportData.startDatum}T00:00:00`)
          .lte('created_at', `${rapportData.eindDatum}T23:59:59`);
        
        if (inzichtenError) throw inzichtenError;
        data.inzichten = inzichten;
      }
      
      // Gebruiker info ophalen
      const { data: profiel, error: profielError } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profielError) throw profielError;
      data.profiel = profiel;
      
      // Opslaan in lokale storage voor het rapport
      localStorage.setItem('rapportData', JSON.stringify(data));
      localStorage.setItem('rapportOpties', JSON.stringify(rapportData));
      
      // Navigeer naar de rapport preview pagina
      router.push(`/rapporten/preview?format=${rapportData.format}`);
    } catch (error: any) {
      console.error('Fout bij genereren rapport:', error);
      setError(error.message || 'Er is een fout opgetreden bij het genereren van het rapport');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <section className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-6">Rapport Genereren</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <div className="mb-6">
        <label className="block text-gray-700 font-medium mb-2">
          Type Rapport
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => handleTypeChange('daily')}
            className={`px-4 py-3 rounded-md flex flex-col items-center justify-center transition-colors ${
              rapportData.type === 'daily'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            aria-pressed={rapportData.type === 'daily' ? "true" : "false"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Dagelijks</span>
          </button>
          
          <button
            type="button"
            onClick={() => handleTypeChange('weekly')}
            className={`px-4 py-3 rounded-md flex flex-col items-center justify-center transition-colors ${
              rapportData.type === 'weekly'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            aria-pressed={rapportData.type === 'weekly' ? "true" : "false"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Wekelijks</span>
          </button>
          
          <button
            type="button"
            onClick={() => handleTypeChange('monthly')}
            className={`px-4 py-3 rounded-md flex flex-col items-center justify-center transition-colors ${
              rapportData.type === 'monthly'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            aria-pressed={rapportData.type === 'monthly' ? "true" : "false"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Maandelijks</span>
          </button>
          
          <button
            type="button"
            onClick={() => handleTypeChange('custom')}
            className={`px-4 py-3 rounded-md flex flex-col items-center justify-center transition-colors ${
              rapportData.type === 'custom'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            aria-pressed={rapportData.type === 'custom' ? "true" : "false"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <span>Aangepast</span>
          </button>
        </div>
      </div>
      
      {/* Periode selectie */}
      <div className={`mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 ${rapportData.type === 'daily' ? 'opacity-50 pointer-events-none' : ''}`}>
        <div>
          <label htmlFor="startDatum" className="block text-gray-700 font-medium mb-2">
            Startdatum
          </label>
          <input
            type="date"
            id="startDatum"
            name="startDatum"
            value={rapportData.startDatum}
            onChange={handleChange}
            max={rapportData.eindDatum}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={rapportData.type === 'daily'}
          />
        </div>
        
        <div>
          <label htmlFor="eindDatum" className="block text-gray-700 font-medium mb-2">
            Einddatum
          </label>
          <input
            type="date"
            id="eindDatum"
            name="eindDatum"
            value={rapportData.eindDatum}
            onChange={handleChange}
            min={rapportData.startDatum}
            max={formatDate(vandaag)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={rapportData.type === 'daily'}
          />
        </div>
      </div>
      
      {/* Rapport instellingen */}
      <div className="mb-6">
        <label className="block text-gray-700 font-medium mb-2">
          Formaat
        </label>
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="format"
              value="pdf"
              checked={rapportData.format === 'pdf'}
              onChange={handleChange}
              className="mr-2 h-4 w-4 text-purple-600 focus:ring-purple-500"
            />
            <span>PDF</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="radio"
              name="format"
              value="csv"
              checked={rapportData.format === 'csv'}
              onChange={handleChange}
              className="mr-2 h-4 w-4 text-purple-600 focus:ring-purple-500"
            />
            <span>CSV (Excel)</span>
          </label>
        </div>
      </div>
      
      {/* Inhoud selectie */}
      <div className="mb-6">
        <label className="block text-gray-700 font-medium mb-2">
          Te includeren gegevens
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="includeTasken"
              checked={rapportData.includeTasken}
              onChange={handleCheckboxChange}
              className="mr-2 h-4 w-4 text-purple-600 focus:ring-purple-500 rounded"
            />
            <span>Taken en opdrachten</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              name="includeMetrieken"
              checked={rapportData.includeMetrieken}
              onChange={handleCheckboxChange}
              className="mr-2 h-4 w-4 text-purple-600 focus:ring-purple-500 rounded"
            />
            <span>Gezondheidsmetrieken (pijn, vermoeidheid, etc.)</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              name="includeReflecties"
              checked={rapportData.includeReflecties}
              onChange={handleCheckboxChange}
              className="mr-2 h-4 w-4 text-purple-600 focus:ring-purple-500 rounded"
            />
            <span>Dagelijkse reflecties</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              name="includeInzichten"
              checked={rapportData.includeInzichten}
              onChange={handleCheckboxChange}
              className="mr-2 h-4 w-4 text-purple-600 focus:ring-purple-500 rounded"
            />
            <span>AI inzichten</span>
          </label>
        </div>
      </div>
      
      {/* Genereer knop */}
      <button
        type="button"
        onClick={handleGenerateRapport}
        disabled={loading}
        className={`w-full py-3 mt-4 rounded-md text-white font-medium ${
          loading ? 'bg-purple-300' : 'bg-purple-600 hover:bg-purple-700'
        } transition-colors`}
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Rapport genereren...
          </span>
        ) : (
          'Rapport Genereren'
        )}
      </button>
    </section>
  );
}