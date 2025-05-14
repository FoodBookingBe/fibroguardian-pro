import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { formatApiError } from '@/lib/api-error';
import { handleSupabaseError } from '@/lib/error-handler';
import { Task } from '@/types'; // Import Task type for better type safety

export async function GET(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    // Auth check
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        formatApiError(401, 'Niet geautoriseerd'),
        { status: 401 }
      );
    }
    
    // Filter parameters
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const pattern = searchParams.get('pattern');
    
    // Bouw query op
    let query = supabase
      .from('tasks')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    
    // Voeg filters toe
    if (type) {
      query = query.eq('type', type);
    }
    
    if (pattern) {
      query = query.eq('herhaal_patroon', pattern);
    }
    
    // Execute query
    const { data, error } = await query;
    
    if (error) throw error;
    
    return NextResponse.json(data as Task[]); // Assert type for response
  } catch (error) {
    const errorInfo = handleSupabaseError(error, 'taken-ophalen');
    
    return NextResponse.json(
      formatApiError(500, errorInfo.userMessage),
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    // Auth check
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        formatApiError(401, 'Niet geautoriseerd'),
        { status: 401 }
      );
    }
    
    // Parse body
    const taskData: Partial<Task> = await req.json(); // Use Partial<Task> for incoming data
    
    // Valideer verplichte velden
    if (!taskData.titel || !taskData.type) {
      return NextResponse.json(
        formatApiError(400, 'Titel en type zijn verplicht'),
        { status: 400 }
      );
    }
    
    // Voeg user_id toe
    const taskWithUserId = {
      ...taskData,
      user_id: session.user.id,
    };
    
    // Voeg taak toe
    const { data, error } = await supabase
      .from('tasks')
      .insert([taskWithUserId]) // Supabase expects an array for insert
      .select()
      .single();
    
    if (error) throw error;
    
    return NextResponse.json(data as Task); // Assert type for response
  } catch (error) {
    const errorInfo = handleSupabaseError(error, 'taak-opslaan');
    
    return NextResponse.json(
      formatApiError(500, errorInfo.userMessage),
      { status: 500 }
    );
  }
}