import { NextResponse, NextRequest } from 'next/server';
import { getSupabaseRouteHandlerClient } from '@/lib/supabase-server'; // Corrected import path
import { formatApiError, handleSupabaseError } from '@/lib/error-handler';

// DELETE a specialist-patient relationship by its ID
export async function DELETE(
  _request: NextRequest, // Prefixed request with underscore
  { params }: { params: { id: string } }
) {
  const relationshipId = params.id;
  const supabase = getSupabaseRouteHandlerClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(formatApiError(401, 'Niet geautoriseerd'), { status: 401 });
    }

    // Before deleting, verify the user is part of this relationship (either the specialist or the patient)
    // to prevent unauthorized deletions.
    const { data: relation, error: fetchError } = await supabase
      .from('specialist_patienten')
      .select('specialist_id, patient_id')
      .eq('id', relationshipId)
      .single();

    if (fetchError || !relation) {
      return NextResponse.json(formatApiError(404, 'Relatie niet gevonden.'), { status: 404 });
    }

    if (user.id !== relation.specialist_id && user.id !== relation.patient_id) {
      return NextResponse.json(formatApiError(403, 'Geen toestemming om deze relatie te verwijderen.'), { status: 403 });
    }
    
    const { error: deleteError } = await supabase
      .from('specialist_patienten')
      .delete()
      .eq('id', relationshipId);
    
    if (deleteError) throw deleteError;
    
    return NextResponse.json({ message: 'Specialist-patiënt relatie succesvol verwijderd' });
  } catch (error) {
    const errorInfo = handleSupabaseError(error, 'specialist-patient-relatie-verwijderen');
    return NextResponse.json(formatApiError(500, errorInfo.userMessage), { status: 500 });
  }
}
