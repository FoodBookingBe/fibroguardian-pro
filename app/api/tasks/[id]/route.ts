// import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'; // Replaced by centralized helper
// import { cookies } from 'next/headers'; // Handled by centralized helper
import { NextResponse, NextRequest } from 'next/server';
import { getSupabaseRouteHandlerClient } from '@/lib/supabase-server'; // Corrected import path
import { formatApiError, handleSupabaseError } from '@/lib/error-handler';
import { Task } from '@/types'; // Assuming Task type

export async function DELETE(
  request: NextRequest, // Use NextRequest for consistency
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

    const { error: taskDeleteError } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', user.id); 
    
    if (taskDeleteError) throw taskDeleteError;
    
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
    
    // Ensure user_id is not changed by client, enforce it to be the current user's ID
    const updatePayload = { ...taskData, user_id: user.id };
    // Remove id from payload if present, as it's used in eq()
    if ('id' in updatePayload) delete (updatePayload as any).id;


    const { data, error } = await supabase
      .from('tasks')
      .update(updatePayload)
      .eq('id', taskId)
      .eq('user_id', user.id) // User can only update their own tasks
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data as Task);
  } catch (error) {
    const errorInfo = handleSupabaseError(error, 'taak-bijwerken');
    return NextResponse.json(formatApiError(500, errorInfo.userMessage), { status: 500 });
  }
}

export async function GET(
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
