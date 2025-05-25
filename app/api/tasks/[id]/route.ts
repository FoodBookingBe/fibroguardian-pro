// import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'; // Replaced by centralized helper
// import { cookies } from 'next/headers'; // Handled by centralized helper
import { _formatApiError as formatApiError, _handleSupabaseError as handleSupabaseError } from '@/lib/error-handler';
import { _getSupabaseRouteHandlerClient as getSupabaseRouteHandlerClient } from '@/lib/supabase-server'; // Corrected import path
import { Task } from '@/types'; // Assuming Task type
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  _request: NextRequest, // Use NextRequest for consistency
  { params }: { params: { id: string } }
) {
  const taskId = params.id;
  const supabase = getSupabaseRouteHandlerClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(formatApiError(401, 'Niet geautoriseerd'), { status: 401 });
    }

    // Delete associated task_logs first to avoid foreign key constraint issues
    const { error: logDeleteError } = await supabase
      .from('task_logs')
      .delete()
      .eq('task_id', taskId)
      .eq('user_id', user.id); // Ensure user context for log deletion as well

    if (logDeleteError) {
      // Log the error but don't necessarily block task deletion if logs don't exist or RLS prevents
      console.warn(`Warning deleting logs for task ${taskId}: ${logDeleteError.message}`);
    }

    // Een specialist mag een taak verwijderen die hij/zij heeft aangemaakt.
    // Een patiënt mag een taak verwijderen die aan hem/haar is toegewezen (user_id match).
    // De RLS policy zal de uiteindelijke permissie bepalen.
    // We proberen te verwijderen op basis van task ID. De RLS checkt of de user.id
    // ofwel de user_id van de taak is, of de specialist_id van de taak.

    const { error: taskDeleteError } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);
    // De RLS policy moet nu de permissie afdwingen.
    // De .eq('user_id', user.id) of .eq('specialist_id', user.id) is niet strikt nodig hier
    // als de RLS policies correct zijn, maar kan als extra veiligheidslaag.
    // Voor nu vertrouwen we op RLS.

    if (taskDeleteError) {
      // Specifieke check voor RLS violation (kan als 403 of 404 komen afhankelijk van Supabase versie/config)
      if (taskDeleteError.code === 'PGRST000' || taskDeleteError.code === 'PGRST116' || taskDeleteError.details?.toLowerCase().includes('rls')) {
        console.warn(`RLS violation or task not found for delete: ${taskId}, user: ${user.id}`);
        return NextResponse.json(formatApiError(403, 'Geen permissie om deze taak te verwijderen of taak niet gevonden.'), { status: 403 });
      }
      throw taskDeleteError;
    }

    return NextResponse.json({ message: 'Taak succesvol verwijderd' }); // Return 200 OK with success message
  } catch (error) {
    const errorInfo = handleSupabaseError(error, 'taak-verwijderen');
    return NextResponse.json(formatApiError(500, errorInfo.userMessage), { status: 500 });
  }
}

export async function PUT(
  request: NextRequest, // Use NextRequest
  { params }: { params: { id: string } }
) {
  const taskId = params.id;
  const supabase = getSupabaseRouteHandlerClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(formatApiError(401, 'Niet geautoriseerd'), { status: 401 });
    }

    const taskData: Partial<Task> = await request.json();

    // Basic validation
    if (!taskData.titel && !taskData.beschrijving && taskData.duur === undefined) { // Check if any actual data is sent
      return NextResponse.json(formatApiError(400, 'Geen data om bij te werken'), { status: 400 });
    }

    // Verwijder user_id en specialist_id uit de taskData om te voorkomen dat deze per ongeluk worden gewijzigd.
    // De eigenaar (user_id) van een taak zou normaal gesproken niet moeten veranderen.
    // De specialist_id (aanmaker) zou ook niet moeten veranderen.
    const { user_id: taskUserId, specialist_id: taskSpecialistId, ...editableTaskData } = taskData;

    const updatePayload = { ...editableTaskData }; // Alleen de bewerkbare velden

    // De RLS policy moet afdwingen dat alleen de toegewezen specialist (of admin) kan updaten.
    // De query hieronder voegt een extra check toe dat de ingelogde gebruiker de specialist_id is.
    // De RLS policy (USING auth.uid() = user_id WITH CHECK auth.uid() = user_id)
    // zou moeten afdwingen dat alleen de eigenaar (patiënt) de taak kan updaten.
    // Als een specialist een taak moet kunnen updaten die hij heeft aangemaakt voor een patiënt,
    // dan moet de RLS UPDATE policy worden uitgebreid, bijv.:
    // USING (auth.uid() = user_id OR auth.uid() = specialist_id)
    // WITH CHECK (auth.uid() = user_id OR auth.uid() = specialist_id)
    // Voor nu gaan we ervan uit dat alleen de patiënt (user_id) zijn/haar taken mag bijwerken.
    const { data, error } = await supabase
      .from('tasks')
      .update(updatePayload)
      .eq('id', taskId)
      // .eq('user_id', user.id) // Deze check wordt door RLS afgehandeld.
      .select()
      .single();

    if (error) {
      // error.code 'PGRST204' (No Content) betekent dat de WHERE clause (id + RLS) geen rij vond.
      if (error.code === 'PGRST204') {
        console.warn(`Task not found or RLS prevented update for task ${taskId}, user: ${user.id}`);
        return NextResponse.json(formatApiError(404, 'Taak niet gevonden of geen permissie om bij te werken.'), { status: 404 });
      }
      // Andere errors (PGRST000, PGRST116 kunnen ook wijzen op RLS/niet gevonden)
      if (error.details?.toLowerCase().includes('rls') || error.code === 'PGRST116') {
        console.warn(`RLS violation or task not found for update: ${taskId}, user: ${user.id}. Error: ${error.message}`);
        return NextResponse.json(formatApiError(403, 'Geen permissie om deze taak bij te werken of taak niet gevonden.'), { status: 403 });
      }
      throw error;
    }

    return NextResponse.json(data as Task);
  } catch (error) {
    const errorInfo = handleSupabaseError(error, 'taak-bijwerken');
    return NextResponse.json(formatApiError(500, errorInfo.userMessage), { status: 500 });
  }
}

export async function GET(
  _request: NextRequest, // Use NextRequest
  { params }: { params: { id: string } }
) {
  const taskId = params.id;
  const supabase = getSupabaseRouteHandlerClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(formatApiError(401, 'Niet geautoriseerd'), { status: 401 });
    }

    const { data, error } = await supabase
      .from('tasks')
      .select<'*', Task>('*') // Ensure Task type is used
      .eq('id', taskId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Not found or RLS violation
        return NextResponse.json(formatApiError(404, 'Taak niet gevonden of geen toegang.'), { status: 404 });
      }
      throw error; // Other errors
    }

    if (!data) { // Should be caught by single() error PGRST116 if not found
      return NextResponse.json(formatApiError(404, 'Taak niet gevonden'), { status: 404 });
    }

    // RLS should handle if user can access this task.
    // If additional checks are needed (e.g. specialist access), they can be added here.
    // For now, assume RLS is primary guard. If data is returned, user has access.
    // if (data.user_id !== user.id /* && check specialist logic if any */) {
    //   return NextResponse.json(formatApiError(403, 'Geen toegang tot deze taak'), { status: 403 });
    // }

    return NextResponse.json(data);
  } catch (error) {
    const errorInfo = handleSupabaseError(error, 'taak-ophalen');
    return NextResponse.json(formatApiError(500, errorInfo.userMessage), { status: 500 });
  }
}
