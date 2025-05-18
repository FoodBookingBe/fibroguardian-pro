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
    delete logData.created_at;
    
    if (Object.keys(logData).length === 0) {
        return NextResponse.json(formatApiError(400, 'Geen data om bij te werken'), { status: 400 });
    }
    
    const { data, error } = await supabase
      .from('task_logs')
      .update({ ...logData, user_id: user.id }) // Ensure user_id is maintained
      .eq('id', logIdToUpdate)
      .eq('user_id', user.id) // User can only update their own logs
      .select()
      .single();

    if (error) {
      // Specifically handle PGRST116 (0 rows from .single()) as a 404
      if (error.code === 'PGRST116') {
        return NextResponse.json(formatApiError(404, 'Taaklog niet gevonden of geen toegang.'), { status: 404 });
      }
      throw error; // Re-throw other errors to be handled by generic catch
    }
    if (!data) { // Should not happen if .single() is used and no error, but as a safeguard
        return NextResponse.json(formatApiError(404, 'Taaklog niet gevonden na update.'), { status: 404 });
    }

    return NextResponse.json(data as TaskLog);
  } catch (error: any) { // Ensure error is typed or cast to any for property access
    const errorInfo = handleSupabaseError(error, 'tasklog-bijwerken');
    // Use the status code from errorInfo if available and makes sense, otherwise default
    const statusCode = (errorInfo.errorCode === 'PGRST116') ? 404 : 500; // Example, could be more nuanced
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
