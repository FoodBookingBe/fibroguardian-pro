'use client';
import { useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase'; // Corrected import
import { useAuth } from '@/components/auth/AuthProvider'; // Corrected import path

export default function AddPatientButton() {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const supabaseClient = getSupabaseBrowserClient(); // Corrected usage
      // Zoek patiënt op basis van e-mail
      const { data: userData, error: userError } = await supabaseClient
        .from('profiles')
        .select('id, type')
        .eq('id', user.id)
        .single();
      
      if (userError) throw userError;
      
      // Controleer of de huidige gebruiker een specialist is
      if (!userData || userData.type !== 'specialist') {
        throw new Error('U heeft geen toestemming om patiënten toe te voegen');
      }
      
      // Zoek patiënt op basis van e-mail
      const { data: users, error: emailError } = await supabaseClient
        .from('auth.users')
        .select('id')
        .eq('email', email);
      
      if (emailError) throw emailError;
      
      if (!users || users.length === 0) {
        throw new Error('Geen gebruiker gevonden met dit e-mailadres');
      }
      
      const patientId = users[0].id;
      
      // Controleer of deze patiënt al is toegewezen aan deze specialist
      const { data: existingRelation, error: relationError } = await supabaseClient
        .from('specialist_patienten')
        .select('id')
        .eq('specialist_id', user.id)
        .eq('patient_id', patientId);
      
      if (relationError) throw relationError;
      
      if (existingRelation && existingRelation.length > 0) {
        throw new Error('Deze patiënt is al aan u toegewezen');
      }
      
      // Voeg relatie toe
      const { error: insertError } = await supabaseClient
        .from('specialist_patienten')
        .insert([{
          specialist_id: user.id,
          patient_id: patientId,
          toegangsrechten: ['view_tasks', 'view_logs', 'create_tasks']
        }]);
      
      if (insertError) throw insertError;
      
      setSuccess('Patiënt succesvol toegevoegd');
      setTimeout(() => {
        setShowModal(false);
        setSuccess(null);
        setEmail('');
        // Refresh pagina na succes
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      console.error('Error adding patient:', err);
      setError(err.message || 'Er is een fout opgetreden');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 bg-purple-600 text-white font-medium rounded-md hover:bg-purple-700 transition-colors"
      >
        Patiënt Toevoegen
      </button>
      
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Patiënt Toevoegen</h3>
              
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md">
                  {success}
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    E-mailadres van patiënt
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Voer het e-mailadres in waarmee de patiënt is geregistreerd.
                  </p>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
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
                    } transition-colors`}
                  >
                    {loading ? 'Bezig...' : 'Toevoegen'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}