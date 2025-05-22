import { NextResponse, NextRequest } from 'next/server';
import { getSupabaseRouteHandlerClient } from '@/lib/supabase-server'; 
import { formatApiError, handleSupabaseError } from '@/lib/error-handler';
import { SpecialistPatient } from '@/types'; // Corrected: Removed unused Profile import

// POST to create a specialist-patient relationship
import { createClient } from '@supabase/supabase-js'; // Nodig voor service role client

// POST to create a specialist-patient relationship
export async function POST(request: NextRequest) {
  console.log('[API /api/specialist-patienten] POST request received. Body:', await request.clone().text()); // Log body as well
  const supabaseUserClient = getSupabaseRouteHandlerClient(); // For current user auth

  try {
    const { data: { user } } = await supabaseUserClient.auth.getUser();
    if (!user) {
      return NextResponse.json(formatApiError(401, 'Niet geautoriseerd'), { status: 401 });
    }

    const { patient_email, specialist_id_to_add } = await request.json();
    // patient_email: for specialist adding a patient by email
    // specialist_id_to_add: for patient adding a specialist by their ID

    let specialistId: string;
    let patientId: string;

    // Scenario 1: Specialist is adding a patient by email
    if (patient_email && user.id) {
      const { data: currentUserProfile } = await supabaseUserClient.from('profiles').select('type').eq('id', user.id).single();
      if (currentUserProfile?.type !== 'specialist') {
        return NextResponse.json(formatApiError(403, 'Alleen specialisten kunnen patiënten toevoegen via e-mail.'), { status: 403 });
      }
      specialistId = user.id;

      // Step 1: Find user ID by email using the new RPC function
      // Deze RPC zou SECURITY DEFINER moeten zijn en intern de nodige rechten hebben,
      // of we moeten ook hier een service client gebruiken als het RLS op auth.users blokkeert.
      // Voor nu gaan we ervan uit dat get_user_id_by_email werkt zoals bedoeld.
      const { data: patientUserId, error: rpcError } = await supabaseUserClient
        .rpc('get_user_id_by_email', { p_email: patient_email })
        .single(); // Expecting a single UUID or null

      if (rpcError) {
        console.error(`[API SP-POST] Error calling RPC get_user_id_by_email for ${patient_email}:`, rpcError);
        // Check if it's a "function not found" error vs. other errors
        if (rpcError.code === 'PGRST202') { // Function not found
             return NextResponse.json(formatApiError(500, 'Serverconfiguratiefout: functie voor e-mailopzoeking niet gevonden.'), { status: 500 });
        }
        return NextResponse.json(formatApiError(500, 'Fout bij het zoeken naar gebruiker via e-mail.'), { status: 500 });
      }

      if (!patientUserId) { // RPC returned null, meaning no user found with that email
        console.log(`[API SP-POST] No user found with email ${patient_email} via RPC.`);
        return NextResponse.json(formatApiError(404, 'Geen gebruiker gevonden met dit e-mailadres.'), { status: 404 });
      }
      
      const potentialPatientId = patientUserId as string; // RPC returns the UUID directly

      // Step 2: Verify this user is a 'patient' in the profiles table USING SERVICE ROLE CLIENT
      // Dit is nodig omdat de ingelogde specialist mogelijk geen directe leesrechten heeft op het profiel
      // van een willekeurige patiënt voordat er een koppeling is.
      const supabaseService = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!, // ESSENTIEEL: Service Role Key
        { auth: { autoRefreshToken: false, persistSession: false } }
      );

      const { data: patientProfile, error: patientProfileError } = await supabaseService
        .from('profiles')
        .select('id, type') // Selecteer ook type voor de zekerheid, hoewel .eq() filtert
        .eq('id', potentialPatientId)
        .eq('type', 'patient')
        .single();
      
      if (patientProfileError || !patientProfile) {
        console.error(`[API SP-POST] User ${potentialPatientId} (email: ${patient_email}) not found as 'patient' in profiles table OR profile query error:`, patientProfileError);
        return NextResponse.json(formatApiError(404, 'Patiëntprofiel niet gevonden of de gebruiker is geen patiënt.'), { status: 404 });
      }
      patientId = patientProfile.id;
    } 
    // Scenario 2: Patient is adding a specialist by specialist_id
    else if (specialist_id_to_add && user.id) {
      // Huidige gebruiker (patiënt) moet eigen profiel kunnen lezen.
      const { data: currentUserProfile } = await supabaseUserClient.from('profiles').select('type').eq('id', user.id).single();
      if (currentUserProfile?.type !== 'patient') {
        return NextResponse.json(formatApiError(403, 'Alleen patiënten kunnen specialisten toevoegen.'), { status: 403 });
      }
      patientId = user.id;
      specialistId = specialist_id_to_add;

      // Verify specialist_id_to_add is a valid specialist (kan met user client als specialisten hun eigen profiel publiek maken, anders service client)
      // Voor nu, aanname dat specialist profiel basis info publiek is of leesbaar door ingelogde user.
      const { data: specialistProfile, error: specialistError } = await supabaseUserClient
        .from('profiles')
        .select('id')
        .eq('id', specialistId)
        .eq('type', 'specialist')
        .single();
      if (specialistError || !specialistProfile) {
        return NextResponse.json(formatApiError(404, 'Specialist profiel niet gevonden of gebruiker is geen specialist.'), { status: 404 });
      }
    } else {
      return NextResponse.json(formatApiError(400, 'Ongeldige input. Geef patient_email (als specialist) of specialist_id_to_add (als patient).'), { status: 400 });
    }

    // Check if relationship already exists (kan met user client, RLS op specialist_patienten zou dit moeten toelaten)
    const { data: existingRelation, error: checkError } = await supabaseUserClient
      .from('specialist_patienten')
      .select('id')
      .eq('specialist_id', specialistId)
      .eq('patient_id', patientId)
      .maybeSingle();

    if (checkError) {
        console.error(`[API SP-POST] Error checking existing relation for S:${specialistId} P:${patientId}:`, checkError);
        throw checkError;
    }
    if (existingRelation) {
      return NextResponse.json(formatApiError(409, 'Deze specialist-patiënt relatie bestaat al.'), { status: 409 });
    }

    // Default toegangsrechten, kan later aangepast worden
    const defaultToegangsrechten = ['view_tasks', 'view_logs'];

    const { data, error: insertError } = await supabaseUserClient
      .from('specialist_patienten')
      .insert([{ specialist_id: specialistId, patient_id: patientId, toegangsrechten: defaultToegangsrechten }])
      .select()
      .single();

    if (insertError) {
        console.error(`[API SP-POST] Error inserting new relation for S:${specialistId} P:${patientId}:`, insertError);
        throw insertError;
    }

    return NextResponse.json(data as SpecialistPatient, { status: 201 });

  } catch (error) {
    const errorInfo = handleSupabaseError(error, 'specialist-patient-relatie-creeren');
    return NextResponse.json(formatApiError(500, errorInfo.userMessage), { status: 500 });
  }
}
