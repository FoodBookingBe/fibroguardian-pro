import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getSupabaseRouteHandlerClient } from '@/lib/supabase-server';

// Schema for GET request query parameters
const GetKnowledgeQuerySchema = z.object({
  specialistId: z.string().uuid().optional(),
  contentType: z.enum(['article', 'guideline', 'recommendation', 'all']).default('all'),
  isApproved: z.enum(['true', 'false', 'all']).default('all'),
  limit: z.coerce.number().min(1).max(50).default(20),
  offset: z.coerce.number().min(0).default(0),
  searchTerm: z.string().optional()
});

// Schema for POST request body
const CreateKnowledgeSchema = z.object({
  specialistId: z.string().uuid(),
  contentType: z.enum(['article', 'guideline', 'recommendation']),
  title: z.string().min(3).max(200),
  content: z.string().min(10),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional()
});

// Schema for PATCH request body
const UpdateKnowledgeSchema = z.object({
  id: z.string().uuid(),
  contentType: z.enum(['article', 'guideline', 'recommendation']).optional(),
  title: z.string().min(3).max(200).optional(),
  content: z.string().min(10).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
  isApproved: z.boolean().optional()
});

/**
 * GET /api/knowledge
 * Retrieve expert knowledge entries
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
    specialistId: url.searchParams.get('specialistId') || undefined,
    contentType: url.searchParams.get('contentType') || 'all',
    isApproved: url.searchParams.get('isApproved') || 'all',
    limit: url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : 20,
    offset: url.searchParams.get('offset') ? parseInt(url.searchParams.get('offset')!) : 0,
    searchTerm: url.searchParams.get('searchTerm') || undefined
  };
  
  const queryParamsResult = GetKnowledgeQuerySchema.safeParse(queryParams);
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
  
  try {
    // Start building the query
    let query = supabase
      .from('expert_knowledge')
      .select('*, profiles:specialist_id(name, type, avatar_url)');
    
    // Apply filters
    if (queryParamsResult.data.specialistId) {
      query = query.eq('specialist_id', queryParamsResult.data.specialistId);
    }
    
    if (queryParamsResult.data.contentType !== 'all') {
      query = query.eq('content_type', queryParamsResult.data.contentType);
    }
    
    if (queryParamsResult.data.isApproved !== 'all') {
      query = query.eq('is_approved', queryParamsResult.data.isApproved === 'true');
    }
    
    // If user is not an admin or specialist, only show approved content
    if (profile.type !== 'admin' && profile.type !== 'specialist') {
      query = query.eq('is_approved', true);
    }
    
    // Apply search term if provided
    if (queryParamsResult.data.searchTerm) {
      query = query.or(`title.ilike.%${queryParamsResult.data.searchTerm}%,content.ilike.%${queryParamsResult.data.searchTerm}%`);
    }
    
    // Apply pagination
    query = query
      .order('created_at', { ascending: false })
      .range(
        queryParamsResult.data.offset, 
        queryParamsResult.data.offset + queryParamsResult.data.limit - 1
      );
    
    // Execute the query
    const { data: knowledgeEntries, error: knowledgeError, count } = await query;
    
    if (knowledgeError) {
      return NextResponse.json(
        { error: 'Database error', message: 'Error fetching knowledge entries', details: knowledgeError.message },
        { status: 500 }
      );
    }
    
    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabase
      .from('expert_knowledge')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Error getting total count:', countError);
    }
    
    return NextResponse.json({
      knowledgeEntries,
      pagination: {
        total: totalCount || 0,
        limit: queryParamsResult.data.limit,
        offset: queryParamsResult.data.offset
      }
    });
  } catch (error) {
    console.error('Error fetching knowledge entries:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Error fetching knowledge entries' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/knowledge
 * Create a new expert knowledge entry
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
  
  // Only specialists and admins can create knowledge entries
  if (profile.type !== 'specialist' && profile.type !== 'admin') {
    return NextResponse.json(
      { error: 'Forbidden', message: 'Only specialists and admins can create knowledge entries' },
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
  
  const bodyResult = CreateKnowledgeSchema.safeParse(body);
  if (!bodyResult.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: bodyResult.error.format() },
      { status: 400 }
    );
  }
  
  // If user is not an admin, they can only create entries for themselves
  if (profile.type !== 'admin' && bodyResult.data.specialistId !== user.id) {
    return NextResponse.json(
      { error: 'Forbidden', message: 'You can only create knowledge entries for yourself' },
      { status: 403 }
    );
  }
  
  try {
    // Insert the knowledge entry into the database
    const { data: knowledgeEntry, error: insertError } = await supabase
      .from('expert_knowledge')
      .insert({
        specialist_id: bodyResult.data.specialistId,
        content_type: bodyResult.data.contentType,
        title: bodyResult.data.title,
        content: bodyResult.data.content,
        tags: bodyResult.data.tags || [],
        metadata: bodyResult.data.metadata || {},
        is_approved: profile.type === 'admin' // Auto-approve if admin
      })
      .select()
      .single();
    
    if (insertError) {
      return NextResponse.json(
        { error: 'Database error', message: 'Error creating knowledge entry', details: insertError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ knowledgeEntry }, { status: 201 });
  } catch (error) {
    console.error('Error creating knowledge entry:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Error creating knowledge entry' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/knowledge
 * Update an existing expert knowledge entry
 */
