import React from 'react';

'use client';
import { useState, FormEvent } from 'react';

import { useRouter } from 'next/navigation';

import AuthFormPresentational from '@/components/auth/AuthForm'; // Assuming the path
import { useNotification } from '@/context/NotificationContext';
import { useSignInEmailPassword, useSignUpWithEmailPassword } from '@/hooks/useMutations';
import { ErrorMessage } from '@/lib/error-handler';
import { validateEmail, validatePassword } from '@/utils/validation';

// Define types for form data and errors
interface AuthFormData {
  email: string;
  password: string;
  voornaam?: string;
  achternaam?: string;
  postcode?: string;
  gemeente?: string;
  geboortedatum?: string;
  userType?: 'patient' | 'specialist';
}

interface AuthFormErrors {
  email?: string;
  password?: string;
  voornaam?: string;
  achternaam?: string;
  userType?: string;
  postcode?: string;
  gemeente?: string;
  geboortedatum?: string;
  general?: string;
}

export default function AuthFormContainer({ initialIsLoginMode = true }: { initialIsLoginMode?: boolean }): JSX.Element {
  const router = useRouter();
  const { addNotification } = useNotification();

  const [isLogin, setIsLogin] = useState<boolean>(initialIsLoginMode);
  const [formData, setFormData] = useState<AuthFormData>({
    email: '',
    password: '',
    voornaam: '',
    achternaam: '',
    postcode: '',
    gemeente: '',
    geboortedatum: '',
    userType: 'patient',
  });
  const [errors, setErrors] = useState<AuthFormErrors>({});

  const { mutate: signIn, isPending: isSigningIn } = useSignInEmailPassword();
  const { mutate: signUp, isPending: isSigningUp } = useSignUpWithEmailPassword();

  const loading = isSigningIn || isSigningUp;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUserTypeChange = (newUserType: 'patient' | 'specialist') => {
    setFormData(prev => ({ ...prev, userType: newUserType }));
  };

  const validateForm = (): boolean => {
    const newErrors: AuthFormErrors = {};
    if (!validateEmail(formData.email)) {
      newErrors.email = 'Vul een geldig e-mailadres in.';
    }
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.valid) {
      newErrors.password = passwordValidation.message;
    }
    if (!isLogin) {
      if (!formData.voornaam?.trim()) newErrors.voornaam = 'Voornaam is verplicht.';
      if (!formData.achternaam?.trim()) newErrors.achternaam = 'Achternaam is verplicht.';
      if (!formData.postcode?.trim()) newErrors.postcode = 'Postcode is verplicht.';
      if (!formData.gemeente?.trim()) newErrors.gemeente = 'Gemeente is verplicht.';
      if (!formData.geboortedatum) newErrors.geboortedatum = 'Geboortedatum is verplicht.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (isLogin) {
      signIn({ email: formData.email, password: formData.password }, {
        onSuccess: (user) => {
          if (user && user.id) {
            addNotification({ type: 'success', message: 'Succesvol ingelogd! U wordt doorverwezen...' });
            // router.push('/dashboard'); // Or appropriate redirect
          } else {
            addNotification({ type: 'error', message: 'Inloggen mislukt, ongeldige gebruikersdata ontvangen.' });
          }
        },
        onError: (error: ErrorMessage) => {
          addNotification({ type: 'error', message: error.userMessage || 'Fout bij inloggen.' });
        }
      });
    } else {
      signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            voornaam: formData.voornaam!.trim(),
            achternaam: formData.achternaam!.trim(),
            postcode: formData.postcode!.trim(),
            gemeente: formData.gemeente!.trim(),
            geboortedatum: formData.geboortedatum!,
            type: formData.userType!,
          }
        }
      }, {
        onSuccess: (data) => {
          if (data.user) {
            addNotification({ type: 'success', message: 'Registratie succesvol! Controleer uw e-mail voor de bevestigingslink.' });
          } else {
            addNotification({ type: 'info', message: 'Verzoek tot registratie ontvangen. Als u al een account heeft, probeer in te loggen. Anders, controleer uw e-mail.' });
          }
        },
        onError: (error: ErrorMessage) => {
          addNotification({ type: 'error', message: error.userMessage || 'Fout bij registratie.' });
        }
      });
    }
  };

  const handleToggleMode = () => {
    setIsLogin(!isLogin);
    setErrors({});
    // Navigate to the other form type's page
    if (isLogin) {
      router.push('/auth/register');
    } else {
      router.push('/auth/login');
    }
  };

  return (
    <AuthFormPresentational
      isLogin={isLogin}
      formData={formData}
      errors={errors}
      loading={loading}
      onChange={handleChange}
      onUserTypeChange={handleUserTypeChange}
      onSubmit={handleSubmit}
      onToggleMode={handleToggleMode}
    />
  );
}
