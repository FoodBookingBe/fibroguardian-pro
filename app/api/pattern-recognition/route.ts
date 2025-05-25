import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { logger } from '@/lib/monitoring/logger';
import { getSupabaseRouteHandlerClient } from '@/lib/supabase-server';

// Schema for GET request query parameters
const GetPatternsQuerySchema = z.object({
  patientId: z.string().uuid().optional(),
  patternType: z.enum(['symptom', 'activity', 'treatment', 'all']).default('all'),
  timeframe: z.enum(['week', 'month', 'quarter', 'year']).default('month'),
  minConfidence: z.coerce.number().min(0).max(1).default(0.6),
  limit: z.coerce.number().min(1).max(50).default(10)
});

// Schema for POST request body
const AnalyzePatternSchema = z.object({
  patientId: z.string().uuid(),
  dataType: z.enum(['reflecties', 'task_logs', 'both']).default('both'),
  patternType: z.enum(['symptom', 'activity', 'treatment', 'all']).default('all'),
  timeframe: z.enum(['week', 'month', 'quarter', 'year']).default('month'),
  customParameters: z.record(z.any()).optional()
});

/**
 * GET /api/pattern-recognition
 * Retrieve recognized patterns for a patient
 */
export async function GET(request: NextRequest) {
  const supabase = getSupabaseRouteHandlerClient();

  // Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'You must be logged in to access this resource' },
      { status: 401 }
    );
  }

  // Get and validate query parameters
  const url = new URL(request.url);
  const queryParams = {
    patientId: url.searchParams.get('patientId') || undefined,
    patternType: url.searchParams.get('patternType') || 'all',
    timeframe: url.searchParams.get('timeframe') || 'month',
    minConfidence: url.searchParams.get('minConfidence') ? parseFloat(url.searchParams.get('minConfidence')!) : 0.6,
    limit: url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : 10
  };

  const queryParamsResult = GetPatternsQuerySchema.safeParse(queryParams);
  if (!queryParamsResult.success) {
    return NextResponse.json(
      { error: 'Invalid parameters', details: queryParamsResult.error.format() },
      { status: 400 }
    );
  }

  // Get user profile to check permissions
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, type')
    .eq('id', user.id)
    .single();

  if (profileError) {
    return NextResponse.json(
      { error: 'Database error', message: 'Error fetching user profile' },
      { status: 500 }
    );
  }

  // Check if user is a specialist or admin
  const isSpecialistOrAdmin = profile.type === 'specialist' || profile.type === 'admin';

  // If user is not a specialist or admin and trying to access another patient's data
  if (!isSpecialistOrAdmin && queryParamsResult.data.patientId && queryParamsResult.data.patientId !== user.id) {
    return NextResponse.json(
      { error: 'Forbidden', message: 'You do not have permission to access this resource' },
      { status: 403 }
    );
  }

  try {
    // If patientId is provided, check if specialist has access to this patient
    if (profile.type === 'specialist' && queryParamsResult.data.patientId) {
      const { data: connection, error: connectionError } = await supabase
        .from('specialist_patient_connections')
        .select('*')
        .eq('specialist_id', user.id)
        .eq('patient_id', queryParamsResult.data.patientId)
        .eq('status', 'accepted')
        .single();

      if (connectionError || !connection) {
        return NextResponse.json(
          { error: 'Forbidden', message: 'You do not have permission to access this patient\'s data' },
          { status: 403 }
        );
      }
    }

    // Determine the patient ID to use
    const patientId = queryParamsResult.data.patientId || (profile.type === 'patient' ? user.id : null);

    if (!patientId) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Patient ID is required' },
        { status: 400 }
      );
    }

    // Calculate date range based on timeframe
    const endDate = new Date();
    const startDate = new Date();

    switch (queryParamsResult.data.timeframe) {
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }

    // Fetch patterns from the database
    let query = supabase
      .from('pattern_recognition')
      .select('*')
      .eq('patient_id', patientId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .gte('confidence', queryParamsResult.data.minConfidence);

    // Apply pattern type filter if not 'all'
    if (queryParamsResult.data.patternType !== 'all') {
      query = query.eq('pattern_type', queryParamsResult.data.patternType);
    }

    // Apply limit
    query = query
      .order('confidence', { ascending: false })
      .limit(queryParamsResult.data.limit);

    const { data: patterns, error: patternsError } = await query;

    if (patternsError) {
      return NextResponse.json(
        { error: 'Database error', message: 'Error fetching patterns', details: patternsError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ patterns });
  } catch (error) {
    logger.error('Error fetching patterns:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Error fetching patterns' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pattern-recognition
 * Analyze patient data to recognize patterns
 */
export async function POST(request: NextRequest) {
  const supabase = getSupabaseRouteHandlerClient();

  // Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'You must be logged in to access this resource' },
      { status: 401 }
    );
  }

  // Get user profile to check permissions
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, type')
    .eq('id', user.id)
    .single();

  if (profileError) {
    return NextResponse.json(
      { error: 'Database error', message: 'Error fetching user profile' },
      { status: 500 }
    );
  }

  // Only specialists and admins can trigger pattern analysis
  if (profile.type !== 'specialist' && profile.type !== 'admin') {
    return NextResponse.json(
      { error: 'Forbidden', message: 'Only specialists and admins can trigger pattern analysis' },
      { status: 403 }
    );
  }

  // Parse and validate request body
  let body;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid JSON', message: 'Request body must be valid JSON' },
      { status: 400 }
    );
  }

  const bodyResult = AnalyzePatternSchema.safeParse(body);
  if (!bodyResult.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: bodyResult.error.format() },
      { status: 400 }
    );
  }

  // Check if specialist has access to this patient
  if (profile.type === 'specialist') {
    const { data: connection, error: connectionError } = await supabase
      .from('specialist_patient_connections')
      .select('*')
      .eq('specialist_id', user.id)
      .eq('patient_id', bodyResult.data.patientId)
      .eq('status', 'accepted')
      .single();

    if (connectionError || !connection) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You do not have permission to analyze this patient\'s data' },
        { status: 403 }
      );
    }
  }

  try {
    // Calculate date range based on timeframe
    const endDate = new Date();
    const startDate = new Date();

    switch (bodyResult.data.timeframe) {
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }

    // Fetch patient data for analysis
    let reflecties = [];
    let taskLogs = [];

    if (bodyResult.data.dataType === 'reflecties' || bodyResult.data.dataType === 'both') {
      const { data: reflectiesData, error: reflectiesError } = await supabase
        .from('reflecties')
        .select('*')
        .eq('user_id', bodyResult.data.patientId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true });

      if (reflectiesError) {
        return NextResponse.json(
          { error: 'Database error', message: 'Error fetching reflections', details: reflectiesError.message },
          { status: 500 }
        );
      }

      reflecties = reflectiesData || [];
    }

    if (bodyResult.data.dataType === 'task_logs' || bodyResult.data.dataType === 'both') {
      const { data: taskLogsData, error: taskLogsError } = await supabase
        .from('task_logs')
        .select('*, tasks(titel, type)')
        .eq('user_id', bodyResult.data.patientId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true });

      if (taskLogsError) {
        return NextResponse.json(
          { error: 'Database error', message: 'Error fetching task logs', details: taskLogsError.message },
          { status: 500 }
        );
      }

      taskLogs = taskLogsData || [];
    }

    // Check if we have enough data for analysis
    if (reflecties.length === 0 && taskLogs.length === 0) {
      return NextResponse.json(
        { error: 'Insufficient data', message: 'Not enough data for pattern analysis' },
        { status: 400 }
      );
    }

    // Generate some example patterns for demonstration
    // In a real implementation, this would use more sophisticated algorithms
    const patterns = generateExamplePatterns(bodyResult.data.patientId, reflecties, taskLogs, bodyResult.data.patternType);

    // Store recognized patterns in the database
    if (patterns.length > 0) {
      const { error: insertError } = await supabase
        .from('pattern_recognition')
        .insert(patterns.map(pattern => ({
          patient_id: bodyResult.data.patientId,
          pattern_type: pattern.patternType,
          title: pattern.title,
          description: pattern.description,
          data: pattern.data,
          confidence: pattern.confidence,
          created_by: user.id
        })));

      if (insertError) {
        logger.error('Error storing patterns:', insertError);
      }
    }

    return NextResponse.json({
      patterns,
      meta: {
        reflectiesCount: reflecties.length,
        taskLogsCount: taskLogs.length,
        timeframe: bodyResult.data.timeframe,
        patternType: bodyResult.data.patternType
      }
    });
  } catch (error) {
    logger.error('Error analyzing patterns:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Error analyzing patterns' },
      { status: 500 }
    );
  }
}

