import { logger } from '@/lib/monitoring/logger';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';
import { 
  Reflectie, 
  TaskLog,
  Profile
} from '@/types';
import { 
  AIAnalysisRequest, 
  AIAnalysisResponse, 
  AIInsight, 
  SymptomPattern,
  TaskSuggestion
} from '@/types/ai';

/**
 * Enhanced AI service for FibroGuardian Pro
 * Provides intelligent analysis of user data, pattern recognition,
 * and personalized recommendations
 */
export class AIService {
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
  static async validateReflectie(reflectie: Partial<Reflectie>): Promise<string> {
    try {
      // Enhanced word lists for better analysis
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

      // Analysis of the note
      if (reflectie.notitie) {
        const notitie = reflectie.notitie.toLowerCase();
        
        // Improved analysis with word frequency and context
        const negatiefAantal = negatieveWoorden.filter(woord => {
          // Check for whole words, not parts of words
          const regex = new RegExp(`\\b${woord}\\b`, 'i');
          return regex.test(notitie);
        }).length;
        
        const positiefAantal = positieveWoorden.filter(woord => {
          const regex = new RegExp(`\\b${woord}\\b`, 'i');
          return regex.test(notitie);
        }).length;
        
        // Weighted analysis based on word frequency and length of the note
        const woordenTotaal = notitie.split(/\s+/).length;
        const negatiefRatio = woordenTotaal > 0 ? negatiefAantal / woordenTotaal : 0;
        const positiefRatio = woordenTotaal > 0 ? positiefAantal / woordenTotaal : 0;
        
        // Improved thresholds for better detection
        if ((negatiefAantal > positiefAantal + 1 && negatiefAantal >= 2) || negatiefRatio > 0.15) {
          validationMessage = 'Uw reflectie bevat meerdere negatieve woorden. Overweeg om contact op te nemen met uw zorgverlener als u zich regelmatig zo voelt.';
          issuesFound++;
        } else if ((positiefAantal > negatiefAantal + 1 && positiefAantal >= 2) || positiefRatio > 0.15) {
          validationMessage = 'Uw reflectie is overwegend positief! Dit is een goed teken voor uw welzijn. Blijf doen wat goed voor u werkt.';
          positiveAspects++;
        }
      }
      
      // Analysis of the mood
      if (reflectie.stemming) {
        const stemmingLower = reflectie.stemming.toLowerCase();
        
        // More extensive mood categories
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
      
      // Analysis of pain and fatigue scores
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
      
      // Positive feedback for low scores
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
      logger.error('Fout bij AI validatie van reflectie:', error);
      return 'Reflectie opgeslagen. AI analyse kon niet worden voltooid.';
    }
  }

  /**
   * Analyzes user data to generate personalized insights and recommendations
   * 
   * @param request - The analysis request parameters
   * @returns AI analysis response with insights and recommendations
   */
  static async analyzeUserData(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    try {
      const startTime = performance.now();
      const supabase = getSupabaseBrowserClient();
      const { userId, analysisType, timeframe = 'week', includeData = {} } = request;
      
      // Fetch user profile if needed
      let profile: Profile | null = null;
      if (includeData.profile) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
          
        if (profileError) {
          logger.error('Error fetching profile for AI analysis:', profileError);
        } else {
          profile = profileData as unknown as Profile;
        }
      }
      
      // Fetch task logs if needed
      let taskLogs: TaskLog[] = [];
      if (includeData.taskLogs) {
        // Calculate date range based on timeframe
        const endDate = new Date();
        const startDate = new Date();
        
        switch (timeframe) {
          case 'day':
            startDate.setDate(endDate.getDate() - 1);
            break;
          case 'week':
            startDate.setDate(endDate.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(endDate.getMonth() - 1);
            break;
        }
        
        const { data: logsData, error: logsError } = await supabase
          .from('task_logs')
          .select('*, tasks(titel, type)')
          .eq('user_id', userId)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
          .order('created_at', { ascending: false });
          
        if (logsError) {
          logger.error('Error fetching task logs for AI analysis:', logsError);
        } else {
          taskLogs = logsData as unknown as TaskLog[];
        }
      }
      
      // Fetch reflections if needed
      let reflecties: Reflectie[] = [];
      if (includeData.reflecties) {
        // Calculate date range based on timeframe
        const endDate = new Date();
        const startDate = new Date();
        
        switch (timeframe) {
          case 'day':
            startDate.setDate(endDate.getDate() - 1);
            break;
          case 'week':
            startDate.setDate(endDate.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(endDate.getMonth() - 1);
            break;
        }
        
        const { data: reflectiesData, error: reflectiesError } = await supabase
          .from('reflecties')
          .select('*')
          .eq('user_id', userId)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
          .order('created_at', { ascending: false });
          
        if (reflectiesError) {
          logger.error('Error fetching reflections for AI analysis:', reflectiesError);
        } else {
          reflecties = reflectiesData as unknown as Reflectie[];
        }
      }
      
      // Process the data based on analysis type
      const results: AIAnalysisResponse['results'] = {};
      
      switch (analysisType) {
        case 'task_suggestion':
          results.taskSuggestions = await this.generateTaskSuggestions(userId, taskLogs, reflecties, profile);
          break;
        case 'symptom_pattern':
          results.symptomPatterns = await this.detectSymptomPatterns(userId, taskLogs, reflecties, timeframe);
          break;
        case 'insight_generation':
          results.insights = await this.generateInsights(userId, taskLogs, reflecties, timeframe);
          break;
      }
      
      const endTime = performance.now();
      
      return {
        userId,
        analysisType,
        results,
        processingTime: endTime - startTime,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('Error in AI analysis:', error);
      throw new Error('AI analysis failed: ' + (error instanceof Error ? error.message : String(error)));
    }
  }
  
  /**
   * Generates task suggestions based on user data
   */
  private static async generateTaskSuggestions(
    userId: string,
    taskLogs: TaskLog[],
    reflecties: Reflectie[],
    profile: Profile | null
  ): Promise<TaskSuggestion[]> {
    const suggestions: TaskSuggestion[] = [];
    
    // Check if we have enough data
    if (taskLogs.length === 0 && reflecties.length === 0) {
      return suggestions;
    }
    
    // Analyze pain and fatigue patterns
    const highPainDays = reflecties.filter(r => r.pijn_score !== undefined && r.pijn_score > 12).length;
    const highFatigueDays = reflecties.filter(r => r.vermoeidheid_score !== undefined && r.vermoeidheid_score > 12).length;
    
    // Suggest tasks based on patterns
    if (highPainDays > reflecties.length / 3) {
      // High pain pattern detected
      suggestions.push({
        suggestedTask: {
          type: 'taak',
          titel: 'Ontspanningsoefeningen',
          beschrijving: 'Korte ontspanningsoefeningen om pijnklachten te verminderen',
          duur: 15,
          herhaal_patroon: 'dagelijks',
          metingen: ['pijn_score', 'stemming'],
        },
        reasoning: 'U heeft de afgelopen periode regelmatig hoge pijnscores gerapporteerd. Ontspanningsoefeningen kunnen helpen om pijnklachten te verminderen.',
        confidence: 0.85,
        basedOnPatterns: ['Hoge pijnscores in reflecties', 'Patroon van pijnklachten']
      });
    }
    
    if (highFatigueDays > reflecties.length / 3) {
      // High fatigue pattern detected
      suggestions.push({
        suggestedTask: {
          type: 'taak',
          titel: 'Energiemanagement',
          beschrijving: 'Plan activiteiten en rustmomenten om energie te verdelen over de dag',
          duur: 10,
          herhaal_patroon: 'dagelijks',
          metingen: ['energie_voor', 'energie_na'],
        },
        reasoning: 'U heeft de afgelopen periode regelmatig hoge vermoeidheidsscores gerapporteerd. Energiemanagement kan helpen om uw energie beter te verdelen.',
        confidence: 0.8,
        basedOnPatterns: ['Hoge vermoeidheidsscores in reflecties', 'Patroon van vermoeidheid']
      });
    }
    
    // If no specific suggestions, add a generic one
    if (suggestions.length === 0) {
      suggestions.push({
        suggestedTask: {
          type: 'taak',
          titel: 'Dagelijkse reflectie',
          beschrijving: 'Neem een moment om te reflecteren op uw dag en noteer hoe u zich voelt',
          duur: 5,
          herhaal_patroon: 'dagelijks',
          metingen: ['stemming', 'pijn_score', 'vermoeidheid_score'],
        },
        reasoning: 'Regelmatige reflectie helpt bij het herkennen van patronen en het verbeteren van zelfmanagement.',
        confidence: 0.7,
        basedOnPatterns: ['Algemene aanbeveling voor fibromyalgiepatiënten']
      });
    }
    
    return suggestions;
  }
  
  /**
   * Detects symptom patterns in user data
   */
  private static async detectSymptomPatterns(
    userId: string,
    taskLogs: TaskLog[],
    reflecties: Reflectie[],
    timeframe: 'day' | 'week' | 'month'
  ): Promise<SymptomPattern[]> {
    const patterns: SymptomPattern[] = [];
    
    // Check if we have enough data
    if (reflecties.length < 3) {
      return patterns;
    }
    
    // Analyze pain scores
    if (reflecties.some(r => r.pijn_score !== undefined)) {
      const painScores = reflecties
        .filter(r => r.pijn_score !== undefined)
        .map(r => ({ score: r.pijn_score as number, date: new Date(r.datum) }))
        .sort((a, b) => a.date.getTime() - b.date.getTime());
      
      if (painScores.length >= 3) {
        // Calculate trend
        let increasing = 0;
        let decreasing = 0;
        let fluctuating = 0;
        
        for (let i = 1; i < painScores.length; i++) {
          const diff = painScores[i].score - painScores[i-1].score;
          if (diff > 2) increasing++;
          else if (diff < -2) decreasing++;
          else fluctuating++;
        }
        
        // Determine pattern type
        let patternType: 'increasing' | 'decreasing' | 'fluctuating' | 'stable' = 'stable';
        let severity: 'mild' | 'moderate' | 'severe' = 'mild';
        let description = '';
        
        if (increasing > decreasing && increasing > fluctuating) {
          patternType = 'increasing';
          description = 'Uw pijnscores vertonen een stijgende trend over de afgelopen periode.';
        } else if (decreasing > increasing && decreasing > fluctuating) {
          patternType = 'decreasing';
          description = 'Uw pijnscores vertonen een dalende trend over de afgelopen periode.';
        } else if (fluctuating > 0) {
          patternType = 'fluctuating';
          description = 'Uw pijnscores fluctueren over de afgelopen periode.';
        } else {
          description = 'Uw pijnscores zijn relatief stabiel over de afgelopen periode.';
        }
        
        // Determine severity
        const avgPain = painScores.reduce((sum, item) => sum + item.score, 0) / painScores.length;
        if (avgPain > 15) {
          severity = 'severe';
          description += ' De gemiddelde pijnscore is hoog.';
        } else if (avgPain > 10) {
          severity = 'moderate';
          description += ' De gemiddelde pijnscore is matig.';
        } else {
          description += ' De gemiddelde pijnscore is mild.';
        }
        
        patterns.push({
          userId,
          patternType,
          symptomType: 'pain',
          severity,
          timeframe,
          description,
          confidence: 0.8
        });
      }
    }
    
    return patterns;
  }
  
  /**
   * Generates insights based on user data
   */
  private static async generateInsights(
    userId: string,
    taskLogs: TaskLog[],
    reflecties: Reflectie[],
    timeframe: 'day' | 'week' | 'month'
  ): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];
    
    // Check if we have enough data
    if (taskLogs.length === 0 && reflecties.length === 0) {
      return insights;
    }
    
    // Analyze correlation between task duration and pain/fatigue
    if (taskLogs.length >= 5) {
      const tasksWithDuration = taskLogs.filter(log => 
        log.eind_tijd !== null && 
        log.start_tijd !== null && 
        log.pijn_score !== null
      );
      
      if (tasksWithDuration.length >= 3) {
        // Calculate durations
        const tasksWithMetrics = tasksWithDuration.map(log => {
          const start = new Date(log.start_tijd);
          const end = new Date(log.eind_tijd as string);
          const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
          
          return {
            duration: durationMinutes,
            painScore: log.pijn_score as number,
            fatigueScore: log.vermoeidheid_score as number,
            log
          };
        });
        
        // Check for correlation between duration and pain
        const longTasks = tasksWithMetrics.filter(t => t.duration > 30);
        const shortTasks = tasksWithMetrics.filter(t => t.duration <= 30);
        
        if (longTasks.length >= 2 && shortTasks.length >= 2) {
          const avgPainLong = longTasks.reduce((sum, t) => sum + t.painScore, 0) / longTasks.length;
          const avgPainShort = shortTasks.reduce((sum, t) => sum + t.painScore, 0) / shortTasks.length;
          
          const painDiff = avgPainLong - avgPainShort;
          
          if (Math.abs(painDiff) >= 2) {
            const insightType: 'correlation' | 'trend' | 'recommendation' | 'warning' = 
              painDiff > 0 ? 'warning' : 'correlation';
            
            const description = painDiff > 0 
              ? 'Langere activiteiten (>30 min) lijken samen te hangen met hogere pijnscores. Overweeg om activiteiten op te delen in kortere sessies.'
              : 'Kortere activiteiten (≤30 min) lijken samen te hangen met lagere pijnscores. Dit is een positief patroon om voort te zetten.';
            
            insights.push({
              userId,
              title: painDiff > 0 ? 'Pijn en activiteitsduur' : 'Positief effect van kortere activiteiten',
              description,
              insightType,
              relevantData: {
                taskLogs: tasksWithDuration
              },
              suggestedActions: painDiff > 0 
                ? ['Deel langere activiteiten op in kortere sessies', 'Plan vaker pauzes in', 'Wissel activiteiten af'] 
                : ['Blijf activiteiten opdelen in kortere sessies', 'Houd dit patroon aan'],
              confidence: 0.75
            });
          }
        }
      }
    }
    
    return insights;
  }
}
