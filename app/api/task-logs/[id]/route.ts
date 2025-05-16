import { NextResponse, NextRequest } from 'next/server';
import { getSupabaseRouteHandlerClient } from '@/lib/supabase';
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

    if (error) throw error;

    return NextResponse.json(data as TaskLog);
  } catch (error) {
    const errorInfo = handleSupabaseError(error, 'tasklog-bijwerken');
    return NextResponse.json(formatApiError(500, errorInfo.userMessage), { status: 500 });
  }
}

// DELETE a specific task log
export async function DELETE(
  request: NextRequest,
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
