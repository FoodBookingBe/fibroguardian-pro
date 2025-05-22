import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getSupabaseRouteHandlerClient } from '@/lib/supabase-server';
import { generateAIInsights } from '@/utils/ai-insights';

// Schema for GET request query parameters
const GetInsightsQuerySchema = z.object({
  patientId: z.string().uuid().optional(),
  type: z.enum(['symptom_patterns', 'treatment_efficacy', 'activity_correlation', 'all']).default('all'),
  timeframe: z.enum(['week', 'month', 'quarter', 'year']).default('month'),
  limit: z.coerce.number().min(1).max(50).default(10)
});

// Schema for POST request body
const CreateInsightSchema = z.object({
  patientId: z.string().uuid(),
  specialistId: z.string().uuid(),
  insightType: z.enum(['symptom_patterns', 'treatment_efficacy', 'activity_correlation']),
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(1000),
  data: z.record(z.any()).optional(),
  confidence: z.number().min(0).max(1).optional(),
  recommendations: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional()
});

/**
 * GET /api/ai-insights
 * Retrieve AI-generated insights based on patient data
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
    type: url.searchParams.get('type') || 'all',
    timeframe: url.searchParams.get('timeframe') || 'month',
    limit: url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : 10
  };
  
  const queryParamsResult = GetInsightsQuerySchema.safeParse(queryParams);
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
    
    // Generate insights based on parameters
    const patientId = queryParamsResult.data.patientId || (profile.type === 'patient' ? user.id : null);
    
    if (!patientId && profile.type === 'specialist') {
      // If no patientId is provided and user is a specialist, return insights for all their patients
      const { data: connections, error: connectionsError } = await supabase
        .from('specialist_patient_connections')
        .select('patient_id')
        .eq('specialist_id', user.id)
        .eq('status', 'accepted');
      
      if (connectionsError) {
        return NextResponse.json(
          { error: 'Database error', message: 'Error fetching patient connections' },
          { status: 500 }
        );
      }
      
      const patientIds = connections.map(conn => conn.patient_id);
      
      // Generate insights for all patients
      const insights = await generateAIInsights({
        patientIds,
        insightType: queryParamsResult.data.type,
        timeframe: queryParamsResult.data.timeframe,
        limit: queryParamsResult.data.limit
      });
      
      return NextResponse.json({ insights });
    } else if (patientId) {
      // Generate insights for a specific patient
      const insights = await generateAIInsights({
        patientIds: [patientId],
        insightType: queryParamsResult.data.type,
        timeframe: queryParamsResult.data.timeframe,
        limit: queryParamsResult.data.limit
      });
      
      return NextResponse.json({ insights });
    } else {
      return NextResponse.json(
        { error: 'Bad Request', message: 'No patient ID provided' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error generating insights:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Error generating insights' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ai-insights
 * Create a new AI insight (usually by specialists)
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
  
  // Only specialists and admins can create insights
  if (profile.type !== 'specialist' && profile.type !== 'admin') {
    return NextResponse.json(
      { error: 'Forbidden', message: 'Only specialists and admins can create insights' },
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
  
  const bodyResult = CreateInsightSchema.safeParse(body);
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
        { error: 'Forbidden', message: 'You do not have permission to create insights for this patient' },
        { status: 403 }
      );
    }
  }
  
  try {
    // Insert the insight into the database
    const { data: insight, error: insertError } = await supabase
      .from('ai_insights')
      .insert({
        patient_id: bodyResult.data.patientId,
        specialist_id: bodyResult.data.specialistId,
        insight_type: bodyResult.data.insightType,
        title: bodyResult.data.title,
        description: bodyResult.data.description,
        data: bodyResult.data.data || {},
        confidence: bodyResult.data.confidence || 0.7,
        recommendations: bodyResult.data.recommendations || [],
        metadata: bodyResult.data.metadata || {},
        created_by: user.id
      })
      .select()
      .single();
    
    if (insertError) {
      return NextResponse.json(
        { error: 'Database error', message: 'Error creating insight', details: insertError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ insight }, { status: 201 });
  } catch (error) {
    console.error('Error creating insight:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Error creating insight' },
      { status: 500 }
    );
  }
}
