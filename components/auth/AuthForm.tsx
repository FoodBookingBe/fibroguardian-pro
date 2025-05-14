'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation'; // Added useRouter
import { supabase } from '@/lib/supabase';
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
        // Login
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        setMessage('Succesvol ingelogd! Even geduld...');
        // Redirect will be handled by AuthProvider now
        // router.push('/dashboard');
      } else {
        // Registratie
        const { data: signUpData, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '',
            data: {
              voornaam: voornaam.trim(),
              achternaam: achternaam.trim(),
              // type: 'patient' // Default type, can be set here or by a trigger
            }
          }
        });
        if (error) throw error;
        // Note: After signUp, Supabase sends a confirmation email.
        // The user object in signUpData.user will exist but session might be null until email is confirmed.
        // The profile creation from options.data usually happens via a DB trigger on auth.users insert.
        setMessage('Controleer uw e-mail voor de bevestigingslink.');
      }
    } catch (error: any) {
      setMessage(`Fout: ${error.message}`);
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
            aria-invalid={!!errors.email}
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
            aria-invalid={!!errors.password}
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
          setIsLogin(!isLogin);
          setMessage(''); // Clear message on mode switch
          setErrors({}); // Clear errors on mode switch
        }}
        className="mt-4 w-full text-center text-sm text-purple-600 hover:text-purple-800"
      >
        {isLogin ? 'Nog geen account? Registreer hier' : 'Al een account? Log hier in'}
      </button>
    </section>
  );
}