/**
 * Generate example patterns for demonstration
 * In a real implementation, this would use more sophisticated algorithms
 */
function generateExamplePatterns(
  _patientId: string,
  reflecties: unknown[],
  taskLogs: unknown[],
  patternType: string
): Array<{
  patternType: string;
  title: string;
  description: string;
  data: Record<string, any>;
  confidence: number;
}> {
  const patterns: Array<{
    patternType: string;
    title: string;
    description: string;
    data: Record<string, any>;
    confidence: number;
  }> = [];

  // Add some example patterns based on the requested pattern type
  if (patternType === 'symptom' || patternType === 'all') {
    if (reflecties.length >= 5) {
      patterns.push({
        patternType: 'symptom',
        title: 'Fluctuerende pijnklachten',
        description: 'De pijnscores vertonen een fluctuerend patroon over de afgelopen periode. Dit kan wijzen op wisselende symptomen.',
        data: {
          reflectiesCount: reflecties.length
        },
        confidence: 0.75
      });
    }
  }

  if (patternType === 'activity' || patternType === 'all') {
    if (taskLogs.length >= 5) {
      patterns.push({
        patternType: 'activity',
        title: 'Voorkeur voor ochtendactiviteiten',
        description: 'De meeste taken worden in de ochtend uitgevoerd. Dit kan wijzen op een natuurlijk energiepatroon.',
        data: {
          taskLogsCount: taskLogs.length
        },
        confidence: 0.8
      });
    }
  }

  if (patternType === 'treatment' || patternType === 'all') {
    if (taskLogs.length >= 5 && reflecties.length >= 5) {
      patterns.push({
        patternType: 'treatment',
        title: 'Positief effect van ontspanningsoefeningen',
        description: 'Ontspanningsoefeningen lijken een positief effect te hebben op pijn- en vermoeidheidsscores.',
        data: {
          taskLogsCount: taskLogs.length,
          reflectiesCount: reflecties.length
        },
        confidence: 0.7
      });
    }
  }

  return patterns;
}
