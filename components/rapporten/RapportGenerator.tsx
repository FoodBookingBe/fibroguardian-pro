'use client';
import { useState, ChangeEvent } from 'react'; // Added ChangeEvent
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthProvider';
// Assuming ErrorAlert is part of error-handler or a separate component
import { handleSupabaseError } from '@/lib/error-handler'; 

type RapportType = 'daily' | 'weekly' | 'monthly' | 'custom';
type RapportFormat = 'pdf' | 'csv';

interface ErrorAlertProps {
  error: { userMessage: string, technicalMessage?: string, action?: string } | string | null;
}

const ErrorAlert = ({ error }: ErrorAlertProps) => {
  if (!error) return null;
  const message = typeof error === 'string' ? error : error.userMessage;
  return <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md">{message}</div>;
};

export default function RapportGenerator() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ReturnType<typeof handleSupabaseError> | null>(null);
  
  const vandaag = new Date();
  const eenWeekTerug = new Date();
  eenWeekTerug.setDate(vandaag.getDate() - 7);
  const eenMaandTerug = new Date();
  eenMaandTerug.setMonth(vandaag.getMonth() - 1);
  
  const formatDateForInput = (date: Date): string => { // Renamed for clarity
    return date.toISOString().split('T')[0];
  };
  
  const [rapportData, setRapportData] = useState({
    type: 'weekly' as RapportType,
    format: 'pdf' as RapportFormat,
    startDatum: formatDateForInput(eenWeekTerug),
    eindDatum: formatDateForInput(vandaag),
    includeTasken: true,
    includeMetrieken: true,
    includeReflecties: true,
    includeInzichten: true,
  });
  
  const handleTypeChange = (type: RapportType) => {
    let newStartDatum = rapportData.startDatum;
    const newEindDatum = formatDateForInput(vandaag); // Always set end date to today for predefined types
    
    switch (type) {
      case 'daily':
        newStartDatum = formatDateForInput(vandaag);
        break;
      case 'weekly':
        newStartDatum = formatDateForInput(eenWeekTerug);
        break;
      case 'monthly':
        newStartDatum = formatDateForInput(eenMaandTerug);
        break;
      // For 'custom', keep existing dates or let user pick
    }
    
    setRapportData(prev => ({
      ...prev,
      type,
      startDatum: newStartDatum,
      eindDatum: newEindDatum, // Update end date for daily, weekly, monthly
    }));
  };
  
  const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setRapportData(prev => ({ ...prev, [name]: checked }));
  };
  
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setRapportData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleGenerateRapport = async () => {
    if (!user) {
      setError({userMessage: "U moet ingelogd zijn om een rapport te genereren."});
      return;
    }
    
    setLoading(true);
    setError(null);
    
    setError(null);
    
    try {
      if (!rapportData.startDatum || !rapportData.eindDatum) {
        throw new Error('Start- en einddatum zijn verplicht');
      }
      if (new Date(rapportData.startDatum) > new Date(rapportData.eindDatum)) {
        throw new Error('Startdatum kan niet na de einddatum liggen.');
      }
      if (!rapportData.includeTasken && !rapportData.includeMetrieken &&
          !rapportData.includeReflecties && !rapportData.includeInzichten) {
        throw new Error('Selecteer ten minste één type gegevens om op te nemen in het rapport.');
      }
      
      const supabase = getSupabaseBrowserClient(); // Get client instance once for all queries in this try block
      const dataToFetch: any = { rapportConfig: rapportData };
      
      if (rapportData.includeTasken) {
        const { data, error } = await supabase.from('tasks').select('*').eq('user_id', user.id)
          .gte('created_at', `${rapportData.startDatum}T00:00:00Z`)
          .lte('created_at', `${rapportData.eindDatum}T23:59:59Z`);
        if (error) throw error;
        dataToFetch.taken = data;
      }
      
      if (rapportData.includeMetrieken) {
        const { data, error } = await supabase.from('task_logs').select('*, tasks(titel)')
          .eq('user_id', user.id)
          .gte('start_tijd', `${rapportData.startDatum}T00:00:00Z`)
          .lte('start_tijd', `${rapportData.eindDatum}T23:59:59Z`);
        if (error) throw error;
        dataToFetch.logs = data;
      }
      
      if (rapportData.includeReflecties) {
        const { data, error } = await supabase.from('reflecties').select('*').eq('user_id', user.id)
          .gte('datum', rapportData.startDatum)
          .lte('datum', rapportData.eindDatum);
        if (error) throw error;
        dataToFetch.reflecties = data;
      }
      
      if (rapportData.includeInzichten) {
        const { data, error } = await supabase.from('inzichten').select('*').eq('user_id', user.id)
          .gte('created_at', `${rapportData.startDatum}T00:00:00Z`)
          .lte('created_at', `${rapportData.eindDatum}T23:59:59Z`);
        if (error) throw error;
        dataToFetch.inzichten = data;
      }
      
      const { data: profiel, error: profielError } = await supabase.from('profiles').select('voornaam, achternaam, email').eq('id', user.id).single();
      if (profielError) throw profielError;
      dataToFetch.profiel = profiel;
      
      // Store data in localStorage for the preview page to access
      localStorage.setItem('fibroGuardianRapportData', JSON.stringify(dataToFetch));
      
      router.push(`/rapporten/preview?format=${rapportData.format}`);
    } catch (err: any) {
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <section className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-6 text-gray-800">Rapport Genereren</h2>
      
      {error && <ErrorAlert error={error} />}
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Type Rapport</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(['daily', 'weekly', 'monthly', 'custom'] as RapportType[]).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => handleTypeChange(type)}
                className={`px-3 py-2.5 rounded-md flex flex-col items-center justify-center text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-purple-500 ${
                  rapportData.type === type ? 'bg-purple-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                aria-pressed={rapportData.type === type ? "true" : "false"}
              >
                {/* Icons can be added here similar to the original example */}
                <span className="capitalize">{type === 'daily' ? 'Dagelijks' : type === 'weekly' ? 'Wekelijks' : type === 'monthly' ? 'Maandelijks' : 'Aangepast'}</span>
              </button>
            ))}
          </div>
        </div>
        
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${rapportData.type === 'daily' ? 'opacity-60 pointer-events-none' : ''}`}>
          <div>
            <label htmlFor="startDatum" className="form-label">Startdatum</label>
            <input
              type="date"
              id="startDatum"
              name="startDatum"
              value={rapportData.startDatum}
              onChange={handleChange}
              max={rapportData.eindDatum}
              className="form-input"
              disabled={rapportData.type === 'daily'}
              required
            />
          </div>
          <div>
            <label htmlFor="eindDatum" className="form-label">Einddatum</label>
            <input
              type="date"
              id="eindDatum"
              name="eindDatum"
              value={rapportData.eindDatum}
              onChange={handleChange}
              min={rapportData.startDatum}
              max={formatDateForInput(vandaag)}
              className="form-input"
              disabled={rapportData.type === 'daily'}
              required
            />
          </div>
        </div>
        
        <div>
          <label className="form-label">Formaat</label>
          <div className="flex space-x-4">
            {(['pdf', 'csv'] as RapportFormat[]).map(format => (
              <label key={format} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value={format}
                  checked={rapportData.format === format}
                  onChange={handleChange}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                />
                <span className="text-sm text-gray-700">{format.toUpperCase()}</span>
              </label>
            ))}
          </div>
        </div>
        
        <div>
          <label className="form-label">Te includeren gegevens</label>
          <div className="space-y-2">
            {(['includeTasken', 'includeMetrieken', 'includeReflecties', 'includeInzichten'] as const).map(item => (
              <label key={item} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  name={item}
                  checked={rapportData[item]}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">
                  {item === 'includeTasken' ? 'Taken en opdrachten' :
                   item === 'includeMetrieken' ? 'Gezondheidsmetrieken' :
                   item === 'includeReflecties' ? 'Dagelijkse reflecties' : 'AI inzichten'}
                </span>
              </label>
            ))}
          </div>
        </div>
        
        <button
          type="button"
          onClick={handleGenerateRapport}
          disabled={loading}
          className="w-full btn-primary py-2.5 mt-2" // Adjusted padding
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
      </div>
    </section>
  );
}