export async function PATCH(request: NextRequest) {
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
  
  const bodyResult = UpdateKnowledgeSchema.safeParse(body);
  if (!bodyResult.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: bodyResult.error.format() },
      { status: 400 }
    );
  }
  
  try {
    // Get the knowledge entry to check ownership
    const { data: knowledgeEntry, error: getError } = await supabase
      .from('expert_knowledge')
      .select('specialist_id, is_approved')
      .eq('id', bodyResult.data.id)
      .single();
    
    if (getError) {
      return NextResponse.json(
        { error: 'Database error', message: 'Error fetching knowledge entry', details: getError.message },
        { status: 500 }
      );
    }
    
    // Check permissions
    const isOwner = knowledgeEntry.specialist_id === user.id;
    const isAdmin = profile.type === 'admin';
    
    // Only the owner or an admin can update the entry
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You do not have permission to update this knowledge entry' },
        { status: 403 }
      );
    }
    
    // Only admins can approve entries
    if (bodyResult.data.isApproved !== undefined && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Only admins can approve knowledge entries' },
        { status: 403 }
      );
    }
    
    // Prepare update data
    const updateData: Record<string, any> = {};
    
    if (bodyResult.data.contentType !== undefined) updateData.content_type = bodyResult.data.contentType;
    if (bodyResult.data.title !== undefined) updateData.title = bodyResult.data.title;
    if (bodyResult.data.content !== undefined) updateData.content = bodyResult.data.content;
    if (bodyResult.data.tags !== undefined) updateData.tags = bodyResult.data.tags;
    if (bodyResult.data.metadata !== undefined) updateData.metadata = bodyResult.data.metadata;
    if (bodyResult.data.isApproved !== undefined) updateData.is_approved = bodyResult.data.isApproved;
    
    // If non-admin is updating an approved entry, set it back to unapproved
    if (!isAdmin && knowledgeEntry.is_approved && Object.keys(updateData).length > 0) {
      updateData.is_approved = false;
    }
    
    // Update the knowledge entry
    const { data: updatedEntry, error: updateError } = await supabase
      .from('expert_knowledge')
      .update(updateData)
      .eq('id', bodyResult.data.id)
      .select()
      .single();
    
    if (updateError) {
      return NextResponse.json(
        { error: 'Database error', message: 'Error updating knowledge entry', details: updateError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ knowledgeEntry: updatedEntry });
  } catch (error) {
    console.error('Error updating knowledge entry:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Error updating knowledge entry' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/knowledge
 * Delete an expert knowledge entry
 */
export async function DELETE(request: NextRequest) {
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
  
  // Get the knowledge entry ID from the URL
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  
  if (!id) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Knowledge entry ID is required' },
      { status: 400 }
    );
  }
  
  try {
    // Get the knowledge entry to check ownership
    const { data: knowledgeEntry, error: getError } = await supabase
      .from('expert_knowledge')
      .select('specialist_id')
      .eq('id', id)
      .single();
    
    if (getError) {
      return NextResponse.json(
        { error: 'Database error', message: 'Error fetching knowledge entry', details: getError.message },
        { status: 500 }
      );
    }
    
    // Check permissions
    const isOwner = knowledgeEntry.specialist_id === user.id;
    const isAdmin = profile.type === 'admin';
    
    // Only the owner or an admin can delete the entry
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You do not have permission to delete this knowledge entry' },
        { status: 403 }
      );
    }
    
    // Delete the knowledge entry
    const { error: deleteError } = await supabase
      .from('expert_knowledge')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      return NextResponse.json(
        { error: 'Database error', message: 'Error deleting knowledge entry', details: deleteError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting knowledge entry:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Error deleting knowledge entry' },
      { status: 500 }
    );
  }
}
