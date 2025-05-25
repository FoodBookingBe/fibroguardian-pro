
'use client';

// Fix voor ontbrekende property 'addNotification' op Element type
declare module "react" {
  interface Element {
    addNotification?: unknown;
  }
}
import { _useAuth as useAuth } from '@/components/auth/AuthProvider';
import { AlertMessage } from '@/components/common/AlertMessage';
import ProfileFormPresentational, { ProfileFormData } from '@/components/settings/ProfileFormPresentational';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { useNotification } from '@/context/NotificationContext';
import { useUpdateProfile } from '@/hooks/useMutations';
import { useProfile } from '@/hooks/useSupabaseQuery';
import { ErrorMessage } from '@/lib/error-handler';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';
import { Profile } from '@/types';
import { useRouter } from 'next/navigation';
import React, { FormEvent, useEffect, useState } from 'react';

// Helper to initialize form state from Profile data
const profileToFormState = (profile?: Profile | null): ProfileFormData => {
  return {
    voornaam: profile?.voornaam || '',
    achternaam: profile?.achternaam || '',
    postcode: profile?.postcode || '',
    gemeente: profile?.gemeente || '',
    geboortedatum: profile?.geboortedatum ? (new Date(profile.geboortedatum).toISOString().split('T')[0]) : '',
  };
};

export default function ProfileFormContainer(): JSX.Element {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id;

  const {
    data: profileData,
    isLoading: isLoadingProfile,
    error: fetchProfileError,
    isError: isFetchProfileError
  } = useProfile(userId, { enabled: !!userId });

  const [formData, setFormData] = useState<ProfileFormData>(profileToFormState(profileData as any));
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profileData?.avatar_url || null);
  const [uploadingAvatar, setUploadingAvatar] = useState<boolean>(false);
  const { addNotification } = useNotification();

  useEffect(() => {
    if (profileData) {
      setFormData(profileToFormState(profileData as any));
      setAvatarUrl(profileData.avatar_url || null);
    }
  }, [profileData]);

  const {
    mutate: updateProfile,
    isPending: isUpdatingProfile,
    error: updateProfileHookError,
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
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    setUploadingAvatar(true);
    const supabaseClient = getSupabaseBrowserClient();

    try {
      const { error: uploadError } = await supabaseClient.storage
        .from('profiles')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabaseClient.storage
        .from('profiles')
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error('Kon geen publieke URL krijgen voor de profielfoto.');
      }

      setAvatarUrl(urlData.publicUrl);

      updateProfile({ id: user.id, data: { avatar_url: urlData.publicUrl } }, {
        onSuccess: () => {
          addNotification({ type: 'success', message: 'Profielfoto succesvol bijgewerkt.' });
        },
        onError: (err: unknown) => {
          addNotification({ type: 'error', message: (err as ErrorMessage).userMessage || 'Fout bij opslaan avatar URL.' });
        }
      });

    } catch (error: unknown) {
      console.error('Error uploading avatar:', error);
      addNotification({ type: 'error', message: (error as any).message || 'Fout bij uploaden van profielfoto.' });
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user?.id) return;

    const profileUpdateData: Partial<Profile> = {
      ...formData,
      geboortedatum: formData.geboortedatum ? new Date(formData.geboortedatum) : undefined,
    };

    updateProfile({ id: user.id, data: profileUpdateData }, {
      onSuccess: () => {
        addNotification({ type: 'success', message: 'Profiel succesvol bijgewerkt!' });
      },
      onError: (err: unknown) => {
        addNotification({ type: 'error', message: (err as ErrorMessage).userMessage || 'Fout bij opslaan profiel.' });
      }
    });
  };

  const handleCancel = () => {
    router.back();
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

  return (
    <ProfileFormPresentational
      formData={formData}
      avatarUrl={avatarUrl}
      uploadingAvatar={uploadingAvatar}
      isUpdatingProfile={isUpdatingProfile}
      profileType={profileData?.type}
      updateProfileError={updateProfileHookError as ErrorMessage | null}
      isUpdateProfileError={isUpdateProfileError}
      isUpdateProfileSuccess={isUpdateProfileSuccess}
      onFormChange={handleChange}
      onAvatarUpload={handleAvatarUpload}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  );
}
