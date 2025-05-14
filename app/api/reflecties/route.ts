import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { formatApiError } from '@/lib/api-error';
import { handleSupabaseError } from '@/lib/error-handler';
import { Reflectie } from '@/types'; // Import type

// Helper functie voor AI validatie (kan in utils/ai.ts)
async function validateReflectieWithAI(reflectie: Partial<Reflectie>) {
  try {
    // Dummy implementatie
    const negatieveWoorden = ['slecht', 'moe', 'uitgeput', 'pijn', 'depressief', 'angstig', 'verdrietig', 'teleurgesteld'];
    const positieveWoorden = ['goed', 'beter', 'gelukkig', 'tevreden', 'rustig', 'energiek', 'blij', 'dankbaar'];
    
    let validationMessage = 'Bedankt voor uw reflectie. Regelmatig reflecteren helpt om inzicht te krijgen in uw patronen.';
    let issuesFound = 0;

    if (reflectie.notitie) {
      const notitie = reflectie.notitie.toLowerCase();
      const negatiefAantal = negatieveWoorden.filter(woord => notitie.includes(woord)).length;
      const positiefAantal = positieveWoorden.filter(woord => notitie.includes(woord)).length;
      
      if (negatiefAantal > positiefAantal + 1 && negatiefAantal >= 2) { // Adjusted threshold
        validationMessage = 'Uw reflectie bevat meerdere negatieve woorden. Overweeg om contact op te nemen met uw zorgverlener als u zich regelmatig zo voelt.';
        issuesFound++;
      } else if (positiefAantal > negatiefAantal + 1 && positiefAantal >=2) {
        validationMessage = 'Uw reflectie is overwegend positief! Dit is een goed teken voor uw welzijn. Blijf doen wat goed voor u werkt.';
      }
    }
    
    if (reflectie.stemming) {
      const stemmingLower = reflectie.stemming.toLowerCase();
      if (['slecht', 'zeer slecht', 'depressief', 'erg moe'].includes(stemmingLower)) {
        validationMessage = issuesFound > 0 ? validationMessage + " Ook uw aangegeven stemming is negatief." : 'U geeft aan dat u zich niet goed voelt. Overweeg om contact op te nemen met uw zorgverlener als dit aanhoudt.';
        issuesFound++;
      } else if (['goed', 'zeer goed', 'uitstekend', 'energiek'].includes(stemmingLower)) {
         if (issuesFound === 0) validationMessage = 'U geeft aan dat u zich goed voelt. Dat is positief! Probeer te onthouden wat u vandaag heeft gedaan, zodat u dit kunt herhalen.';
      }
    }
    
    return validationMessage;
  } catch (error) {
    console.error('Fout bij AI validatie van reflectie:', error);
    return 'Reflectie opgeslagen. AI analyse kon niet worden voltooid.';
  }
}

export async function GET(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json(formatApiError(401, 'Niet geautoriseerd'), { status: 401 });
    
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const limit = parseInt(searchParams.get('limit') || '30'); // Default to more
    const offset = parseInt(searchParams.get('offset') || '0');
    
    let query = supabase
      .from('reflecties')
      .select('*')
      .eq('user_id', session.user.id)
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
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json(formatApiError(401, 'Niet geautoriseerd'), { status: 401 });
    
    const reflectieData: Partial<Omit<Reflectie, 'id' | 'created_at' | 'user_id' | 'ai_validatie'>> & { datum: string } = await req.json();
    
    if (!reflectieData.datum) {
      return NextResponse.json(formatApiError(400, 'Datum is verplicht'), { status: 400 });
    }
    
    const reflectieWithUserId = {
      ...reflectieData,
      user_id: session.user.id,
      // Ensure created_at and updated_at are handled by DB or set here if needed
    };
    
    // Check for existing reflectie for this user and date to decide on insert vs update
    const { data: existingReflectie, error: checkError } = await supabase
      .from('reflecties')
      .select('id')
      .eq('user_id', session.user.id)
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
    if (reflectieData.notitie || reflectieData.stemming) {
      const aiValidationMessage = await validateReflectieWithAI(reflectieWithUserId);
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