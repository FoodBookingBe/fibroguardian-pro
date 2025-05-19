import { createSupabaseAdminClient } from '@/lib/supabase-server';
// dotenv loading will now be handled by the tsx --env-file flag

async function checkAdminProfile(userId) {
  // Environment variables should be loaded by tsx before this script runs.
  const supabaseAdmin = createSupabaseAdminClient();

  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single(); // .single() is crucial here, it expects exactly one row or throws an error.

    if (error) {
      console.error('Error fetching admin profile from Supabase:', error);
      // PGRST116 means "Failed to parse JSON response from the server" or "JSON object requested, multiple (or no) rows returned"
      // This specific error code is key to the problem.
      return { error: `Supabase error: ${error.message} (Code: ${error.code})` };
    }

    if (!data) {
      // This case should ideally be caught by .single() if no rows are found, resulting in an error with code PGRST116.
      // However, an explicit check is good practice.
      console.log('Admin profile not found for ID:', userId);
      return { message: 'Admin profile not found' };
    }

    console.log('Admin profile data:', data);
    return { data: data };
  } catch (e) {
    // Catch any other unexpected errors during the process
    console.error('Unexpected error in checkAdminProfile function:', e);
    return { error: `Unexpected error: ${e.message}` };
  }
}

// This is the admin user ID you provided
const adminUserId = 'd4211a43-87da-4324-a6ac-5c88a65c7022';

console.log(`Attempting to fetch profile for admin user ID: ${adminUserId}`);

checkAdminProfile(adminUserId)
  .then(result => {
    // Pretty print the JSON output for better readability in the terminal
    console.log("Script execution result:");
    console.log(JSON.stringify(result, null, 2));
  })
  .catch(scriptError => {
    // Catch errors from the promise chain itself (e.g., if checkAdminProfile rejects unexpectedly)
    console.error("Error during script execution:", scriptError);
    console.log(JSON.stringify({ error: `Script execution failed: ${scriptError.message}` }, null, 2));
  });
