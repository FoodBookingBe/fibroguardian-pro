'use client';

import React, { useState, useEffect } from 'react';
import { Profile, Abonnement } from '@/types';

// Define a type for the form data, similar to AddUserFormData
// Omitting id, created_at, updated_at, avatar_url as they are not directly edited here
// Email might be non-editable or handled specially. Password change is also special.
type EditUserFormData = Omit<Partial<Profile>, 'id' | 'avatar_url' | 'created_at' | 'updated_at' | 'geboortedatum'> & {
  email?: string; // Usually non-editable or shown for reference
  // Password change is typically a separate flow for existing users
  // For admin edits, we might allow setting a new password directly.
  new_password?: string; 
  geboortedatum?: string; // Keep as string for form input 'YYYY-MM-DD'
  plan_type?: Abonnement['plan_type'];
  max_patienten?: number;
};

interface EditUserFormProps {
  user: Profile; // The user being edited
  onClose: () => void;
  onUserUpdated: (updatedUser: Profile) => void; // Callback after user is successfully updated
}

const EditUserForm: React.FC<EditUserFormProps> = ({ user, onClose, onUserUpdated }) => {
  const [formData, setFormData] = useState<EditUserFormData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      // Pre-fill form data from the user prop
      // Note: Email is typically from auth user, not profile. For now, assume it might be on profile or leave blank.
      // Password is not pre-filled.
      setFormData({
        voornaam: user.voornaam || '',
        achternaam: user.achternaam || '',
        type: user.type,
        postcode: user.postcode || '',
        gemeente: user.gemeente || '',
        geboortedatum: user.geboortedatum ? new Date(user.geboortedatum).toISOString().split('T')[0] : '',
        // TODO: Fetch and pre-fill specialist details (plan_type, max_patienten) if applicable
        // This would require fetching from 'abonnementen' table based on user.id
        plan_type: 'basis', // Placeholder
        max_patienten: 0,   // Placeholder
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Basic validation
    if (!formData.voornaam || !formData.achternaam || !formData.type) {
      setError('Voornaam, achternaam en type zijn verplicht.');
      setIsLoading(false);
      return;
    }

    try {
      // TODO: Implement API call to update user in 'profiles' table and potentially Supabase Auth (e.g., password)
      // This will involve:
      // 1. Calling a server action or API route.
      //    - Update 'profiles' table with user.id.
      //    - If formData.new_password is set, call supabase.auth.admin.updateUserById(user.id, { password: formData.new_password })
      //    - If type is 'specialist', update or insert into 'abonnementen' table.

      console.log('Form data to submit for update:', { userId: user.id, ...formData });
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000)); 
      
      const updatedUser: Profile = {
        ...user, // Spread existing user data
        ...formData, // Spread form data (overwrites common fields)
        geboortedatum: formData.geboortedatum ? new Date(formData.geboortedatum) : undefined,
        updated_at: new Date(), // Update timestamp
      };
      
      onUserUpdated(updatedUser);
      alert('Gebruiker (simulatie) bijgewerkt! Implementeer de daadwerkelijke API call.');
      onClose();

    } catch (apiError: any) {
      setError(apiError.message || 'Er is een fout opgetreden bij het bijwerken van de gebruiker.');
      console.error("Error updating user:", apiError);
    } finally {
      setIsLoading(false);
    }
  };

  const inputClassName = "mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-100";
  const labelClassName = "block text-sm font-medium text-gray-700 dark:text-gray-300";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-500 text-sm">{error}</p>}
      
      {/* Email field removed as it's not on the Profile type. 
          To show email, it would need to be fetched from Supabase Auth user data. 
      */}
      {/* <div>
        <label htmlFor="email" className={labelClassName}>Email (ter info, niet bewerkbaar via profiel)</label>
        <input type="email" name="email" id="email" value={user.email || 'N/A (van Auth)'} className={`${inputClassName} bg-gray-100 dark:bg-gray-600`} readOnly />
      </div> */}
      <div>
        <label htmlFor="new_password" className={labelClassName}>Nieuw Wachtwoord (leeg laten om niet te wijzigen)</label>
        <input type="password" name="new_password" id="new_password" value={formData.new_password || ''} onChange={handleChange} className={inputClassName} />
      </div>
      <div>
        <label htmlFor="voornaam" className={labelClassName}>Voornaam *</label>
        <input type="text" name="voornaam" id="voornaam" value={formData.voornaam || ''} onChange={handleChange} className={inputClassName} required />
      </div>
      <div>
        <label htmlFor="achternaam" className={labelClassName}>Achternaam *</label>
        <input type="text" name="achternaam" id="achternaam" value={formData.achternaam || ''} onChange={handleChange} className={inputClassName} required />
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
        <input type="date" name="geboortedatum" id="geboortedatum" value={formData.geboortedatum || ''} onChange={handleChange} className={inputClassName} />
      </div>
      <div>
        <label htmlFor="postcode" className={labelClassName}>Postcode</label>
        <input type="text" name="postcode" id="postcode" value={formData.postcode || ''} onChange={handleChange} className={inputClassName} />
      </div>
      <div>
        <label htmlFor="gemeente" className={labelClassName}>Gemeente</label>
        <input type="text" name="gemeente" id="gemeente" value={formData.gemeente || ''} onChange={handleChange} className={inputClassName} />
      </div>

      {formData.type === 'specialist' && (
        <>
          <hr className="my-6 border-gray-300 dark:border-gray-600"/>
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
          {isLoading ? 'Bijwerken...' : 'Bijwerken'}
        </button>
      </div>
    </form>
  );
};

export default EditUserForm;
