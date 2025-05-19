import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteHandlerClient } from '@/lib/supabase-server';
import { formatApiError, handleSupabaseError } from '@/lib/error-handler';
import { TaskLog } from '@/types'; // Removed unused Task import
import { logger } from '@/lib/monitoring/logger';
import { validateAndSanitizeApiInput, apiSchemas } from '@/utils/api-validation';
import { validateLogWithAI } from '@/utils/task-validation';
import { rateLimit, RateLimitResult } from '@/lib/security/rateLimit';


export async function GET(req: NextRequest) {
  const supabase = getSupabaseRouteHandlerClient(); // Use centralized helper
  
  try {
    const { data: { user }, error: getUserError } = await supabase.auth.getUser();
    if (getUserError || !user) {
      if (getUserError) console.error('[API TaskLogs GET] Error fetching user:', getUserError.message);
      return NextResponse.json(formatApiError(401, 'Niet geautoriseerd'), { status: 401 });
    }
    
    // Apply rate limiting based on user ID
    const limiterResult: RateLimitResult = await rateLimit(`task_logs_get_${user.id}`, {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 30      // 30 requests per minute per user (higher limit for GET)
    });
    
    if (!limiterResult.success) {
      logger.warn(`Rate limit exceeded for user ${user.id} on task-logs GET endpoint`);
      return NextResponse.json(
        formatApiError(429, limiterResult.message || 'Te veel verzoeken, probeer het later opnieuw.'),
        { 
          status: limiterResult.statusCode || 429, 
          headers: { 
            'Retry-After': String(limiterResult.reset),
            'X-RateLimit-Limit': String(limiterResult.limit),
            'X-RateLimit-Remaining': String(limiterResult.remaining),
            'X-RateLimit-Reset': String(limiterResult.reset) 
          } 
        }
      );
    }
    
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('task_id');
    const limit = parseInt(searchParams.get('limit') || '30'); // Default to more logs
    const offset = parseInt(searchParams.get('offset') || '0');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    
    let query = supabase
      .from('task_logs')
      .select('*, tasks(titel, type)') // Join with tasks table
      .eq('user_id', user.id)
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
    const { data: { user }, error: getUserError } = await supabase.auth.getUser();
    if (getUserError || !user) {
      if (getUserError) console.error('[API TaskLogs POST] Error fetching user:', getUserError.message);
      return NextResponse.json(formatApiError(401, 'Niet geautoriseerd'), { status: 401 });
    }
    
    // Apply rate limiting based on user ID
    const limiterResult: RateLimitResult = await rateLimit(`task_logs_post_${user.id}`, {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10      // 10 requests per minute per user
    });
    
    if (!limiterResult.success) {
      logger.warn(`Rate limit exceeded for user ${user.id} on task-logs POST endpoint`);
      return NextResponse.json(
        formatApiError(429, limiterResult.message || 'Te veel verzoeken, probeer het later opnieuw.'),
        { 
          status: limiterResult.statusCode || 429, 
          headers: { 
            'Retry-After': String(limiterResult.reset),
            'X-RateLimit-Limit': String(limiterResult.limit),
            'X-RateLimit-Remaining': String(limiterResult.remaining),
            'X-RateLimit-Reset': String(limiterResult.reset) 
          } 
        }
      );
    }
    
    const requestBody = await req.json();
    
    // Validate input data using Zod schema
    const { data: validatedData, error: validationError } = validateAndSanitizeApiInput(
      requestBody,
      apiSchemas.taskLogCreate
    );
    
    if (validationError || !validatedData) {
      return NextResponse.json(formatApiError(400, validationError || 'Invalid input data'), { status: 400 });
    }
    
    const logData = validatedData;
    
    const logWithUserId = { ...logData, user_id: user.id };
    
    const { data: insertedLog, error: insertError } = await supabase
      .from('task_logs')
      .insert([logWithUserId])
      .select()
      .single();
    
    if (insertError) throw insertError;
    if (!insertedLog) throw new Error("Failed to insert log or retrieve it.");


    // Get the original request body for AI validation since it might contain fields not in the validation schema
    const originalRequestBody = requestBody as Partial<TaskLog>;
    
    // AI Validation (optional, can be intensive)
    if (originalRequestBody.pijn_score !== undefined || 
        originalRequestBody.vermoeidheid_score !== undefined || 
        originalRequestBody.energie_na !== undefined) {
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select('titel, type, duur')
        .eq('id', logData.task_id)
        .single();

      if (taskError) {
         console.warn(`AI Validation: Could not fetch task details for task_id ${logData.task_id}. Skipping AI validation. Error: ${taskError.message}`);
      } else if (taskData) {
        // Combine the validated data with the original request body for AI validation
        const logDataForAI = {
          ...originalRequestBody,
          user_id: user.id,
          task_id: logData.task_id
        };
        
        const aiValidationMessage = await validateLogWithAI(logDataForAI, taskData);
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
