import { NextRequest, NextResponse } from 'next/server';

import { formatApiError, handleSupabaseError } from '@/lib/error-handler';
import { getSupabaseRouteHandlerClient } from '@/lib/supabase-server';
import { TaskLog } from '@/types';

// PUT to update a specific task log
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
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
    
    const { data, error: rpcError } = await supabase
      .rpc('update_task_log_for_owner', {
        p_log_id: logIdToUpdate,
        p_log_data: logData,
        p_owner_user_id: user.id
      });

    if (rpcError) {
      if (rpcError.message.includes('Task log not found or user does not have permission')) {
        return NextResponse.json(formatApiError(403, 'Taaklog niet gevonden of geen toegang.'), { status: 403 });
      }
      throw rpcError;
    }
    
    if (!data) {
      return NextResponse.json(formatApiError(404, 'Taaklog niet gevonden of geen toegang na update (RPC).'), { status: 404 });
    }

    return NextResponse.json(data as TaskLog);
  } catch (error: unknown) {
    let statusCode = 500;
    let userMessage = 'Er is een onbekende fout opgetreden bij het bijwerken van de taaklog.';

    if (error instanceof Error) {
        const errorInfo = handleSupabaseError(error, 'tasklog-bijwerken');
        userMessage = errorInfo.userMessage;
        if ((error as any).message && (error as any).message.includes('Task log not found or user does not have permission')) {
            statusCode = 403;
        }
    }
    return NextResponse.json(formatApiError(statusCode, userMessage), { status: statusCode });
  }
}

// DELETE a specific task log
export async function DELETE(
  _request: NextRequest, // Prefixed with underscore as it's unused
  { params }: { params: { id: string } }
): Promise<NextResponse> {
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
  } catch (error: unknown) {
    let userMessage = 'Er is een onbekende fout opgetreden bij het verwijderen van de taaklog.';
    if (error instanceof Error) {
        const errorInfo = handleSupabaseError(error, 'tasklog-verwijderen');
        userMessage = errorInfo.userMessage;
    }
    return NextResponse.json(formatApiError(500, userMessage), { status: 500 });
  }
}
