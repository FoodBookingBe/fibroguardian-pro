import { PostgrestError } from '@supabase/supabase-js';

// Interface voor gestructureerde foutberichten
export interface ErrorMessage { // Added export
  userMessage: string;
  technicalMessage?: string;
  errorCode?: string;
  action?: string;
}

/**
 * Categoriseert en verwerkt Supabase database fouten
 * @param error De error van Supabase
 * @param context De context waar de fout optrad (bv. 'taak-opslaan', 'profiel-bijwerken')
 * @returns Gestructureerd foutbericht
 */
export const _handleSupabaseError = (
  error: PostgrestError | Error | unknown, 
  context: string = 'algemeen'
): ErrorMessage => {
  console.error(`Fout in context ${context}:`, error);
  
  // Standaard foutbericht
  let errorMessage: ErrorMessage = {
    userMessage: 'Er is een fout opgetreden. Probeer het later opnieuw.',
    action: 'Vernieuw de pagina of probeer het later opnieuw.'
  };
  
  // Controleer of het een PostgrestError is
  if (typeof error === 'object' && error !== null && 'code' in error && 'message' in error) { // More robust check for PostgrestError like objects
    const pgError = error as PostgrestError; // Cast after check
    
    if (pgError.code) {
      errorMessage.errorCode = pgError.code;
      
      // Categoriseer veelvoorkomende fouten
      switch (pgError.code) {
        case 'PGRST116':
          // Autorisatie/RLS fout
          errorMessage = {
            userMessage: 'U heeft geen toegang tot deze gegevens.',
            technicalMessage: 'Row Level Security fout: toegang geweigerd.',
            errorCode: pgError.code,
            action: 'Log opnieuw in of neem contact op met support als dit probleem aanhoudt.'
          };
          break;
          
        case '23505':
          // Unique constraint violation
          errorMessage = {
            userMessage: 'Deze gegevens bestaan al.',
            technicalMessage: 'Unieke constraint schending.',
            errorCode: pgError.code,
            action: 'Probeer een andere waarde of wijzig de bestaande.'
          };
          break;
          
        case '23503':
          // Foreign key constraint
          errorMessage = {
            userMessage: 'Deze actie is niet mogelijk vanwege afhankelijkheid met andere gegevens.',
            technicalMessage: 'Foreign key constraint schending.',
            errorCode: pgError.code,
            action: 'Controleer gerelateerde gegevens voordat u deze actie uitvoert.'
          };
          break;
          
        case '23514':
          // Check constraint
          errorMessage = {
            userMessage: 'De ingevoerde gegevens voldoen niet aan de vereisten.',
            technicalMessage: 'Check constraint schending.',
            errorCode: pgError.code,
            action: 'Controleer of uw invoer voldoet aan de criteria.'
          };
          break;
          
        case '22P02':
          // Invalid text representation
          errorMessage = {
            userMessage: 'De ingevoerde gegevens hebben een ongeldig formaat.',
            technicalMessage: 'Ongeldig gegevensformaat.',
            errorCode: pgError.code,
            action: 'Controleer het formaat van uw invoer.'
          };
          break;
      }
    }
    
    // Voeg Supabase-specifieke foutberichten toe indien beschikbaar
    if (pgError.message) { // Check if message exists
      errorMessage.technicalMessage = pgError.message;
    }
    
    // Voeg hint toe indien beschikbaar
    if ('hint' in pgError && pgError.hint) { // Check if hint exists
      errorMessage.action = pgError.hint as string;
    }
  } else if (error instanceof Error) {
    // Voor standaard JavaScript fouten
    errorMessage = {
      userMessage: 'Er is een onverwachte fout opgetreden.',
      technicalMessage: error.message,
      action: 'Vernieuw de pagina of probeer het later opnieuw.'
    };
  }
  
  // Context-specifieke foutberichten
  switch (context) {
    case 'authenticatie':
      errorMessage.userMessage = 'Er is een probleem met het inloggen. ' + errorMessage.userMessage;
      break;
      
    case 'taak-opslaan':
      errorMessage.userMessage = 'De taak kon niet worden opgeslagen. ' + errorMessage.userMessage;
      break;
      
    case 'profiel-bijwerken':
      errorMessage.userMessage = 'Uw profiel kon niet worden bijgewerkt. ' + errorMessage.userMessage;
      break;
      
    case 'reflectie-opslaan':
      errorMessage.userMessage = 'Uw reflectie kon niet worden opgeslagen. ' + errorMessage.userMessage;
      break;
      
    case 'specialist-patienten':
      errorMessage.userMessage = 'Er is een fout opgetreden bij het beheren van patiënten. ' + errorMessage.userMessage;
      break;
  }
  
  return errorMessage;
};

/**
 * Helper voor het formatteren van API foutberichten
 * @param statusCode HTTP status code
 * @param message Foutbericht
 * @returns Geformatteerd foutbericht object
 */
export const _formatApiError = (statusCode: number, message: string) => {
  return {
    status: statusCode,
    error: {
      message,
      timestamp: new Date().toISOString()
    }
  };
};
