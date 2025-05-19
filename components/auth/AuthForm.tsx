'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
// import { getSupabaseBrowserClient } from '@/lib/supabase'; // Will be used by hooks
import { useSignInEmailPassword, useSignUpWithEmailPassword } from '@/hooks/useMutations'; // Import new hooks
import { validateEmail, validatePassword } from '@/utils/validation';
import { useNotification } from '@/context/NotificationContext';

export default function AuthForm({ initialIsLogin }: { initialIsLogin?: boolean }) {
  const router = useRouter(); // Keep for navigation toggle
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [voornaam, setVoornaam] = useState<string>('');
  const [achternaam, setAchternaam] = useState<string>('');
  const [userType, setUserType] = useState<string>('patient'); // Default to patient
  // const [loading, setLoading] = useState<boolean>(false); // Will use isPending from hooks
  const [isLogin] = useState<boolean>(initialIsLogin ?? true);
  const [errors, setErrors] = useState<{ email?: string; password?: string; voornaam?: string; achternaam?: string; userType?: string; }>({});
  const { addNotification } = useNotification();

  const { mutate: signIn, isPending: isSigningIn } = useSignInEmailPassword(); // Removed signInErrorHook
  const { mutate: signUp, isPending: isSigningUp } = useSignUpWithEmailPassword(); // Removed signUpErrorHook

  const loading = isSigningIn || isSigningUp;
 
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
    
    // Valideer formulier voor submission
    if (!validateForm()) {
      return;
    }
    // setLoading(true); // Handled by isPending from hooks
 
    if (isLogin) {
      signIn({ email, password }, {
        onSuccess: (user) => {
          // Check if user object is valid (Supabase might return user even if session setup fails in some edge cases)
          if (user && user.id) {
            addNotification({ type: 'success', message: 'Succesvol ingelogd! U wordt doorverwezen...' });
            // AuthProvider handles redirect based on auth state change
          } else {
            // This case should ideally be caught by onError if data.user is null from the hook's perspective
            addNotification({ type: 'error', message: 'Inloggen mislukt, ongeldige gebruikersdata ontvangen.' });
          }
        },
        onError: (error) => {
          addNotification({ type: 'error', message: error.userMessage || 'Fout bij inloggen.' });
        }
      });
    } else {
      signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            voornaam: voornaam.trim(),
            achternaam: achternaam.trim(),
            type: userType as 'patient' | 'specialist', // Ensure type safety
          }
        }
      }, {
        onSuccess: (data) => {
          if (data.user) { // User object exists, email likely sent
            addNotification({ type: 'success', message: 'Registratie succesvol! Controleer uw e-mail voor de bevestigingslink.' });
          } else { // User is null, but no immediate error from Supabase (e.g. email already in use but confirmation not sent)
             addNotification({ type: 'info', message: 'Verzoek tot registratie ontvangen. Als u al een account heeft, probeer in te loggen. Anders, controleer uw e-mail.' });
          }
        },
        onError: (error) => {
          addNotification({ type: 'error', message: error.userMessage || 'Fout bij registratie.' });
        }
      });
    }
    // setLoading(false); // Handled by isPending from hooks
  };

  return (
    <section className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-xl">
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
            autoComplete={isLogin ? "current-password" : "new-password"}
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
