import { NextResponse, NextRequest } from 'next/server';
import { getSupabaseRouteHandlerClient } from '@/lib/supabase-server'; // Corrected import path
import { formatApiError, handleSupabaseError } from '@/lib/error-handler';
import { Profile } from '@/types';

// PUT to update a profile
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const profileIdToUpdate = params.id;
  const supabase = getSupabaseRouteHandlerClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(formatApiError(401, 'Niet geautoriseerd'), { status: 401 });
    }

    // Users can only update their own profile
    if (user.id !== profileIdToUpdate) {
      return NextResponse.json(formatApiError(403, 'Geen toestemming om dit profiel bij te werken.'), { status: 403 });
    }

    const profileData: Partial<Profile> = await request.json();

    // Remove fields that should not be updated by the user directly via this endpoint
    delete profileData.id; // ID is from URL param, not in update payload
    // user_id is not a field on Profile type (id is the user_id)
    // email is not a field on Profile type (it's on auth.users)
    delete profileData.type; // Account type should not be changed post-creation typically

    if (Object.keys(profileData).length === 0) {
        return NextResponse.json(formatApiError(400, 'Geen data om bij te werken'), { status: 400 });
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', user.id) // Ensure update is for the authenticated user's profile
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data as Profile);
  } catch (error) {
    const errorInfo = handleSupabaseError(error, 'profiel-bijwerken');
    return NextResponse.json(formatApiError(500, errorInfo.userMessage), { status: 500 });
  }
}

// GET a specific profile (less common, usually /me or through relations)
export async function GET(
  _request: NextRequest, // Prefixed with underscore as it's not used
  { params }: { params: { id: string } }
) {
  const profileIdToFetch = params.id;
  const supabase = getSupabaseRouteHandlerClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(formatApiError(401, 'Niet geautoriseerd'), { status: 401 });
    }

    // Basic RLS should handle most cases.
    // Add specific logic if a user can fetch another user's profile under certain conditions.
    // For now, assume users can only fetch their own profile via /me, or this endpoint is for admin/specific cases.
    // If it's strictly for "others", RLS must be very robust.
    // If user is fetching their own profile via /api/profiles/[their_own_id], it's okay.
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*') // Adjust columns as needed for public/semi-public profile views
      .eq('id', profileIdToFetch)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(formatApiError(404, 'Profiel niet gevonden.'), { status: 404 });
      }
      throw error;
    }
    
    if (!data) {
      return NextResponse.json(formatApiError(404, 'Profiel niet gevonden'), { status: 404 });
    }

    // Add an explicit check if the fetched profile's user_id matches the authenticated user,
    // or if other access rules apply (e.g. specialist viewing patient).
    // This depends on application logic beyond basic RLS.
    // For now, if RLS allows the fetch, we return it.
    // A more secure default if RLS isn't fully trusted for this specific inter-user access:
    if (data.id !== user.id /* && !isSpecialistViewingPatient(user, data) */) {
        // console.warn(`User ${user.id} attempted to fetch profile ${profileIdToFetch} without explicit rule.`);
        // return NextResponse.json(formatApiError(403, 'Geen toegang tot dit profiel.'), { status: 403 });
    }


    return NextResponse.json(data as Profile);
  } catch (error) {
    const errorInfo = handleSupabaseError(error, 'profiel-ophalen-id');
    return NextResponse.json(formatApiError(500, errorInfo.userMessage), { status: 500 });
  }
}
