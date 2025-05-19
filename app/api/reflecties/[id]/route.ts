import { NextResponse, NextRequest } from 'next/server';
import { getSupabaseRouteHandlerClient } from '@/lib/supabase-server'; // Corrected import path
import { formatApiError, handleSupabaseError } from '@/lib/error-handler';
import { Reflectie } from '@/types';

// PUT to update a specific reflectie
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const reflectieIdToUpdate = params.id;
  const supabase = getSupabaseRouteHandlerClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(formatApiError(401, 'Niet geautoriseerd'), { status: 401 });
    }

    const reflectieData: Partial<Omit<Reflectie, 'id' | 'created_at' | 'user_id' | 'ai_validatie'>> = await request.json();

    // Ensure some data is provided for update
    if (Object.keys(reflectieData).length === 0) {
        return NextResponse.json(formatApiError(400, 'Geen data om bij te werken'), { status: 400 });
    }
    
    const updatePayload = { 
      ...reflectieData, 
      user_id: user.id, // Ensure user_id consistency
      updated_at: new Date().toISOString() // Explicitly set updated_at
    };
    
    const { data, error } = await supabase
      .from('reflecties')
      .update(updatePayload)
      .eq('id', reflectieIdToUpdate)
      .eq('user_id', user.id) // User can only update their own reflecties
      .select()
      .single();

    if (error) throw error;

    // Optionally, re-run AI validation if relevant fields changed
    // For simplicity, this is omitted here but could be added like in POST

    return NextResponse.json(data as Reflectie);
  } catch (error) {
    const errorInfo = handleSupabaseError(error, 'reflectie-bijwerken');
    return NextResponse.json(formatApiError(500, errorInfo.userMessage), { status: 500 });
  }
}

// DELETE a specific reflectie
export async function DELETE(
  _request: NextRequest, // Prefixed request with underscore
  { params }: { params: { id: string } }
) {
  const reflectieIdToDelete = params.id;
  const supabase = getSupabaseRouteHandlerClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(formatApiError(401, 'Niet geautoriseerd'), { status: 401 });
    }
    
    const { error } = await supabase
      .from('reflecties')
      .delete()
      .eq('id', reflectieIdToDelete)
      .eq('user_id', user.id); // User can only delete their own reflecties
    
    if (error) throw error;
    
    return NextResponse.json({ message: 'Reflectie succesvol verwijderd' });
  } catch (error) {
    const errorInfo = handleSupabaseError(error, 'reflectie-verwijderen');
    return NextResponse.json(formatApiError(500, errorInfo.userMessage), { status: 500 });
  }
}
