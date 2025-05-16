'use client';
import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { useProfile } from '@/hooks/useSupabaseQuery';
import { useUpdateProfile } from '@/hooks/useMutations';
import { AlertMessage } from '@/components/common/AlertMessage'; // Keep for inline form validation errors if any
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { Profile } from '@/types';
import { useNotification } from '@/context/NotificationContext'; // Import useNotification
import { getSupabaseBrowserClient } from '@/lib/supabase'; // For avatar upload
import { ErrorMessage } from '@/lib/error-handler';

// Helper to initialize form state from Profile data
const profileToFormState = (profile?: Profile | null) => {
  return {
    voornaam: profile?.voornaam || '',
    achternaam: profile?.achternaam || '',
    postcode: profile?.postcode || '',
    gemeente: profile?.gemeente || '',
    geboortedatum: profile?.geboortedatum ? (new Date(profile.geboortedatum).toISOString().split('T')[0]) : '',
    // type is usually not changed by user in a profile form, but shown
  };
};

export default function ProfileForm() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id;

  // Fetch profile data
  const { 
    data: profileData, 
    isLoading: isLoadingProfile, 
    error: fetchProfileError,
    isError: isFetchProfileError
  } = useProfile(userId, { enabled: !!userId });

  // Form state
  const [formData, setFormData] = useState(profileToFormState(profileData));
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profileData?.avatar_url || null);
  const [uploadingAvatar, setUploadingAvatar] = useState<boolean>(false);
  // const [avatarError, setAvatarError] = useState<string | null>(null); // Replaced by notifications
  // const [avatarSuccess, setAvatarSuccess] = useState<string | null>(null); // Replaced by notifications
  const { addNotification } = useNotification(); // Initialize notification hook

  // Update form state when profileData is fetched or changes
  useEffect(() => {
    if (profileData) {
      setFormData(profileToFormState(profileData));
      setAvatarUrl(profileData.avatar_url || null);
    }
  }, [profileData]);

  // Mutation hook for updating profile
  const { 
    mutate: updateProfile, 
    isPending: isUpdatingProfile, 
    error: updateProfileHookError, // This will be ErrorMessage
    isError: isUpdateProfileError,
    isSuccess: isUpdateProfileSuccess
  } = useUpdateProfile();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files.length || !user) return;

    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`; // Ensure unique name
    const filePath = `avatars/${fileName}`;

    setUploadingAvatar(true);
    // setAvatarError(null); // Removed, using global notifications
    // setAvatarSuccess(null); // Removed, using global notifications

    const supabaseClient = getSupabaseBrowserClient(); // Direct client for storage

    try {
      // Upload file
      const { error: uploadError } = await supabaseClient.storage
        .from('profiles') // Bucket name
        .upload(filePath, file, { upsert: true }); // Upsert to overwrite if same name (though unlikely with Date.now())

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabaseClient.storage
        .from('profiles')
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error('Kon geen publieke URL krijgen voor de profielfoto.');
      }
      
      setAvatarUrl(urlData.publicUrl);

      // Update profile in DB with new avatar URL via mutation hook
    updateProfile({ id: user.id, data: { avatar_url: urlData.publicUrl } }, {
        onSuccess: () => {
          addNotification('success', 'Profielfoto succesvol bijgewerkt.');
        },
        onError: (err) => {
          addNotification('error', err.userMessage || 'Fout bij opslaan avatar URL.');
        }
      });

    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      addNotification('error', error.message || 'Fout bij uploaden van profielfoto.');
    } finally {
      setUploadingAvatar(false);
      e.target.value = ''; // Reset file input
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    const profileUpdateData: Partial<Profile> = {
      ...formData,
      // geboortedatum might need conversion if stored as Date but input is string
      geboortedatum: formData.geboortedatum ? new Date(formData.geboortedatum) : undefined,
    };
    
    updateProfile({ id: user.id, data: profileUpdateData }, {
      onSuccess: () => {
        addNotification('success', 'Profiel succesvol bijgewerkt!');
        // router.push('/dashboard'); // Optional redirect
      },
      onError: (err) => { // Error is already available via updateProfileHookError for AlertMessage
        addNotification('error', err.userMessage || 'Fout bij opslaan profiel.');
      }
    });
  };

  if (isLoadingProfile) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-6">Mijn Profiel Laden...</h2>
        <SkeletonLoader type="form" count={4} />
      </div>
    );
  }
  
  const typedFetchProfileError = fetchProfileError as ErrorMessage | null;
  if (isFetchProfileError && typedFetchProfileError) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <AlertMessage type="error" title="Fout bij laden profiel" message={typedFetchProfileError.userMessage || "Kon profiel niet laden."} />
      </div>
    );
  }
  
  const typedUpdateProfileError = updateProfileHookError as ErrorMessage | null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-6">Mijn Profiel</h2>
      
      {/* Inline AlertMessage can still be used for form-specific validation errors not handled by global notifications */}
      {isUpdateProfileError && typedUpdateProfileError && !isUpdateProfileSuccess && ( // Show only if not also success (e.g. optimistic update failed)
        <AlertMessage type="error" title="Opslaan Mislukt" message={typedUpdateProfileError.userMessage} className="mb-4" />
      )}
      {/* Success messages are now handled by global notifications */}
      {/* Avatar specific errors/success are now handled by global notifications */}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-4 relative">
            <div className="h-24 w-24 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profielfoto" className="h-full w-full object-cover" />
              ) : (
                <svg className="h-12 w-12 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
            </div>
            <label 
              htmlFor="avatar-upload" 
              className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center cursor-pointer text-white shadow-md hover:bg-purple-700"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <input 
                id="avatar-upload" type="file" accept="image/*" className="hidden"
                onChange={handleAvatarUpload} disabled={uploadingAvatar}
              />
            </label>
          </div>
          {uploadingAvatar && <p className="text-sm text-gray-500 animate-pulse">Profielfoto uploaden...</p>}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label htmlFor="voornaam" className="block text-sm font-medium text-gray-700 mb-1">Voornaam</label>
            <input id="voornaam" name="voornaam" type="text" value={formData.voornaam} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500" required />
          </div>
          <div>
            <label htmlFor="achternaam" className="block text-sm font-medium text-gray-700 mb-1">Achternaam</label>
            <input id="achternaam" name="achternaam" type="text" value={formData.achternaam} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500" required />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label htmlFor="postcode" className="block text-sm font-medium text-gray-700 mb-1">Postcode</label>
            <input id="postcode" name="postcode" type="text" value={formData.postcode} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
          <div>
            <label htmlFor="gemeente" className="block text-sm font-medium text-gray-700 mb-1">Gemeente</label>
            <input id="gemeente" name="gemeente" type="text" value={formData.gemeente} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
        </div>
        
        <div className="mb-6">
          <label htmlFor="geboortedatum" className="block text-sm font-medium text-gray-700 mb-1">Geboortedatum</label>
          <input id="geboortedatum" name="geboortedatum" type="date" value={formData.geboortedatum} onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500" />
        </div>
        
        {/* Account type is generally not editable by user after creation */}
        {profileData?.type && (
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Account type</label>
                <input type="text" value={profileData.type.charAt(0).toUpperCase() + profileData.type.slice(1)} readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 focus:outline-none" />
            </div>
        )}
        
        <div className="flex justify-end space-x-3">
          <button type="button" onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={isUpdatingProfile || uploadingAvatar}>
            Annuleren
          </button>
          <button type="submit" disabled={isUpdatingProfile || uploadingAvatar}
            className={`px-4 py-2 rounded-md text-white font-medium transition-colors ${
              (isUpdatingProfile || uploadingAvatar) ? 'bg-purple-300 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'
            }`}>
            {(isUpdatingProfile || uploadingAvatar) ? 'Bezig met opslaan...' : 'Profiel Opslaan'}
          </button>
        </div>
      </form>
    </div>
  );
}
