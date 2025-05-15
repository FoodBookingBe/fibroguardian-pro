import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { formatApiError } from '@/lib/api-error';
import { handleSupabaseError } from '@/lib/error-handler';
import { Task, SpecialistPatient } from '@/types'; // Import types

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const taskId = params.id;
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
  
  try {
    // Auth check
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        formatApiError(401, 'Niet geautoriseerd'),
        { status: 401 }
      );
    }
    
    // Taak ophalen
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();
    
    if (error) throw error;
    
    if (!data) {
      return NextResponse.json(
        formatApiError(404, 'Taak niet gevonden'),
        { status: 404 }
      );
    }
    
    const task = data as Task; // Assert type

    // Controleer of gebruiker eigenaar is of specialist
    if (task.user_id !== session.user.id) {
      // Controleer of ingelogde gebruiker specialist is voor deze gebruiker
      const { data: specialistPatientData, error: spError } = await supabase
        .from('specialist_patienten')
        .select('*')
        .eq('specialist_id', session.user.id)
        .eq('patient_id', task.user_id)
        .single();
      
      if (spError) throw spError; // Handle potential error from this query

      const specialistPatient = specialistPatientData as SpecialistPatient | null;

      if (!specialistPatient || !specialistPatient.toegangsrechten.includes('view_tasks')) {
        return NextResponse.json(
          formatApiError(403, 'Geen toegang tot deze taak'),
          { status: 403 }
        );
      }
    }
    
    return NextResponse.json(task);
  } catch (error) {
    const errorInfo = handleSupabaseError(error, 'taak-ophalen');
    
    return NextResponse.json(
      formatApiError(500, errorInfo.userMessage),
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const taskId = params.id;
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
  
  try {
    // Auth check
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        formatApiError(401, 'Niet geautoriseerd'),
        { status: 401 }
      );
    }
    
    // Haal taak op om te controleren of gebruiker eigenaar is
    const { data: existingTaskData, error: fetchError } = await supabase
      .from('tasks')
      .select('user_id')
      .eq('id', taskId)
      .single();
    
    if (fetchError) throw fetchError;
    
    if (!existingTaskData) {
      return NextResponse.json(
        formatApiError(404, 'Taak niet gevonden'),
        { status: 404 }
      );
    }
    
    const existingTask = existingTaskData as { user_id: string }; // Assert type

    // Controleer of gebruiker eigenaar is of specialist
    let hasPermission = existingTask.user_id === session.user.id;
    
    if (!hasPermission) {
      // Controleer of ingelogde gebruiker specialist is voor deze gebruiker
      const { data: specialistPatientData } = await supabase
        .from('specialist_patienten')
        .select('toegangsrechten')
        .eq('specialist_id', session.user.id)
        .eq('patient_id', existingTask.user_id)
        .single();
      
      const specialistPatient = specialistPatientData as { toegangsrechten: string[] } | null; // Assert type
      hasPermission = !!specialistPatient && specialistPatient.toegangsrechten.includes('update_tasks');
    }
    
    if (!hasPermission) {
      return NextResponse.json(
        formatApiError(403, 'Geen toegang om deze taak te bewerken'),
        { status: 403 }
      );
    }
    
    // Parse body
    const taskUpdateData: Partial<Task> = await req.json(); // Use Partial for updates
    
    // Update taak
    const { data, error } = await supabase
      .from('tasks')
      .update(taskUpdateData)
      .eq('id', taskId)
      .select()
      .single();
    
    if (error) throw error;
    
    return NextResponse.json(data as Task); // Assert type
  } catch (error) {
    const errorInfo = handleSupabaseError(error, 'taak-bijwerken');
    
    return NextResponse.json(
      formatApiError(500, errorInfo.userMessage),
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const taskId = params.id;
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
  
  try {
    // Auth check
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        formatApiError(401, 'Niet geautoriseerd'),
        { status: 401 }
      );
    }
    
    // Haal taak op om te controleren of gebruiker eigenaar is
    const { data: existingTaskData, error: fetchError } = await supabase
      .from('tasks')
      .select('user_id')
      .eq('id', taskId)
      .single();
    
    if (fetchError) throw fetchError;
    
    if (!existingTaskData) {
      return NextResponse.json(
        formatApiError(404, 'Taak niet gevonden'),
        { status: 404 }
      );
    }

    const existingTask = existingTaskData as { user_id: string }; // Assert type
    
    // Alleen eigenaar mag taak verwijderen
    if (existingTask.user_id !== session.user.id) {
      return NextResponse.json(
        formatApiError(403, 'Geen toegang om deze taak te verwijderen'),
        { status: 403 }
      );
    }
    
    // Verwijder taak
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);
    
    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    const errorInfo = handleSupabaseError(error, 'taak-verwijderen');
    
    return NextResponse.json(
      formatApiError(500, errorInfo.userMessage),
      { status: 500 }
    );
  }
}