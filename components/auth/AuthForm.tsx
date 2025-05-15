'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation'; // Added useRouter
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { validateEmail, validatePassword } from '@/utils/validation';

export default function AuthForm({ initialIsLogin }: { initialIsLogin?: boolean }) { // Accept initialIsLogin prop
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [voornaam, setVoornaam] = useState<string>('');
  const [achternaam, setAchternaam] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isLogin, setIsLogin] = useState<boolean>(initialIsLogin ?? true); // Use prop for initial state
  const [message, setMessage] = useState<string>('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; voornaam?: string; achternaam?: string; }>({});

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
    
    setLoading(true);
    setMessage('');

    try {
      if (isLogin) {
        console.log('Login attempt starting with email:', email); // Add logging
        const supabase = getSupabaseBrowserClient();
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        console.log('Login result:', {
          success: !!signInData?.user,
          error: signInError ? signInError.message : null,
          session: !!signInData?.session
        });

        if (signInError) {
          setMessage(`Fout bij inloggen: ${signInError.message}`);
        } else if (signInData?.user) {
          setMessage('Succesvol ingelogd! Even geduld...');
          console.log('Login successful, redirecting to dashboard');
          
          // Force a hard navigation instead of client-side navigation
          window.location.href = '/dashboard';
          // Alternative: router.push('/dashboard')
        } else {
          setMessage('Onbekende fout bij inloggen. Probeer het opnieuw.');
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
              // type: 'patient' // Default type, can be set here or by a trigger
            }
          }
        });
        if (signUpError) { // Check signUpError specifically
          console.error('AuthForm: SignUp failed with error object:', signUpError); // DEBUG LINE
          setMessage(`Fout bij registratie: ${signUpError.message}`);
        } else {
          // Note: After signUp, Supabase sends a confirmation email.
          // The user object in signUpData.user will exist but session might be null until email is confirmed.
          // The profile creation from options.data usually happens via a DB trigger on auth.users insert.
          setMessage('Controleer uw e-mail voor de bevestigingslink.');
        }
      }
    } catch (error: any) { // This catch is for unexpected errors, not for Supabase auth errors handled above.
      console.error('AuthForm: Unexpected error in handleSubmit:', error); // DEBUG LINE
      setMessage(`Onverwachte fout: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="auth-form" className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-semibold mb-6 text-center text-purple-800">
        {isLogin ? 'Inloggen' : 'Registreren'} bij FibroGuardian Pro
      </h2>

      {message && (
        <div className={`mb-4 p-3 rounded-md ${message.startsWith('Fout:') ? 'bg-red-50 text-red-800' : 'bg-blue-50 text-blue-800'}`}>
          {message}
        </div>
      )}

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
          // It's good practice to also clear messages/errors if navigation is successful,
          // but the component will unmount/remount or re-initialize on page navigation,
          // so explicit clearing here might not be strictly necessary if initialIsLogin handles it.
          // However, to be safe and handle potential SPA-like transitions if Next.js optimizes:
          setMessage('');
          setErrors({});
        }}
        className="mt-4 w-full text-center text-sm text-purple-600 hover:text-purple-800"
      >
        {isLogin ? 'Nog geen account? Registreer hier' : 'Al een account? Log hier in'}
      </button>
    </section>
  );
}
