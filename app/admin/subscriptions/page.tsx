// app/admin/subscriptions/page.tsx
// Placeholder for Subscriptions Management Page
// TODO: Implement subscription listing, filtering, search, view details, manage status functionalities

export const dynamic = 'force-dynamic';

export default async function AdminSubscriptionsPage() {
  // Example: Fetch subscriptions (can be expanded)
  // const supabase = getSupabaseServerComponentClient();
  // const { data: subscriptions, error } = await supabase.from('abonnementen').select('*, profiles(voornaam, achternaam, email)').order('created_at', { ascending: false });

  // if (error) {
  //   console.error("Error fetching subscriptions for admin page:", error);
  //   // Handle error display
  // }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Abonnementenbeheer</h1>
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <p className="text-gray-600 dark:text-gray-300">
          Functionaliteit voor abonnementenbeheer wordt hier geïmplementeerd.
        </p>
        {/* Placeholder for SubscriptionList, Filters etc. */}
      </div>
    </div>
  );
}
