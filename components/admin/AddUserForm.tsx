'use client';

import { Abonnement, Profile } from '@/types';
import React, { useState } from 'react';

// Define a type for the form data
// Omit Date types from Profile that will be handled as strings in the form
type AddUserFormData = Omit<Partial<Profile>, 'id' | 'avatar_url' | 'geboortedatum' | 'created_at' | 'updated_at'> & {
  email?: string;
  password?: string;
  geboortedatum?: string; // Keep as string for form input 'YYYY-MM-DD'
  plan_type?: Abonnement['plan_type'];
  max_patienten?: number; // Ensure this matches Abonnement type if it's number
};

interface AddUserFormProps {
  onClose: () => void;
  onUserAdded: (newUser: Profile) => void; // Callback after user is successfully added
}

const AddUserForm: React.FC<AddUserFormProps> = ({ onClose, onUserAdded: _onUserAdded }) => {
  const [formData, setFormData] = useState<AddUserFormData>({
    type: 'patient', // Default role
    voornaam: '',
    achternaam: '',
    email: '',
    password: '',
    postcode: '',
    gemeente: '',
    geboortedatum: '', // Initialized as string, input type="date" expects 'YYYY-MM-DD'
    plan_type: 'basis', // Default plan for specialists
    max_patienten: 0, // Default max_patienten
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: AddUserFormData) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Basic validation
    if (!formData.email || !formData.password || !formData.voornaam || !formData.achternaam || !formData.type) {
      setError('Email, wachtwoord, voornaam, achternaam en type zijn verplicht.');
      setIsLoading(false);
      return;
    }

    try {
      // TODO: Implement actual user creation logic here
      // This would typically involve:
      // 1. Creating a user in Supabase Auth
      // 2. Creating a profile record in the profiles table
      // 3. Handling any errors appropriately

      console.log('Creating user with data:', formData);

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // For now, just close the form
      onClose();
    } catch (error) {
      setError((error as any).message || 'Er is een fout opgetreden bij het aanmaken van de gebruiker.');
      console.error("Error creating user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const inputClassName = "mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-100";
  const labelClassName = "block text-sm font-medium text-gray-700 dark:text-gray-300";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div>
        <label htmlFor="email" className={labelClassName}>Email *</label>
        <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} className={inputClassName} required />
      </div>
      <div>
        <label htmlFor="password" className={labelClassName}>Wachtwoord *</label>
        <input type="password" name="password" id="password" value={formData.password} onChange={handleChange} className={inputClassName} required />
      </div>
      <div>
        <label htmlFor="voornaam" className={labelClassName}>Voornaam *</label>
        <input type="text" name="voornaam" id="voornaam" value={formData.voornaam} onChange={handleChange} className={inputClassName} required />
      </div>
      <div>
        <label htmlFor="achternaam" className={labelClassName}>Achternaam *</label>
        <input type="text" name="achternaam" id="achternaam" value={formData.achternaam} onChange={handleChange} className={inputClassName} required />
      </div>
      <div>
        <label htmlFor="type" className={labelClassName}>Type Gebruiker *</label>
        <select name="type" id="type" value={formData.type} onChange={handleChange} className={inputClassName} required>
          <option value="patient">Patiënt</option>
          <option value="specialist">Specialist</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <div>
        <label htmlFor="geboortedatum" className={labelClassName}>Geboortedatum</label>
        <input type="date" name="geboortedatum" id="geboortedatum" value={formData.geboortedatum} onChange={handleChange} className={inputClassName} />
      </div>
      <div>
        <label htmlFor="postcode" className={labelClassName}>Postcode</label>
        <input type="text" name="postcode" id="postcode" value={formData.postcode} onChange={handleChange} className={inputClassName} />
      </div>
      <div>
        <label htmlFor="gemeente" className={labelClassName}>Gemeente</label>
        <input type="text" name="gemeente" id="gemeente" value={formData.gemeente} onChange={handleChange} className={inputClassName} />
      </div>

      {formData.type === 'specialist' && (
        <>
          <hr className="my-6 border-gray-300 dark:border-gray-600" />
          <h3 className="text-md font-semibold mb-2 text-gray-800 dark:text-white">Specialist Details</h3>
          <div>
            <label htmlFor="plan_type" className={labelClassName}>Abonnement Type</label>
            <select name="plan_type" id="plan_type" value={formData.plan_type} onChange={handleChange} className={inputClassName}>
              <option value="basis">Basis</option>
              <option value="premium">Premium</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <div>
            <label htmlFor="max_patienten" className={labelClassName}>Max. Patiënten</label>
            <input type="number" name="max_patienten" id="max_patienten" value={formData.max_patienten || 0} onChange={handleChange} className={inputClassName} min="0" />
          </div>
        </>
      )}

      <div className="mt-6 flex justify-end space-x-3">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 focus:outline-none disabled:opacity-50"
        >
          Annuleren
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none disabled:opacity-50"
        >
          {isLoading ? 'Opslaan...' : 'Opslaan'}
        </button>
      </div>
    </form>
  );
};

export default AddUserForm;
