import { Reflectie } from '@/types';
import { memoize } from './memoize';

/**
 * Validates a reflection using AI-based analysis of text and scores.
 * 
 * This function analyzes the reflection's text content (notitie), mood (stemming),
 * pain score (pijn_score), and fatigue score (vermoeidheid_score) to generate
 * personalized feedback for the user.
 * 
 * @param reflectie - The reflection data to analyze
 * @returns A validation message with personalized feedback
 */
export async function validateReflectieWithAI(reflectie: Partial<Reflectie>): Promise<string> {
  try {
    // Uitgebreidere woordenlijsten voor betere analyse
    const negatieveWoorden = [
      'slecht', 'moe', 'uitgeput', 'pijn', 'depressief', 'angstig', 'verdrietig', 'teleurgesteld',
      'gefrustreerd', 'boos', 'geïrriteerd', 'hopeloos', 'eenzaam', 'gestrest', 'gespannen',
      'onrustig', 'onzeker', 'bang', 'somber', 'zwaar', 'moeilijk', 'zwak', 'ellendig'
    ];
    
    const positieveWoorden = [
      'goed', 'beter', 'gelukkig', 'tevreden', 'rustig', 'energiek', 'blij', 'dankbaar',
      'ontspannen', 'sterk', 'hoopvol', 'gemotiveerd', 'trots', 'opgewekt', 'positief',
      'kalm', 'vrolijk', 'enthousiast', 'optimistisch', 'vitaal', 'fit', 'opgewekt'
    ];
    
    let validationMessage = 'Bedankt voor uw reflectie. Regelmatig reflecteren helpt om inzicht te krijgen in uw patronen.';
    let issuesFound = 0;
    let positiveAspects = 0;

    // Analyse van de notitie
    if (reflectie.notitie) {
      const notitie = reflectie.notitie.toLowerCase();
      
      // Verbeterde analyse met woordfrequentie en context
      const negatiefAantal = negatieveWoorden.filter(woord => {
        // Check voor hele woorden, niet delen van woorden
        const regex = new RegExp(`\\b${woord}\\b`, 'i');
        return regex.test(notitie);
      }).length;
      
      const positiefAantal = positieveWoorden.filter(woord => {
        const regex = new RegExp(`\\b${woord}\\b`, 'i');
        return regex.test(notitie);
      }).length;
      
      // Gewogen analyse op basis van woordfrequentie en lengte van de notitie
      const woordenTotaal = notitie.split(/\s+/).length;
      const negatiefRatio = woordenTotaal > 0 ? negatiefAantal / woordenTotaal : 0;
      const positiefRatio = woordenTotaal > 0 ? positiefAantal / woordenTotaal : 0;
      
      // Verbeterde drempelwaarden voor betere detectie
      if ((negatiefAantal > positiefAantal + 1 && negatiefAantal >= 2) || negatiefRatio > 0.15) {
        validationMessage = 'Uw reflectie bevat meerdere negatieve woorden. Overweeg om contact op te nemen met uw zorgverlener als u zich regelmatig zo voelt.';
        issuesFound++;
      } else if ((positiefAantal > negatiefAantal + 1 && positiefAantal >= 2) || positiefRatio > 0.15) {
        validationMessage = 'Uw reflectie is overwegend positief! Dit is een goed teken voor uw welzijn. Blijf doen wat goed voor u werkt.';
        positiveAspects++;
      }
    }
    
    // Analyse van de stemming
    if (reflectie.stemming) {
      const stemmingLower = reflectie.stemming.toLowerCase();
      
      // Uitgebreidere stemmingscategorieën
      const negatiefStemmingen = ['slecht', 'zeer slecht', 'depressief', 'erg moe', 'somber', 'angstig', 'gespannen', 'onrustig'];
      const positiefStemmingen = ['goed', 'zeer goed', 'uitstekend', 'energiek', 'blij', 'ontspannen', 'tevreden', 'optimistisch'];
      
      if (negatiefStemmingen.includes(stemmingLower)) {
        if (issuesFound > 0) {
          validationMessage += " Ook uw aangegeven stemming is negatief.";
        } else {
          validationMessage = 'U geeft aan dat u zich niet goed voelt. Overweeg om contact op te nemen met uw zorgverlener als dit aanhoudt.';
        }
        issuesFound++;
      } else if (positiefStemmingen.includes(stemmingLower)) {
        if (issuesFound === 0) {
          validationMessage = positiveAspects > 0 
            ? validationMessage 
            : 'U geeft aan dat u zich goed voelt. Dat is positief! Probeer te onthouden wat u vandaag heeft gedaan, zodat u dit kunt herhalen.';
          positiveAspects++;
        }
      }
    }
    
    // Analyse van pijn en vermoeidheid scores
    if (reflectie.pijn_score !== undefined && reflectie.pijn_score > 15) {
      if (issuesFound > 0) {
        validationMessage += " Uw pijnscore is ook hoog.";
      } else {
        validationMessage = 'Uw pijnscore is hoog. Overweeg om contact op te nemen met uw zorgverlener als dit aanhoudt.';
      }
      issuesFound++;
    }
    
    if (reflectie.vermoeidheid_score !== undefined && reflectie.vermoeidheid_score > 15) {
      if (issuesFound > 0) {
        validationMessage += " Uw vermoeidheidsscore is ook hoog.";
      } else {
        validationMessage = 'Uw vermoeidheidsscore is hoog. Overweeg om contact op te nemen met uw zorgverlener als dit aanhoudt.';
      }
      issuesFound++;
    }
    
    // Positieve feedback voor lage scores
    if (reflectie.pijn_score !== undefined && reflectie.pijn_score < 5 && 
        reflectie.vermoeidheid_score !== undefined && reflectie.vermoeidheid_score < 5) {
      if (issuesFound === 0) {
        validationMessage = positiveAspects > 0 
          ? validationMessage 
          : 'Uw pijn- en vermoeidheidsscores zijn laag. Dat is positief! Probeer te onthouden wat u vandaag heeft gedaan, zodat u dit kunt herhalen.';
        positiveAspects++;
      }
    }
      
    return validationMessage;
  } catch (error) {
    console.error('Fout bij AI validatie van reflectie:', error);
    return 'Reflectie opgeslagen. AI analyse kon niet worden voltooid.';
  }
}

// Memoized versie van de functie voor betere performance
export const memoizedValidateReflectieWithAI = memoize(validateReflectieWithAI, {
  // Gebruik een cache key generator die rekening houdt met alle relevante velden
  cacheKeyFn: (reflectie: Partial<Reflectie>) => {
    return JSON.stringify({
      notitie: reflectie.notitie,
      stemming: reflectie.stemming,
      pijn_score: reflectie.pijn_score,
      vermoeidheid_score: reflectie.vermoeidheid_score
    });
  },
  // Cache resultaten voor 5 minuten (300000 ms)
  maxAge: 300000
});
