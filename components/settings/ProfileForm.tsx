'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase'; // Corrected import

export default function ProfileForm() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    voornaam: '',
    achternaam: '',
    postcode: '',
    gemeente: '',
    geboortedatum: '',
    type: 'patient', // Default to patient
  });
  
  // Load user profile data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const supabaseClient = getSupabaseBrowserClient(); // Corrected usage
        const { data: { user } } = await supabaseClient.auth.getUser();
        
        if (!user) {
          router.push('/auth/login');
          return;
        }
        
        const { data, error } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        
        if (data) {
          setFormData({
            voornaam: data.voornaam || '',
            achternaam: data.achternaam || '',
            postcode: data.postcode || '',
            gemeente: data.gemeente || '',
            geboortedatum: data.geboortedatum || '',
            type: data.type || 'patient',
          });
          
          setAvatarUrl(data.avatar_url);
        }
      } catch (error: any) {
        console.error('Error loading profile:', error);
        setError('Er is een fout opgetreden bij het laden van uw profiel.');
      }
    };
    
    loadProfile();
  }, [router]);
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle avatar upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files.length) return;
    
    const supabaseClient = getSupabaseBrowserClient(); // Corrected usage
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;
    
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `avatars/${fileName}`;
    
    setUploading(true);
    setError(null);
    
    try {
      // Upload file to Supabase storage
      const { error: uploadError } = await supabaseClient.storage
        .from('profiles')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      try {
        // Check if the bucket exists, if not create it
        const { data: buckets } = await supabaseClient.storage.listBuckets();
        const profilesBucketExists = buckets?.some(bucket => bucket.name === 'profiles');
        
        if (!profilesBucketExists) {
          const { error: createBucketError } = await supabaseClient.storage.createBucket('profiles', {
            public: true
          });
          
          if (createBucketError) throw createBucketError;
        }
        
        // Get public URL
        const { data: urlData } = supabaseClient.storage
          .from('profiles')
          .getPublicUrl(filePath);
        
        // Update profile with avatar URL
        if (urlData) {
          setAvatarUrl(urlData.publicUrl);
          
          // Update in database
          const { error: updateError } = await supabaseClient
            .from('profiles')
            .update({ avatar_url: urlData.publicUrl })
            .eq('id', user.id);
          
          if (updateError) throw updateError;
          
          setSuccess('Profielfoto bijgewerkt');
          setTimeout(() => setSuccess(null), 3000);
        } else {
          throw new Error('Kon geen publieke URL krijgen voor de profielfoto');
        }
      } catch (storageError: any) {
        console.error('Storage error:', storageError);
        throw new Error(`Fout bij het verwerken van de profielfoto: ${storageError.message}`);
      }
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      setError('Fout bij uploaden van profielfoto.');
    } finally {
      setUploading(false);
      
      // Reset input
      e.target.value = '';
    }
  };
  
  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const supabaseClient = getSupabaseBrowserClient(); // Corrected usage
      const { data: { user } } = await supabaseClient.auth.getUser();
      
      if (!user) {
        router.push('/auth/login');
        return;
      }
      
      // Update profile
      const { error } = await supabaseClient
        .from('profiles')
        .update(formData)
        .eq('id', user.id);
      
      if (error) throw error;
      
      setSuccess('Profiel bijgewerkt');
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setError(error.message || 'Er is een fout opgetreden bij het bijwerken van uw profiel.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-6">Mijn Profiel</h2>
      
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
        {/* Avatar upload */}
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-4 relative">
            <div className="h-24 w-24 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="Profielfoto" 
                  className="h-full w-full object-cover"
                />
              ) : (
                <svg className="h-12 w-12 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
            </div>
            
            <label 
              htmlFor="avatar-upload" 
              className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center cursor-pointer text-white shadow-md"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="sr-only">Profielfoto toevoegen</span>
            </label>
            
            <input 
              id="avatar-upload" 
              type="file" 
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
              disabled={uploading}
            />
          </div>
          
          {uploading && (
            <p className="text-sm text-gray-500 animate-pulse">Uploading...</p>
          )}
          
          <p className="text-sm text-gray-500 mt-1">
            Upload een profielfoto (optioneel)
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Voornaam */}
          <div>
            <label htmlFor="voornaam" className="block text-sm font-medium text-gray-700 mb-1">
              Voornaam
            </label>
            <input
              id="voornaam"
              name="voornaam"
              type="text"
              value={formData.voornaam}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>
          
          {/* Achternaam */}
          <div>
            <label htmlFor="achternaam" className="block text-sm font-medium text-gray-700 mb-1">
              Achternaam
            </label>
            <input
              id="achternaam"
              name="achternaam"
              type="text"
              value={formData.achternaam}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Postcode */}
          <div>
            <label htmlFor="postcode" className="block text-sm font-medium text-gray-700 mb-1">
              Postcode
            </label>
            <input
              id="postcode"
              name="postcode"
              type="text"
              value={formData.postcode}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          {/* Gemeente */}
          <div>
            <label htmlFor="gemeente" className="block text-sm font-medium text-gray-700 mb-1">
              Gemeente
            </label>
            <input
              id="gemeente"
              name="gemeente"
              type="text"
              value={formData.gemeente}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
        
        {/* Geboortedatum */}
        <div className="mb-6">
          <label htmlFor="geboortedatum" className="block text-sm font-medium text-gray-700 mb-1">
            Geboortedatum
          </label>
          <input
            id="geboortedatum"
            name="geboortedatum"
            type="date"
            value={formData.geboortedatum}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            Deze informatie is alleen zichtbaar voor u en uw zorgverleners
          </p>
        </div>
        
        {/* Type (alleen bewerken bij eerste setup) */}
        <div className="mb-6">
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
            Account type
          </label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={formData.type !== ''}
          >
            <option value="patient">Patiënt</option>
            <option value="specialist">Zorgverlener / Specialist</option>
          </select>
          <p className="mt-1 text-sm text-gray-500">
            Het accounttype kan niet worden gewijzigd na registratie
          </p>
        </div>
        
        {/* Submit button */}
        <div className="flex justify-end space-x-3">
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
            className={`px-4 py-2 rounded-md text-white font-medium transition-colors ${
              loading ? 'bg-purple-300' : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            {loading ? 'Bezig met opslaan...' : 'Profiel Opslaan'}
          </button>
        </div>
      </form>
    </div>
  );
}
