'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { validateEmail, validatePassword } from '@/utils/validation';
import { AlertMessage } from '@/components/common/AlertMessage';
import { useNotification } from '@/context/NotificationContext'; // Import useNotification

export default function AuthForm({ initialIsLogin }: { initialIsLogin?: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [voornaam, setVoornaam] = useState<string>('');
  const [achternaam, setAchternaam] = useState<string>('');
  const [userType, setUserType] = useState<string>('patient'); // Default to patient
  const [loading, setLoading] = useState<boolean>(false);
  const [isLogin, setIsLogin] = useState<boolean>(initialIsLogin ?? true);
  // const [message, setMessage] = useState<string>(''); // Replaced by global notifications for success/error
  const [errors, setErrors] = useState<{ email?: string; password?: string; voornaam?: string; achternaam?: string; userType?: string; }>({});
  const { addNotification } = useNotification();

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string; voornaam?: string; achternaam?: string; } = {};
    
    // Valideer e-mail
    if (!validateEmail(email)) {
      newErrors.email = 'Vul een geldig e-mailadres in.';
    }
    
    // Valideer wachtwoord
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      newErrors.password = passwordValidation.message;
    } else {
      // Extra password complexity checks as suggested by user
      if (password.length < 8) {
        newErrors.password = 'Wachtwoord moet minimaal 8 tekens bevatten.';
      } else if (!/[A-Z]/.test(password)) {
        newErrors.password = 'Wachtwoord moet minstens één hoofdletter bevatten.';
      } else if (!/[0-9]/.test(password)) {
        newErrors.password = 'Wachtwoord moet minstens één cijfer bevatten.';
      }
    }

    // Valideer voornaam en achternaam alleen bij registratie
    if (!isLogin) {
      if (!voornaam.trim()) {
        newErrors.voornaam = 'Voornaam is verplicht.';
      }
      if (!achternaam.trim()) {
        newErrors.achternaam = 'Achternaam is verplicht.';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Form submitted, validation passed:", validateForm());
    
    // Valideer formulier voor submission
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    // setMessage(''); // Clear local message if it were used

    try {
      if (isLogin) {
        // console.log('Login attempt starting with email:', email); // Keep for debugging if needed
        const supabase = getSupabaseBrowserClient();
        
        // Inloggen
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        console.log('Login response:', {
          user: !!signInData?.user,
          session: !!signInData?.session,
          error: signInError ? signInError.message : null
        });

        if (signInError) {
          addNotification('error', `Fout bij inloggen: ${signInError.message}`);
        } else if (signInData?.user) {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData.session) {
            addNotification('success', 'Succesvol ingelogd! U wordt doorverwezen...');
            // AuthProvider handles redirect
          } else {
            addNotification('warning', 'Inloggen gelukt, maar sessie kon niet worden opgezet. Probeer het opnieuw.');
          }
        } else {
          addNotification('error', 'Onbekende fout bij inloggen. Probeer het opnieuw.');
        }
      } else {
        // Registratie
        const supabase = getSupabaseBrowserClient();
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              voornaam: voornaam.trim(),
              achternaam: achternaam.trim(),
              type: userType // Set the user type based on selection
            }
          }
        });
        if (signUpError) { 
          console.error('AuthForm: SignUp failed with error object:', signUpError);
          addNotification('error', `Fout bij registratie: ${signUpError.message}`);
        } else {
          addNotification('success', 'Registratie succesvol! Controleer uw e-mail voor de bevestigingslink.');
        }
      }
    } catch (error: any) { 
      console.error('AuthForm: Unexpected error in handleSubmit:', error);
      addNotification('error', `Onverwachte fout: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="auth-form" className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-semibold mb-6 text-center text-purple-800">
        {isLogin ? 'Inloggen' : 'Registreren'} bij FibroGuardian Pro
      </h2>

      {/* Global notifications will handle async operation success/errors.
          Local form validation errors (from `errors` state) are displayed below each field.
          The AlertMessage that previously showed `message` state can be removed. 
      */}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="voornaam" className="form-label">Voornaam</label>
                <input
                  id="voornaam"
                  name="voornaam"
                  type="text"
                  autoComplete="given-name"
                  value={voornaam}
                  onChange={(e) => setVoornaam(e.target.value)}
                  className={`form-input ${errors.voornaam ? 'border-red-500' : 'border-gray-300'}`}
                  required={!isLogin}
                />
                {errors.voornaam && <p className="form-error">{errors.voornaam}</p>}
              </div>
              <div>
                <label htmlFor="achternaam" className="form-label">Achternaam</label>
                <input
                  id="achternaam"
                  name="achternaam"
                  type="text"
                  autoComplete="family-name"
                  value={achternaam}
                  onChange={(e) => setAchternaam(e.target.value)}
                  className={`form-input ${errors.achternaam ? 'border-red-500' : 'border-gray-300'}`}
                  required={!isLogin}
                />
                {errors.achternaam && <p className="form-error">{errors.achternaam}</p>}
              </div>
            </div>
            
            <div className="mt-4">
              <label className="form-label">Registreren als</label>
              <div className="flex space-x-4 mt-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="userType"
                    value="patient"
                    checked={userType === 'patient'}
                    onChange={() => setUserType('patient')}
                    className="mr-2"
                  />
                  <span>Patiënt</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="userType"
                    value="specialist"
                    checked={userType === 'specialist'}
                    onChange={() => setUserType('specialist')}
                    className="mr-2"
                  />
                  <span>Specialist</span>
                </label>
              </div>
              {errors.userType && <p className="form-error">{errors.userType}</p>}
            </div>
          </>
        )}
        <div>
          <label htmlFor="email" className="form-label">E-mailadres</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`form-input ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
            required
            {...(errors.email && { 'aria-invalid': 'true' })}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          {errors.email && <p id="email-error" className="form-error">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="password" className="form-label">Wachtwoord</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={isLogin ? "current-password" : "new-password section-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`form-input ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
            required
            {...(errors.password && { 'aria-invalid': 'true' })}
            aria-describedby={errors.password ? "password-error" : undefined}
          />
          {errors.password && <p id="password-error" className="form-error">{errors.password}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 px-4 rounded-md text-white font-medium transition-colors ${
            loading ? 'bg-purple-300 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'
          }`}
        >
          {loading ? 'Bezig...' : isLogin ? 'Inloggen' : 'Registreren'}
        </button>
      </form>

      <button
        onClick={() => {
          if (isLogin) {
            router.push('/auth/register');
          } else {
            router.push('/auth/login');
          }
          // It's good practice to also clear messages/errors if navigation is successful.
          // Global notifications clear themselves. Local form errors should be cleared.
          setErrors({});
          // setMessage(''); // setMessage is removed
        }}
        className="mt-4 w-full text-center text-sm text-purple-600 hover:text-purple-800"
      >
        {isLogin ? 'Nog geen account? Registreer hier' : 'Al een account? Log hier in'}
      </button>
    </section>
  );
}
