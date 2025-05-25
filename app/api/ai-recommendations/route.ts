import { NextRequest, NextResponse } from 'next/server';

import { formatApiError, handleSupabaseError } from '@/lib/error-handler';
import { getSupabaseRouteHandlerClient } from '@/lib/supabase-server';
import { z } from 'zod';

// Schema for GET request query parameters
const getRecommendationsSchema = z.object({
  limit: z.string().optional().transform(val => (val ? parseInt(val, 10) : 5)),
  context_type: z.enum(['task_suggestion', 'symptom_alert', 'pattern_insight']).optional(),
  user_id: z.string().uuid().optional(),
});

// Schema for POST request body
const createRecommendationSchema = z.object({
  user_id: z.string().uuid(),
  context_type: z.enum(['task_suggestion', 'symptom_alert', 'pattern_insight']),
  recommendation_text: z.string().min(1),
  confidence_score: z.number().min(0).max(1).optional(),
  source_knowledge_ids: z.array(z.string().uuid()).optional(),
});

// Schema for PATCH request body
const updateRecommendationSchema = z.object({
  id: z.string().uuid(),
  is_dismissed: z.boolean().optional(),
  recommendation_text: z.string().min(1).optional(),
  confidence_score: z.number().min(0).max(1).optional(),
});

// GET handler for retrieving AI recommendations
export async function GET(req: NextRequest): Promise<NextResponse> {
  const supabase = getSupabaseRouteHandlerClient();

  try {
    // Auth check
    const { data: { user }, error: getUserError } = await supabase.auth.getUser();

    if (getUserError || !user) {
      if (getUserError) console.error('[API AI Recommendations GET] Error fetching user:', getUserError.message);
      return NextResponse.json(
        formatApiError(401, 'Niet geautoriseerd'),
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const validationResult = getRecommendationsSchema.safeParse({
      limit: searchParams.get('limit'),
      context_type: searchParams.get('context_type'),
      user_id: searchParams.get('user_id'),
    });

    if (!validationResult.success) {
      return NextResponse.json(
        formatApiError(400, `Ongeldige parameters: ${validationResult.error.message}`),
        { status: 400 }
      );
    }

    const { limit, context_type, user_id } = validationResult.data;

    // Check if requesting recommendations for another user (specialists only)
    let targetUserId = user.id;

    if (user_id && user_id !== user.id) {
      // Check if the current user is a specialist with access to the target user
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('type')
        .eq('id', user.id)
        .single();

      if (profileError || !profile || profile.type !== 'specialist') {
        return NextResponse.json(
          formatApiError(403, 'Geen toegang tot aanbevelingen van deze gebruiker'),
          { status: 403 }
        );
      }

      // Check if the specialist has a relationship with the patient
      const { data: relationship, error: relationshipError } = await supabase
        .from('specialist_patienten')
        .select('*')
        .eq('specialist_id', user.id)
        .eq('patient_id', user_id)
        .single();

      if (relationshipError || !relationship) {
        return NextResponse.json(
          formatApiError(403, 'Geen toegang tot aanbevelingen van deze patiënt'),
          { status: 403 }
        );
      }

      targetUserId = user_id;
    }

    // Build query
    let query = supabase
      .from('ai_recommendations')
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Add context type filter if provided
    if (context_type) {
      query = query.eq('context_type', context_type);
    }

    // Execute query
    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    const errorInfo = handleSupabaseError(error, 'ai-aanbevelingen-ophalen');

    return NextResponse.json(
      formatApiError(500, errorInfo.userMessage),
      { status: 500 }
    );
  }
}

// POST handler for creating a new AI recommendation
export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = getSupabaseRouteHandlerClient();

  try {
    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      if (authError) console.error('[API AI Recommendations POST] Error fetching user:', authError.message);
      return NextResponse.json(
        formatApiError(401, 'Niet geautoriseerd'),
        { status: 401 }
      );
    }

    // Check if user is admin or specialist
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('type')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || (profile.type !== 'specialist' && profile.type !== 'admin')) {
      return NextResponse.json(
        formatApiError(403, 'Alleen specialisten en admins kunnen aanbevelingen aanmaken'),
        { status: 403 }
      );
    }

    // Parse request body
    const requestData = await req.json();
    const validationResult = createRecommendationSchema.safeParse(requestData);

    if (!validationResult.success) {
      return NextResponse.json(
        formatApiError(400, `Validatiefout: ${validationResult.error.message}`),
        { status: 400 }
      );
    }

    const recommendationData = validationResult.data;

    // If specialist, check if they have a relationship with the patient
    if (profile.type === 'specialist' && recommendationData.user_id !== user.id) {
      const { data: relationship, error: relationshipError } = await supabase
        .from('specialist_patienten')
        .select('*')
        .eq('specialist_id', user.id)
        .eq('patient_id', recommendationData.user_id)
        .single();

      if (relationshipError || !relationship) {
        return NextResponse.json(
          formatApiError(403, 'Geen toegang tot deze patiënt'),
          { status: 403 }
        );
      }
    }

    // Insert recommendation
    const { data, error } = await supabase
      .from('ai_recommendations')
      .insert({
        ...recommendationData,
        is_dismissed: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    const errorInfo = handleSupabaseError(error, 'ai-aanbeveling-opslaan');

    return NextResponse.json(
      formatApiError(500, errorInfo.userMessage),
      { status: 500 }
    );
  }
}

// PATCH handler for updating an AI recommendation (e.g., dismissing it)
export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const supabase = getSupabaseRouteHandlerClient();

  try {
    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      if (authError) console.error('[API AI Recommendations PATCH] Error fetching user:', authError.message);
      return NextResponse.json(
        formatApiError(401, 'Niet geautoriseerd'),
        { status: 401 }
      );
    }

    // Parse request body
    const requestData = await req.json();
    const validationResult = updateRecommendationSchema.safeParse(requestData);

    if (!validationResult.success) {
      return NextResponse.json(
        formatApiError(400, `Validatiefout: ${validationResult.error.message}`),
        { status: 400 }
      );
    }

    const { id, ...updateData } = validationResult.data;

    // Check if the recommendation exists and belongs to the user
    const { data: recommendation, error: getError } = await supabase
      .from('ai_recommendations')
      .select('user_id')
      .eq('id', id)
      .single();

    if (getError || !recommendation) {
      return NextResponse.json(
        formatApiError(404, 'Aanbeveling niet gevonden'),
        { status: 404 }
      );
    }

    // Check if the user has permission to update this recommendation
    if (recommendation.user_id !== user.id) {
      // Check if the user is a specialist with access to the patient
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('type')
        .eq('id', user.id)
        .single();

      if (profileError || !profile || profile.type !== 'specialist') {
        return NextResponse.json(
          formatApiError(403, 'Geen toegang tot deze aanbeveling'),
          { status: 403 }
        );
      }

      // Check if the specialist has a relationship with the patient
      const { data: relationship, error: relationshipError } = await supabase
        .from('specialist_patienten')
        .select('*')
        .eq('specialist_id', user.id)
        .eq('patient_id', recommendation.user_id)
        .single();

      if (relationshipError || !relationship) {
        return NextResponse.json(
          formatApiError(403, 'Geen toegang tot deze patiënt'),
          { status: 403 }
        );
      }
    }

    // Update recommendation
    const { data, error } = await supabase
      .from('ai_recommendations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    const errorInfo = handleSupabaseError(error, 'ai-aanbeveling-bijwerken');

    return NextResponse.json(
      formatApiError(500, errorInfo.userMessage),
      { status: 500 }
    );
  }
}

