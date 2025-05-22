import { NextRequest, NextResponse } from 'next/server';
import { fromZodError } from 'zod-validation-error'; // Import fromZodError for friendly error messages

import { formatApiError, handleSupabaseError } from '@/lib/error-handler';
import { getSupabaseRouteHandlerClient } from '@/lib/supabase-server'; // Import centralized helper
import { Task } from '@/types'; // Import Task type for better type safety
import { createTaskSchema } from '@/utils/schemas/taskSchema'; // Import the Zod schema

export async function GET(req: NextRequest): Promise<NextResponse> {
  const supabase = getSupabaseRouteHandlerClient(); // Use centralized helper
  
  try {
    // Auth check
    const { data: { user }, error: getUserError } = await supabase.auth.getUser();
    
    if (getUserError || !user) {
      if (getUserError) console.error('[API Tasks GET] Error fetching user:', getUserError.message);
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
      .eq('user_id', user.id)
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

export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = getSupabaseRouteHandlerClient(); // Use centralized helper
  
  try {
    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      if (authError) console.error('[API Tasks POST] Error fetching user:', authError.message);
      return NextResponse.json(
        formatApiError(401, 'Niet geautoriseerd'),
        { status: 401 }
      );
    }
    
    // Parse body
    const rawTaskData = await req.json();
    
    // Validate incoming data with Zod
    const validationResult = createTaskSchema.safeParse(rawTaskData);

    if (!validationResult.success) {
      const validationError = fromZodError(validationResult.error);
      return NextResponse.json(
        formatApiError(400, `Validatiefout: ${validationError.message}`),
        { status: 400 }
      );
    }

    const taskData = validationResult.data; // Use validated data
    
    // Zorg ervoor dat de essentiële IDs aanwezig zijn in taskData voor de RPC
    let determinedSpecialistId: string | undefined | null = taskData.specialist_id;

    // Scenario 1: Ingelogde gebruiker is een patiënt (of admin die voor een patiënt handelt)
    // en de taak wordt aangemaakt voor deze ingelogde gebruiker (user.id === taskData.user_id).
    // In dit geval moet specialist_id NULL zijn, tenzij expliciet anders meegegeven (wat ongebruikelijk zou zijn).
    if (user.id === taskData.user_id) {
        if (taskData.specialist_id && taskData.specialist_id !== '' && taskData.specialist_id !== user.id) {
            // Een patiënt maakt een taak voor zichzelf maar specificeert een ANDERE specialist? Onwaarschijnlijk.
            // Behoud voor nu, maar dit is een edge case.
            determinedSpecialistId = taskData.specialist_id;
        } else {
            // Standaard voor patiënt die zelf taak maakt: geen specialist.
            determinedSpecialistId = undefined; 
        }
    } 
    // Scenario 2: Ingelogde gebruiker (specialist) maakt een taak voor een ANDERE gebruiker (patiënt: taskData.user_id).
    else if (user.id !== taskData.user_id) {
        // De ingelogde gebruiker (specialist) wordt de specialist_id.
        determinedSpecialistId = user.id;
    }
    // Als taskData.specialist_id al correct was (bijv. specialist maakt taak voor patiënt en stuurt eigen ID mee als specialist_id),
    // dan wordt die waarde behouden door de initialisatie van determinedSpecialistId, tenzij overschreven door bovenstaande logica.

    const rpcTaskData = {
      ...taskData,
      user_id: taskData.user_id, 
      specialist_id: determinedSpecialistId 
    };

    const { data, error } = await supabase
      .rpc('create_task_with_owner', {
        task_data: rpcTaskData, // Gebruik de verrijkte/gevalideerde rpcTaskData
        owner_user_id: user.id // ID van de ingelogde specialist (aanroeper)
      });

    if (error) {
      console.error('[API POST /api/tasks] Error calling RPC create_task_with_owner:', error);
      throw error; // Let the generic error handler catch it
    }
    
    // rpc returns an array of rows, even if it's just one.
    // If the function returns SETOF tasks and a single task is inserted, data will be an array with one item.
    if (!data || data.length === 0) {
      throw new Error('Task creation via RPC returned no data.');
    }
    
    // rpc returns an array of rows, even if it's just one.
    // If the function returns SETOF tasks and a single task is inserted, data will be an array with one item.
    if (!data || data.length === 0) {
      console.error('[API POST /api/tasks] RPC create_task_with_owner returned no data.');
      throw new Error('Task creation via RPC returned no data.');
    }

    return NextResponse.json(data[0] as Task, { status: 201 }); // Return the first (and likely only) task from the array
  } catch (error) {
    const errorInfo = handleSupabaseError(error, 'taak-opslaan');
    
    return NextResponse.json(
      formatApiError(500, errorInfo.userMessage),
      { status: 500 }
    );
  }
}
