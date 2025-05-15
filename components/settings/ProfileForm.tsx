'use client';
import { useState, useEffect, FormEvent, ChangeEvent } from 'react'; // Added FormEvent, ChangeEvent
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthProvider';
import { useNotification } from '@/context/NotificationContext';
import { handleSupabaseError } from '@/lib/error-handler';
import { Profile } from '@/types'; // Assuming Profile type is defined in @/types

// Basic ErrorAlert component if not defined elsewhere
interface ErrorAlertProps {
  error: string | null;
}
const ErrorAlert = ({ error }: ErrorAlertProps) => {
  if (!error) return null;
  return <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md">{error}</div>;
};


const ProfileForm = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [loading, setLoading] = useState<boolean>(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null); // For storing the selected file
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null); // For showing image preview
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Adjusted type for formData to allow string for geboortedatum in state
  const [formData, setFormData] = useState<Omit<Partial<Profile>, 'geboortedatum'> & { geboortedatum?: string }>({
    voornaam: '',
    achternaam: '',
    postcode: '',
    gemeente: '',
    geboortedatum: undefined, // Use undefined for optional date
  });
  
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      setLoading(true);
      const supabase = getSupabaseBrowserClient(); // Get client instance
      try {
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('voornaam, achternaam, postcode, gemeente, geboortedatum, avatar_url')
          .eq('id', user.id)
          .single();
        
        if (fetchError) throw fetchError;
        
        if (data) {
          setFormData({
            voornaam: data.voornaam || '',
            achternaam: data.achternaam || '',
            postcode: data.postcode || '',
            gemeente: data.gemeente || '',
            // Ensure date is formatted correctly for input type="date" if it's a string
            geboortedatum: data.geboortedatum ? new Date(data.geboortedatum).toISOString().split('T')[0] : undefined,
          });
          setAvatarPreview(data.avatar_url); // Use avatarPreview for the displayed image
        }
      } catch (err) {
        const errorInfo = handleSupabaseError(err, 'profiel-laden');
        setError(errorInfo.userMessage);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [user]);
  
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setAvatarFile(null);
      // Optionally revert to original avatar if user cancels selection
      // For now, keeps current preview or clears if no file selected
    }
  };
  
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      setError("U bent niet ingelogd.");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      let newAvatarUrl = formData.avatar_url; // Keep existing if no new file

      if (avatarFile) {
        setUploading(true);
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `avatar-${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `public/${fileName}`; // Path in 'profiles' bucket

        const supabase = getSupabaseBrowserClient(); // Get client instance for storage operation
        const { error: uploadError } = await supabase.storage
          .from('profiles') // Bucket name
          .upload(filePath, avatarFile, { upsert: true }); // upsert true to overwrite if exists

        if (uploadError) throw uploadError;

        // Ensure supabase client is available for getPublicUrl
        const supabaseForUrl = getSupabaseBrowserClient();
        const { data: urlData } = supabaseForUrl.storage.from('profiles').getPublicUrl(filePath);
        newAvatarUrl = urlData?.publicUrl;
        setUploading(false);
      }

      const profileUpdateData: Partial<Profile> = {
        ...formData,
        // geboortedatum is already a string 'YYYY-MM-DD' or undefined from state,
        // Supabase client JS can handle this string format for date/timestamp fields.
        // If your 'geboortedatum' column in Supabase is strictly 'date', this is fine.
        // If it's 'timestamp', Supabase might store it at midnight UTC.
        // For consistency, ensure `formData.geboortedatum` is what you intend to save.
        // The new Date(formData.geboortedatum) was for converting to Date object,
        // but if the column type handles 'YYYY-MM-DD' string, it's simpler.
        // Let's keep it as is from formData, assuming the DB column type is `date`.
        geboortedatum: formData.geboortedatum ? new Date(formData.geboortedatum) : undefined,
        updated_at: new Date(), // Always update timestamp, ensure it's a Date object
      };
      if (newAvatarUrl !== undefined) { // Only include avatar_url if it changed or was set
        profileUpdateData.avatar_url = newAvatarUrl;
      }

      const supabaseUpdate = getSupabaseBrowserClient();
      const { error: updateError } = await supabaseUpdate
        .from('profiles')
        .update(profileUpdateData)
        .eq('id', user.id);
      
      if (updateError) throw updateError;
      
      addNotification({ type: 'success', message: 'Profiel succesvol bijgewerkt!', duration: 3000 });
      router.push('/dashboard'); // Or to a profile page
      router.refresh(); // Refresh server components
    } catch (err) {
      const errorInfo = handleSupabaseError(err, 'profiel-bijwerken');
      setError(errorInfo.userMessage);
      addNotification({ type: 'error', message: errorInfo.userMessage, duration: 5000 });
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };
  
  if (loading && !formData.voornaam) { // Initial loading state
    return <div className="p-6 text-center">Profiel laden...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-lg mx-auto">
      <h2 className="text-xl font-semibold mb-6 text-gray-800">Mijn Profiel Bewerken</h2>
      
      <ErrorAlert error={error} />
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex flex-col items-center space-y-3">
          <div className="relative h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Profielfoto" className="h-full w-full object-cover" />
            ) : (
              <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            )}
             <label 
              htmlFor="avatar-upload-input" 
              className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center cursor-pointer text-white shadow-md transition-colors"
              title="Profielfoto wijzigen"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              <input id="avatar-upload-input" type="file" accept="image/png, image/jpeg, image/webp" className="hidden" onChange={handleAvatarChange} disabled={uploading}/>
            </label>
          </div>
          {uploading && <p className="text-xs text-purple-600 animate-pulse">Foto uploaden...</p>}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
          <div>
            <label htmlFor="voornaam" className="form-label">Voornaam</label>
            <input id="voornaam" name="voornaam" type="text" value={formData.voornaam || ''} onChange={handleChange} className="form-input" required />
          </div>
          <div>
            <label htmlFor="achternaam" className="form-label">Achternaam</label>
            <input id="achternaam" name="achternaam" type="text" value={formData.achternaam || ''} onChange={handleChange} className="form-input" required />
          </div>
          <div>
            <label htmlFor="postcode" className="form-label">Postcode</label>
            <input id="postcode" name="postcode" type="text" value={formData.postcode || ''} onChange={handleChange} className="form-input" />
          </div>
          <div>
            <label htmlFor="gemeente" className="form-label">Gemeente</label>
            <input id="gemeente" name="gemeente" type="text" value={formData.gemeente || ''} onChange={handleChange} className="form-input" />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="geboortedatum" className="form-label">Geboortedatum</label>
            <input id="geboortedatum" name="geboortedatum" type="date" value={formData.geboortedatum?.toString() || ''} onChange={handleChange} className="form-input" max={new Date().toISOString().split("T")[0]} />
            <p className="mt-1 text-xs text-gray-500">Optioneel. Alleen zichtbaar voor u en uw zorgverleners.</p>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 pt-5 border-t border-gray-200">
          <button type="button" onClick={() => router.back()} className="btn-secondary" disabled={loading || uploading}>Annuleren</button>
          <button type="submit" disabled={loading || uploading} className={`btn-primary ${ (loading || uploading) ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {loading || uploading ? 'Opslaan...' : 'Profiel Opslaan'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileForm;