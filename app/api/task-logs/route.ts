import { NextRequest, NextResponse } from 'next/server';
// import { createServerClient, type CookieOptions } from '@supabase/ssr'; // Replaced by centralized helper
// import { cookies } from 'next/headers'; // Handled by centralized helper
import { getSupabaseRouteHandlerClient } from '@/lib/supabase'; // Import centralized helper
import { formatApiError, handleSupabaseError } from '@/lib/error-handler'; // Corrected import path
import { TaskLog, Task } from '@/types'; // Import types

// Helper function for AI validation (can be moved to a separate utils/ai.ts file)
async function validateLogWithAI(log: Partial<TaskLog> & { user_id: string }, task: Partial<Task>) {
  try {
    // This is a dummy implementation. Replace with actual AI logic.
    // Example: Check if pain and fatigue are high for a demanding task.
    if (task.type === 'opdracht' && (log.pijn_score ?? 0) > 15 && (log.vermoeidheid_score ?? 0) > 15) {
      return `Opgelet: Hoge pijn (${log.pijn_score}/20) en vermoeidheid (${log.vermoeidheid_score}/20) na de opdracht "${task.titel}". Overweeg aanpassingen.`;
    }
    
    if ((log.energie_voor ?? 0) - (log.energie_na ?? 0) > 8) {
      return `Deze ${task.type || 'activiteit'} ("${task.titel}") lijkt veel energie te kosten (verschil: ${(log.energie_voor ?? 0) - (log.energie_na ?? 0)}). Overweeg de duur of intensiteit.`;
    }
    
    // Default validation if no specific flags
    return `Log voor "${task.titel}" succesvol verwerkt. Blijf uw symptomen monitoren.`;
  } catch (error) {
    console.error('Fout bij AI validatie van log:', error);
    return null; // Return null or a generic message on error
  }
}


export async function GET(req: NextRequest) {
  const supabase = getSupabaseRouteHandlerClient(); // Use centralized helper
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json(formatApiError(401, 'Niet geautoriseerd'), { status: 401 });
    
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('task_id');
    const limit = parseInt(searchParams.get('limit') || '30'); // Default to more logs
    const offset = parseInt(searchParams.get('offset') || '0');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    
    let query = supabase
      .from('task_logs')
      .select('*, tasks(titel, type)') // Join with tasks table
      .eq('user_id', session.user.id)
      .order('start_tijd', { ascending: false }) // Order by start_tijd
      .limit(limit)
      .range(offset, offset + limit - 1);
    
    if (taskId) query = query.eq('task_id', taskId);
    if (startDate) query = query.gte('start_tijd', startDate);
    if (endDate) query = query.lte('start_tijd', endDate); // Use start_tijd for date range
    
    const { data, error } = await query;
    if (error) throw error;
    
    return NextResponse.json(data as TaskLog[]);
  } catch (error) {
    const errorInfo = handleSupabaseError(error, 'logs-ophalen');
    return NextResponse.json(formatApiError(errorInfo.errorCode === 'PGRST116' ? 403 : 500, errorInfo.userMessage), { status: errorInfo.errorCode === 'PGRST116' ? 403 : 500 });
  }
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseRouteHandlerClient(); // Use centralized helper
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json(formatApiError(401, 'Niet geautoriseerd'), { status: 401 });
    
    const logData: Partial<Omit<TaskLog, 'id' | 'created_at' | 'user_id'>> & { task_id: string; start_tijd: string } = await req.json();
    
    if (!logData.task_id || !logData.start_tijd) {
      return NextResponse.json(formatApiError(400, 'Task ID en starttijd zijn verplicht'), { status: 400 });
    }
    
    const logWithUserId = { ...logData, user_id: session.user.id };
    
    const { data: insertedLog, error: insertError } = await supabase
      .from('task_logs')
      .insert([logWithUserId])
      .select()
      .single();
    
    if (insertError) throw insertError;
    if (!insertedLog) throw new Error("Failed to insert log or retrieve it.");


    // AI Validation (optional, can be intensive)
    if (logData.pijn_score !== undefined || logData.vermoeidheid_score !== undefined || logData.energie_na !== undefined) {
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select('titel, type, duur')
        .eq('id', logData.task_id)
        .single();

      if (taskError) {
         console.warn(`AI Validation: Could not fetch task details for task_id ${logData.task_id}. Skipping AI validation. Error: ${taskError.message}`);
      } else if (taskData) {
        const aiValidationMessage = await validateLogWithAI(logWithUserId, taskData);
        if (aiValidationMessage) {
          const { data: updatedLogWithAI, error: aiUpdateError } = await supabase
            .from('task_logs')
            .update({ ai_validatie: aiValidationMessage })
            .eq('id', insertedLog.id)
            .select()
            .single();
          
          if (aiUpdateError) {
            console.warn(`AI Validation: Failed to update log ${insertedLog.id} with AI insight. Error: ${aiUpdateError.message}`);
            // Return the original inserted log if AI update fails
            return NextResponse.json(insertedLog as TaskLog);
          }
          return NextResponse.json(updatedLogWithAI as TaskLog);
        }
      }
    }
    
    return NextResponse.json(insertedLog as TaskLog);
  } catch (error) {
    const errorInfo = handleSupabaseError(error, 'log-opslaan');
    return NextResponse.json(formatApiError(500, errorInfo.userMessage), { status: 500 });
  }
}
