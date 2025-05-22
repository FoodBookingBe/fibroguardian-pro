import React from 'react';

'use client';
import { FormEvent } from 'react';

// Define types for props, mirroring those in AuthFormContainer
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

interface AuthFormPresentationalProps {
  isLogin: boolean;
  formData: AuthFormData;
  errors: AuthFormErrors;
  loading: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUserTypeChange: (userType: 'patient' | 'specialist') => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onToggleMode: () => void;
}

export default function AuthFormPresentational({
  isLogin,
  formData,
  errors,
  loading,
  onChange,
  onUserTypeChange,
  onSubmit,
  onToggleMode,
}: AuthFormPresentationalProps): JSX.Element {
  return (
    <section className="mx-auto mt-10 max-w-md rounded-lg bg-white p-6 shadow-xl">
      <h2 className="mb-6 text-center text-2xl font-semibold text-purple-800">
        {isLogin ? 'Inloggen' : 'Registreren'} bij FibroGuardian Pro
      </h2>
      
      <>
        <form onSubmit={onSubmit} className="space-y-4">
        {!isLogin && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="voornaam" className="form-label">Voornaam</label>
                <input id="voornaam" name="voornaam" type="text" autoComplete="given-name" value={formData.voornaam || ''} onChange={onChange} className={`form-input ${errors.voornaam ? 'border-red-500' : 'border-gray-300'}`} required={!isLogin} />
                {errors.voornaam && <p className="form-error">{errors.voornaam}</p>}
              </div>
              <div>
                <label htmlFor="achternaam" className="form-label">Achternaam</label>
                <input id="achternaam" name="achternaam" type="text" autoComplete="family-name" value={formData.achternaam || ''} onChange={onChange} className={`form-input ${errors.achternaam ? 'border-red-500' : 'border-gray-300'}`} required={!isLogin} />
                {errors.achternaam && <p className="form-error">{errors.achternaam}</p>}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="postcode" className="form-label">Postcode</label>
                <input id="postcode" name="postcode" type="text" autoComplete="postal-code" value={formData.postcode || ''} onChange={onChange} className={`form-input ${errors.postcode ? 'border-red-500' : 'border-gray-300'}`} required={!isLogin} />
                {errors.postcode && <p className="form-error">{errors.postcode}</p>}
              </div>
              <div>
                <label htmlFor="gemeente" className="form-label">Gemeente</label>
                <input id="gemeente" name="gemeente" type="text" autoComplete="address-level2" value={formData.gemeente || ''} onChange={onChange} className={`form-input ${errors.gemeente ? 'border-red-500' : 'border-gray-300'}`} required={!isLogin} />
                {errors.gemeente && <p className="form-error">{errors.gemeente}</p>}
              </div>
            </div>
            <div className="mt-4">
              <label htmlFor="geboortedatum" className="form-label">Geboortedatum</label>
              <input id="geboortedatum" name="geboortedatum" type="date" autoComplete="bday" value={formData.geboortedatum || ''} onChange={onChange} className={`form-input ${errors.geboortedatum ? 'border-red-500' : 'border-gray-300'}`} required={!isLogin} />
              {errors.geboortedatum && <p className="form-error">{errors.geboortedatum}</p>}
            </div>
            
            <fieldset className="mt-4">
              <legend className="form-label">Registreren als</legend>
              <div className="mt-2 flex space-x-4">
                <label className="flex items-center">
                  <input type="radio" name="userType" value="patient" checked={formData.userType === 'patient'} onChange={() => onUserTypeChange('patient')} className="mr-2" />
                  <span>Patiënt</span>
                </label>
                <label className="flex items-center">
                  <input type="radio" name="userType" value="specialist" checked={formData.userType === 'specialist'} onChange={() => onUserTypeChange('specialist')} className="mr-2" />
                  <span>Specialist</span>
                </label>
              </div>
              {errors.userType && <p className="form-error">{errors.userType}</p>}
            </fieldset>
          </>
        )}
        <div className="mt-4">
          <label htmlFor="email" className="form-label">E-mailadres</label>
          <input id="email" name="email" type="email" autoComplete="email" value={formData.email} onChange={onChange} className={`form-input ${errors.email ? 'border-red-500' : 'border-gray-300'}`} required />
          {errors.email && <p id="email-error" className="form-error">{errors.email}</p>}
        </div>

        <div className="mt-4">
          <label htmlFor="password" className="form-label">Wachtwoord</label>
          <input id="password" name="password" type="password" {...(isLogin ? { autoComplete: "current-password" } : {})} value={formData.password} onChange={onChange} className={`form-input ${errors.password ? 'border-red-500' : 'border-gray-300'}`} required />
          {errors.password && <p id="password-error" className="form-error">{errors.password}</p>}
        </div>

        <button type="submit" disabled={loading} className={`mt-4 w-full rounded-md px-4 py-2 font-medium text-white transition-colors ${loading ? 'cursor-not-allowed bg-purple-300' : 'bg-purple-600 hover:bg-purple-700'}`}>
          {loading ? 'Bezig...' : isLogin ? 'Inloggen' : 'Registreren'}
        </button>
      </form>

      <button onClick={onToggleMode}
        className="mt-6 w-full text-center text-sm text-purple-600 hover:text-purple-800">
        {isLogin ? 'Nog geen account? Registreer hier' : 'Al een account? Log hier in'}
      </button>
      </>
    </section>
  );
}
