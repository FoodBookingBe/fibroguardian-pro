import React from 'react';

// app/admin/subscriptions/page.tsx
import { getSupabaseServerComponentClient } from '@/lib/supabase-server';
import AdminSubscriptionsList, { SubscriptionWithUserProfile } from '@/components/admin/AdminSubscriptionsList';
import { Profile } from '@/types'; // Import the Profile type

export const dynamic = 'force-dynamic';

export default async function AdminSubscriptionsPage() {
  const supabase = getSupabaseServerComponentClient();
  let subscriptions: SubscriptionWithUserProfile[] = [];
  let fetchError: string | null = null;

  try {
    // Step 1: Fetch all subscriptions
    const { data: abonnementsData, error: abonnementsError } = await supabase
      .from('abonnementen')
      .select('*')
      .order('created_at', { ascending: false });

    if (abonnementsError) {
      console.error("Error fetching subscriptions:", abonnementsError);
      throw abonnementsError; // Throw to be caught by the outer catch block
    }

    if (abonnementsData && abonnementsData.length > 0) {
      // Step 2: Fetch all profiles
      // In a real-world scenario with many users, you'd fetch only relevant profiles based on user_ids from subscriptions.
      // For simplicity here, fetching all. Consider optimizing if performance becomes an issue.
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, voornaam, achternaam'); // Only select needed fields

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        // Continue with subscriptions but profiles will be empty/default
      }

      const profilesMap = new Map<string, Pick<Profile, 'id' | 'voornaam' | 'achternaam'>>();
      if (profilesData) {
        profilesData.forEach(p => profilesMap.set(p.id, p));
      }

      // Step 3: Join data in application code
      subscriptions = abonnementsData.map(sub => {
        const profile = profilesMap.get(sub.user_id);
        return {
          ...sub,
          profiles: profile 
            ? { voornaam: profile.voornaam, achternaam: profile.achternaam } 
            : { voornaam: null, achternaam: null }, // Default if no profile found
        };
      }) as SubscriptionWithUserProfile[]; // Cast needed as 'profiles' is added
    }

  } catch (e: unknown) {
    console.error("Error in data fetching for subscriptions page:", e);
    fetchError = e.message || "An unexpected error occurred.";
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">Abonnementenbeheer</h1> {/* Consistent heading */}
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6"> {/* Consistent content wrapper */}
        {fetchError && (
          <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800" role="alert">
            <span className="font-medium">Fout bij ophalen abonnementen:</span> {fetchError}
          </div>
        )}
        <AdminSubscriptionsList subscriptions={subscriptions} />
      </div>
    </div>
  );
}
