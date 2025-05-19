import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteHandlerClient } from '@/lib/supabase-server';
import { formatApiError, handleSupabaseError } from '@/lib/error-handler';
import { Reflectie, ReflectieFormData } from '@/types';
import { validateReflectieWithAI } from '@/utils/ai';
import { validateAndSanitizeApiInput, apiSchemas } from '@/utils/api-validation';
import { rateLimit, RateLimitResult } from '@/lib/security/rateLimit';
import { logger } from '@/lib/monitoring/logger';

export async function GET(req: NextRequest) {
  const supabase = getSupabaseRouteHandlerClient(); // Use centralized helper
  
  try {
    const { data: { user }, error: getUserError } = await supabase.auth.getUser();
    if (getUserError || !user) {
      if (getUserError) console.error('[API Reflecties GET] Error fetching user:', getUserError.message);
      return NextResponse.json(formatApiError(401, 'Niet geautoriseerd'), { status: 401 });
    }
    
    // Apply rate limiting based on user ID
    const limiterResult: RateLimitResult = await rateLimit(`reflecties_get_${user.id}`, {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 30      // 30 requests per minute per user (higher limit for GET)
    });
    
    if (!limiterResult.success) {
      logger.warn(`Rate limit exceeded for user ${user.id} on reflecties GET endpoint`);
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
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const limit = parseInt(searchParams.get('limit') || '30'); // Default to more
    const offset = parseInt(searchParams.get('offset') || '0');
    
    let query = supabase
      .from('reflecties')
      .select('*')
      .eq('user_id', user.id)
      .order('datum', { ascending: false }) // Most recent first
      .limit(limit)
      .range(offset, offset + limit - 1);
    
    if (startDate) query = query.gte('datum', startDate);
    if (endDate) query = query.lte('datum', endDate);
    
    const { data, error } = await query;
    if (error) throw error;
    
    return NextResponse.json(data as Reflectie[]);
  } catch (error) {
    const errorInfo = handleSupabaseError(error, 'reflecties-ophalen');
    return NextResponse.json(formatApiError(500, errorInfo.userMessage), { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseRouteHandlerClient(); // Use centralized helper
  
  try {
    const { data: { user }, error: getUserError } = await supabase.auth.getUser();
    if (getUserError || !user) {
      if (getUserError) console.error('[API Reflecties POST] Error fetching user:', getUserError.message);
      return NextResponse.json(formatApiError(401, 'Niet geautoriseerd'), { status: 401 });
    }
    
    // Apply rate limiting based on user ID
    const limiterResult: RateLimitResult = await rateLimit(`reflecties_post_${user.id}`, {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10      // 10 requests per minute per user
    });
    
    if (!limiterResult.success) {
      logger.warn(`Rate limit exceeded for user ${user.id} on reflecties POST endpoint`);
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
    const { data: validatedData, error: validationError } = validateAndSanitizeApiInput<ReflectieFormData>(
      requestBody,
      apiSchemas.reflectie
    );
    
    if (validationError || !validatedData) {
      return NextResponse.json(formatApiError(400, validationError || 'Invalid input data'), { status: 400 });
    }
    
    // Create a properly typed reflectieData object
    const reflectieData = {
      datum: validatedData.datum, // Keep as string for database operations
      stemming: validatedData.stemming,
      notitie: validatedData.notitie,
      pijn_score: validatedData.pijn_score,
      vermoeidheid_score: validatedData.vermoeidheid_score
    };
    
    const reflectieWithUserId = {
      ...reflectieData,
      user_id: user.id,
      // Ensure created_at and updated_at are handled by DB or set here if needed
    };
    
    // Check for existing reflectie for this user and date to decide on insert vs update
    const { data: existingReflectie, error: checkError } = await supabase
      .from('reflecties')
      .select('id')
      .eq('user_id', user.id)
      .eq('datum', reflectieData.datum)
      .maybeSingle(); // Use maybeSingle to not throw error if not found

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means 0 rows, which is fine for insert
        throw checkError;
    }
    
    let upsertedReflectie: Reflectie | null = null;

    if (existingReflectie && existingReflectie.id) {
      // Update
      const { data, error } = await supabase
        .from('reflecties')
        .update({ ...reflectieWithUserId, updated_at: new Date().toISOString() }) // Add updated_at
        .eq('id', existingReflectie.id)
        .select()
        .single();
      if (error) throw error;
      upsertedReflectie = data;
    } else {
      // Insert
      const { data, error } = await supabase
        .from('reflecties')
        .insert([{ ...reflectieWithUserId, created_at: new Date().toISOString() }]) // Add created_at
        .select()
        .single();
      if (error) throw error;
      upsertedReflectie = data;
    }

    if (!upsertedReflectie) throw new Error("Failed to upsert reflectie or retrieve it.");

    // AI Validation
    if (reflectieData.notitie || reflectieData.stemming || 
        reflectieData.pijn_score !== undefined || reflectieData.vermoeidheid_score !== undefined) {
      // Convert string datum to Date for AI validation
      const reflectieForAI: Partial<Reflectie> = {
        ...reflectieWithUserId,
        datum: new Date(reflectieWithUserId.datum)
      };
      const aiValidationMessage = await validateReflectieWithAI(reflectieForAI);
      if (aiValidationMessage) {
        const { data: updatedReflectieWithAI, error: aiUpdateError } = await supabase
          .from('reflecties')
          .update({ ai_validatie: aiValidationMessage })
          .eq('id', upsertedReflectie.id)
          .select()
          .single();
        
        if (aiUpdateError) {
          console.warn(`AI Validation: Failed to update reflectie ${upsertedReflectie.id}. Error: ${aiUpdateError.message}`);
          return NextResponse.json(upsertedReflectie); // Return original if AI update fails
        }
        return NextResponse.json(updatedReflectieWithAI);
      }
    }
    
    return NextResponse.json(upsertedReflectie);
  } catch (error) {
    const errorInfo = handleSupabaseError(error, 'reflectie-opslaan');
    return NextResponse.json(formatApiError(500, errorInfo.userMessage), { status: 500 });
  }
}
