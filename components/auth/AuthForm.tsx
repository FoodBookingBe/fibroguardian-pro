'use client';
import { useState, FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { validateEmail, validatePassword } from '@/utils/validation'; // Assuming this will be created

export default function AuthForm() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [message, setMessage] = useState<string>('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};
    
    // Valideer e-mail
    if (!validateEmail(email)) {
      newErrors.email = 'Vul een geldig e-mailadres in';
    }
    
    // Valideer wachtwoord
    if (password.length > 0) {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        newErrors.password = passwordValidation.message;
      }
    } else {
      newErrors.password = 'Wachtwoord is verplicht';
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
        // Redirect or further action on successful login will likely be handled by AuthProvider or a redirect in a page
      } else {
        // Registratie
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            // Ensure window is defined (client-side) before accessing window.location.origin
            emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : ''
          }
        });
        if (error) throw error;
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

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            E-mailadres
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            required
            aria-invalid={String(!!errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          {errors.email && (
            <p id="email-error" className="mt-1 text-sm text-red-500">{errors.email}</p>
          )}
        </div>

        <div className="mb-6">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Wachtwoord
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
              errors.password ? 'border-red-500' : 'border-gray-300'
            }`}
            required
            aria-invalid={String(!!errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
          />
          {errors.password && (
            <p id="password-error" className="mt-1 text-sm text-red-500">{errors.password}</p>
          )}
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