// DELETE handler for removing an AI recommendation
export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const supabase = getSupabaseRouteHandlerClient();

  try {
    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      if (authError) console.error('[API AI Recommendations DELETE] Error fetching user:', authError.message);
      return NextResponse.json(
        formatApiError(401, 'Niet geautoriseerd'),
        { status: 401 }
      );
    }

    // Get recommendation ID from query parameters
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        formatApiError(400, 'Aanbeveling ID is vereist'),
        { status: 400 }
      );
    }

    // Check if the recommendation exists and belongs to the user
    const { data: recommendation, error: getError } = await supabase
      .from('ai_recommendations')
      .select('user_id')
      .eq('id', id)
      .single();

    if (getError || !recommendation) {
      return NextResponse.json(
        formatApiError(404, 'Aanbeveling niet gevonden'),
        { status: 404 }
      );
    }

    // Check if the user has permission to delete this recommendation
    if (recommendation.user_id !== user.id) {
      // Check if the user is an admin
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('type')
        .eq('id', user.id)
        .single();

      if (profileError || !profile || profile.type !== 'admin') {
        return NextResponse.json(
          formatApiError(403, 'Geen toegang tot deze aanbeveling'),
          { status: 403 }
        );
      }
    }

    // Delete recommendation
    const { error } = await supabase
      .from('ai_recommendations')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    const errorInfo = handleSupabaseError(error, 'ai-aanbeveling-verwijderen');

    return NextResponse.json(
      formatApiError(500, errorInfo.userMessage),
      { status: 500 }
    );
  }
}
