import { NextResponse, NextRequest } from 'next/server';
import { getSupabaseRouteHandlerClient } from '@/lib/supabase-server'; // Corrected import path
import { formatApiError, handleSupabaseError } from '@/lib/error-handler';
import { Profile } from '@/types';

export async function GET(request: NextRequest) {
  const supabase = getSupabaseRouteHandlerClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(formatApiError(401, 'Niet geautoriseerd'), { status: 401 });
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      // PGRST116: No rows found (or RLS violation)
      if (error.code === 'PGRST116') { 
        return NextResponse.json(formatApiError(404, 'Profiel niet gevonden.'), { status: 404 });
      }
      throw error; // Other Supabase errors
    }

    if (!data) { // Should be caught by single() error if not found
      return NextResponse.json(formatApiError(404, 'Profiel niet gevonden'), { status: 404 });
    }

    return NextResponse.json(data as Profile);
  } catch (error) {
    const errorInfo = handleSupabaseError(error, 'profiel-ophalen-me');
    return NextResponse.json(formatApiError(500, errorInfo.userMessage), { status: 500 });
  }
}
