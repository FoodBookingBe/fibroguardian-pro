'use client';
import { useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface TaskFormProps {
  taskId?: string;
  initialType?: 'taak' | 'opdracht';
}

export default function TaskForm({ taskId, initialType = 'taak' }: TaskFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [taskData, setTaskData] = useState({
    type: initialType,
    titel: '',
    beschrijving: '',
    duur: 15,
    hartslag_doel: '',
    herhaal_patroon: 'eenmalig',
    dagen_van_week: [] as string[],
    metingen: ['energie', 'pijn', 'vermoeidheid'] as string[],
    notities: '',
    labels: [] as string[]
  });

  // Haal bestaande taak op als we aan het bewerken zijn
  useEffect(() => {
    async function fetchTask() {
      if (!taskId) return;

      try {
        const supabaseClient = getSupabaseBrowserClient();
        const { data, error } = await supabaseClient
          .from('tasks')
          .select('*')
          .eq('id', taskId)
          .single();

        if (error) throw error;
        if (data) setTaskData(data);
      } catch (error) {
        console.error('Fout bij ophalen taak:', error);
        setError('De taak kon niet worden geladen');
      }
    }

    fetchTask();
  }, [taskId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTaskData(prev => ({ ...prev, [name]: value }));
  };

  const handleDayToggle = (day: string) => {
    const days = [...taskData.dagen_van_week];
    const index = days.indexOf(day);
    
    if (index > -1) {
      days.splice(index, 1);
    } else {
      days.push(day);
    }
    
    setTaskData(prev => ({ ...prev, dagen_van_week: days }));
  };

  const handleMeasurementToggle = (measurement: string) => {
    const measurements = [...taskData.metingen];
    const index = measurements.indexOf(measurement);
    
    if (index > -1) {
      measurements.splice(index, 1);
    } else {
      measurements.push(measurement);
    }
    
    setTaskData(prev => ({ ...prev, metingen: measurements }));
  };

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const labels = e.target.value.split(',').map(label => label.trim());
    setTaskData(prev => ({ ...prev, labels }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabaseClient = getSupabaseBrowserClient();
      const { data: { user } } = await supabaseClient.auth.getUser();
      
      if (!user) throw new Error('Niet ingelogd');

      const taskWithUserId = {
        ...taskData,
        user_id: user.id,
        hartslag_doel: taskData.hartslag_doel ? parseInt(taskData.hartslag_doel.toString()) : null,
        duur: taskData.duur ? parseInt(taskData.duur.toString()) : null
      };

      let result;
      
      if (taskId) {
        // Update bestaande taak
        result = await supabaseClient
          .from('tasks')
          .update(taskWithUserId)
          .eq('id', taskId);
      } else {
        // Maak nieuwe taak
        result = await supabaseClient
          .from('tasks')
          .insert([taskWithUserId])
          .select(); // Explicitly select the inserted data
      }

      if (result.error) throw result.error;
      
      // Controleer of deze taak voor vandaag ingepland moet worden
      if (taskData.herhaal_patroon === 'eenmalig' || 
          taskData.herhaal_patroon === 'dagelijks' ||
          (taskData.herhaal_patroon === 'wekelijks' && 
           taskData.dagen_van_week.includes(new Date().getDay().toString()))) {
        
        const today = new Date().toISOString().split('T')[0];
        
        // Zoek bestaande planning voor vandaag
        const supabaseClient = getSupabaseBrowserClient(); // Added this line
        const { data: existingPlan } = await supabaseClient
          .from('planning')
          .select('*')
          .eq('user_id', user.id)
          .eq('datum', today)
          .single();
        
        // Update planning of maak nieuwe
        const newTaskId = taskId || result.data?.[0]?.id;
        
        if (existingPlan) {
          if (!existingPlan.task_ids.includes(newTaskId)) {
            await supabaseClient
              .from('planning')
              .update({
                task_ids: [...existingPlan.task_ids, newTaskId]
              })
              .eq('id', existingPlan.id);
          }
        } else {
          await supabaseClient
            .from('planning')
            .insert([{
              user_id: user.id,
              datum: today, 
              task_ids: [newTaskId] 
            }]);
        }
      }
      
      router.push('/taken');
    } catch (error: any) {
      console.error('Fout bij opslaan taak:', error);
      setError(error.message || 'De taak kon niet worden opgeslagen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="task-form" className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-6">
        {taskId ? 'Bewerk' : 'Nieuwe'} {taskData.type === 'opdracht' ? 'Opdracht' : 'Taak'}
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Type selector */}
        <div className="mb-5">
          <label className="block text-gray-700 font-medium mb-2">Type</label>
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => setTaskData(prev => ({ ...prev, type: 'taak' }))}
              className={`px-4 py-2 rounded-md transition ${
                taskData.type === 'taak'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Taak
            </button>
            <button
              type="button"
              onClick={() => setTaskData(prev => ({ ...prev, type: 'opdracht' }))}
              className={`px-4 py-2 rounded-md transition ${
                taskData.type === 'opdracht'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Opdracht
            </button>
          </div>
        </div>

        {/* Titel */}
        <div className="mb-4">
          <label htmlFor="titel" className="block text-gray-700 font-medium mb-2">
            Titel
          </label>
          <input
            id="titel"
            name="titel"
            type="text"
            value={taskData.titel}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
        </div>

        {/* Beschrijving */}
        <div className="mb-4">
          <label htmlFor="beschrijving" className="block text-gray-700 font-medium mb-2">
            Beschrijving / Instructies
          </label>
          <textarea
            id="beschrijving"
            name="beschrijving"
            value={taskData.beschrijving}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          ></textarea>
        </div>

        {/* Duur */}
        <div className="mb-4">
          <label htmlFor="duur" className="block text-gray-700 font-medium mb-2">
            Duur (minuten)
          </label>
          <input
            id="duur"
            name="duur"
            type="number"
            min="1"
            max="480"
            value={taskData.duur}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Hartslag doel (alleen voor opdrachten) */}
        {taskData.type === 'opdracht' && (
          <div className="mb-4">
            <label htmlFor="hartslag_doel" className="block text-gray-700 font-medium mb-2">
              Hartslag Doel (BPM)
            </label>
            <input
              id="hartslag_doel"
              name="hartslag_doel"
              type="number"
              min="40"
              max="200"
              value={taskData.hartslag_doel}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        )}

        {/* Herhaalpatroon */}
        <div className="mb-4">
          <label htmlFor="herhaal_patroon" className="block text-gray-700 font-medium mb-2">
            Herhaalpatroon
          </label>
          <select
            id="herhaal_patroon"
            name="herhaal_patroon"
            value={taskData.herhaal_patroon}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="eenmalig">Eenmalig</option>
            <option value="dagelijks">Dagelijks</option>
            <option value="wekelijks">Wekelijks</option>
            <option value="maandelijks">Maandelijks</option>
            <option value="aangepast">Aangepast</option>
          </select>
        </div>

        {/* Dagen van de week (voor wekelijks) */}
        {taskData.herhaal_patroon === 'wekelijks' && (
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Dagen van de week
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { key: '0', label: 'Zo' },
                { key: '1', label: 'Ma' },
                { key: '2', label: 'Di' },
                { key: '3', label: 'Wo' },
                { key: '4', label: 'Do' },
                { key: '5', label: 'Vr' },
                { key: '6', label: 'Za' }
              ].map(day => (
                <button
                  key={day.key}
                  type="button"
                  onClick={() => handleDayToggle(day.key)}
                  className={`px-3 py-1 rounded-md ${
                    taskData.dagen_van_week.includes(day.key)
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Metingen */}
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            Te registreren metingen
          </label>
          <div className="space-y-2">
            {[
              { key: 'energie', label: 'Energie' },
              { key: 'pijn', label: 'Pijn' },
              { key: 'vermoeidheid', label: 'Vermoeidheid' },
              { key: 'stemming', label: 'Stemming' },
              { key: 'hartslag', label: 'Hartslag' }
            ].map(measurement => (
              <div key={measurement.key} className="flex items-center">
                <input
                  id={`meting-${measurement.key}`}
                  type="checkbox"
                  checked={taskData.metingen.includes(measurement.key)}
                  onChange={() => handleMeasurementToggle(measurement.key)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor={`meting-${measurement.key}`} className="ml-2 block text-sm text-gray-700">
                  {measurement.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Labels */}
        <div className="mb-4">
          <label htmlFor="labels" className="block text-gray-700 font-medium mb-2">
            Labels (komma-gescheiden)
          </label>
          <input
            id="labels"
            name="labels"
            type="text"
            value={taskData.labels.join(', ')}
            onChange={handleLabelChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Bijv. belangrijk, werk, thuis"
          />
        </div>

        {/* Notities */}
        <div className="mb-4">
          <label htmlFor="notities" className="block text-gray-700 font-medium mb-2">
            Notities
          </label>
          <textarea
            id="notities"
            name="notities"
            value={taskData.notities}
            onChange={handleChange}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          ></textarea>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Annuleren
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2 rounded-md text-white font-medium ${
              loading ? 'bg-purple-300' : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            {loading ? 'Bezig met opslaan...' : 'Opslaan'}
          </button>
        </div>
      </form>
    </section>
  );
}