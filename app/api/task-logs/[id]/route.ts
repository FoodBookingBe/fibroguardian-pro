import { NextResponse, NextRequest } from 'next/server';
import { getSupabaseRouteHandlerClient } from '@/lib/supabase-server';
import { formatApiError, handleSupabaseError } from '@/lib/error-handler';
import { TaskLog } from '@/types';

// PUT to update a specific task log
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const logIdToUpdate = params.id;
  const supabase = getSupabaseRouteHandlerClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(formatApiError(401, 'Niet geautoriseerd'), { status: 401 });
    }

    const logData: Partial<TaskLog> = await request.json();

    // Remove fields that should not be updated by the user directly via this endpoint
    delete logData.id;
    delete logData.user_id; // Enforce current user
    delete logData.task_id; // Task association should not change
    delete logData.created_at; // created_at should not be updated

    if (Object.keys(logData).length === 0) {
        return NextResponse.json(formatApiError(400, 'Geen data om bij te werken'), { status: 400 });
    }
    
    // Call the RPC function to update the task log
    console.log(`[API PUT /api/task-logs/${logIdToUpdate}] Calling RPC update_task_log_for_owner for user: ${user.id}`);
    const { data, error } = await supabase
      .rpc('update_task_log_for_owner', {
        p_log_id: logIdToUpdate,
        p_log_data: logData, // Pass the partial logData (JSONB in SQL function)
        p_owner_user_id: user.id
      });

    if (error) {
      console.error(`[API PUT /api/task-logs/${logIdToUpdate}] Error calling RPC update_task_log_for_owner:`, error);
      // The RPC function raises an exception if not found or no permission,
      // which might come through as a generic PostgrestError.
      // We can check for specific error messages or codes if the function provides them.
      // For now, let handleSupabaseError try to interpret it.
      throw error; 
    }
    
    // RPC returns an array of rows. If update was successful and returned the row, data will be an array with one item.
    if (!data || data.length === 0) {
      // This case might be hit if the RPC function doesn't find the record (due to our explicit check within the function)
      // and is designed to return empty rather than raise an exception for "not found".
      // Our current RPC function *does* raise an exception if not found.
      console.error(`[API PUT /api/task-logs/${logIdToUpdate}] RPC update_task_log_for_owner returned no data.`);
      return NextResponse.json(formatApiError(404, 'Taaklog niet gevonden of geen toegang.'), { status: 404 });
    }

    return NextResponse.json(data[0] as TaskLog);
  } catch (error: any) { 
    const errorInfo = handleSupabaseError(error, 'tasklog-bijwerken');
    // If the RPC raised an exception like 'Task log not found or user does not have permission...'
    // it might be caught here. We can refine status codes based on specific error messages from the RPC.
    let statusCode = 500;
    if (error.message && error.message.includes('Task log not found or user does not have permission')) {
        statusCode = 404; // Or 403 Forbidden
    } else if (errorInfo.errorCode === 'PGRST116' || errorInfo.errorCode === 'PGRST202') { 
        // PGRST116 (0 rows) shouldn't happen with this RPC if it errors on not found.
        // PGRST202 (function not found) would be a setup issue.
        statusCode = 404;
    }
    
    return NextResponse.json(formatApiError(statusCode, errorInfo.userMessage), { status: statusCode });
  }
}

// DELETE a specific task log
export async function DELETE(
  _request: NextRequest, // Prefixed with underscore as it's unused
  { params }: { params: { id: string } }
) {
  const logIdToDelete = params.id;
  const supabase = getSupabaseRouteHandlerClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(formatApiError(401, 'Niet geautoriseerd'), { status: 401 });
    }
    
    const { error } = await supabase
      .from('task_logs')
      .delete()
      .eq('id', logIdToDelete)
      .eq('user_id', user.id); // User can only delete their own logs
    
    if (error) throw error;
    
    return NextResponse.json({ message: 'Taaklog succesvol verwijderd' });
  } catch (error) {
    const errorInfo = handleSupabaseError(error, 'tasklog-verwijderen');
    return NextResponse.json(formatApiError(500, errorInfo.userMessage), { status: 500 });
  }
}
