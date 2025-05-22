import { logger } from '@/lib/monitoring/logger';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';
import { getSupabaseRouteHandlerClient } from '@/lib/supabase-server';
import { AIInsight } from '@/types/ai';
import { Reflectie, TaskLog } from '@/types';

/**
 * Interface for AI insights generation parameters
 */
export interface AIInsightsParams {
  patientIds: string[];
  insightType: string;
  timeframe: string;
  limit: number;
}

/**
 * Generate AI insights based on patient data
 * 
 * @param params - Parameters for insights generation
 * @returns Array of AI insights
 */
export async function generateAIInsights(params: AIInsightsParams): Promise<AIInsight[]> {
  try {
    const { patientIds, insightType, timeframe, limit } = params;
    const supabase = typeof window === 'undefined' 
      ? getSupabaseRouteHandlerClient() 
      : getSupabaseBrowserClient();
    
    // Array to store all insights
    const insights: AIInsight[] = [];
    
    // Process each patient
    for (const patientId of patientIds) {
      // Fetch patient profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', patientId)
        .single();
      
      if (profileError) {
        logger.error(`Error fetching profile for patient ${patientId}:`, profileError);
        continue;
      }
      
      // Calculate date range based on timeframe
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeframe) {
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(endDate.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }
      
      // Fetch reflections for the patient
      const { data: reflections, error: reflectionsError } = await supabase
        .from('reflecties')
        .select('*')
        .eq('user_id', patientId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });
      
      if (reflectionsError) {
        logger.error(`Error fetching reflections for patient ${patientId}:`, reflectionsError);
        continue;
      }
      
      // Fetch task logs for the patient
      const { data: taskLogs, error: taskLogsError } = await supabase
        .from('task_logs')
        .select('*, tasks(titel, type)')
        .eq('user_id', patientId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });
      
      if (taskLogsError) {
        logger.error(`Error fetching task logs for patient ${patientId}:`, taskLogsError);
        continue;
      }
      
      // Generate insights based on the data and insight type
      if (insightType === 'all' || insightType === 'symptom_patterns') {
        const symptomPatterns = generateSymptomPatternInsights(patientId, reflections, taskLogs);
        insights.push(...symptomPatterns);
      }
      
      if (insightType === 'all' || insightType === 'treatment_efficacy') {
        const treatmentEfficacy = generateTreatmentEfficacyInsights(patientId, reflections, taskLogs);
        insights.push(...treatmentEfficacy);
      }
      
      if (insightType === 'all' || insightType === 'activity_correlation') {
        const activityCorrelation = generateActivityCorrelationInsights(patientId, reflections, taskLogs);
        insights.push(...activityCorrelation);
      }
    }
    
    // Sort insights by confidence (highest first) and limit the results
    return insights
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
      .slice(0, limit);
  } catch (error) {
    logger.error('Error generating AI insights:', error);
    return [];
  }
}

/**
 * Generate insights about symptom patterns
 */
function generateSymptomPatternInsights(
  patientId: string,
  reflections: Reflectie[],
  taskLogs: TaskLog[]
): AIInsight[] {
  const insights: AIInsight[] = [];
  
  // Check if we have enough data
  if (reflections.length < 5) {
    return insights;
  }
  
  // Analyze pain scores
  const painScores = reflections
    .filter(r => r.pijn_score !== undefined && r.pijn_score !== null)
    .map(r => ({ score: r.pijn_score, date: new Date(r.created_at) }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  
  if (painScores.length >= 5) {
    // Calculate trend
    let increasing = 0;
    let decreasing = 0;
    
    for (let i = 1; i < painScores.length; i++) {
      const diff = painScores[i].score - painScores[i-1].score;
      if (diff > 1) increasing++;
      else if (diff < -1) decreasing++;
    }
    
    // Determine pattern type
    if (increasing > painScores.length / 3) {
      insights.push({
        userId: patientId,
        title: 'Toenemende pijnklachten',
        description: 'De pijnscores vertonen een stijgende trend over de afgelopen periode. Dit kan wijzen op een verslechtering van de symptomen.',
        insightType: 'warning',
        relevantData: {
          painScores: painScores
        },
        suggestedActions: [
          'Bespreek de toenemende pijn met de patiënt',
          'Overweeg aanpassing van het behandelplan',
          'Controleer of er triggers zijn voor de toenemende pijn'
        ],
        confidence: 0.85
      });
    } else if (decreasing > painScores.length / 3) {
      insights.push({
        userId: patientId,
        title: 'Afnemende pijnklachten',
        description: 'De pijnscores vertonen een dalende trend over de afgelopen periode. Dit wijst op een verbetering van de symptomen.',
        insightType: 'trend',
        relevantData: {
          painScores: painScores
        },
        suggestedActions: [
          'Bespreek de afnemende pijn met de patiënt',
          'Identificeer welke interventies mogelijk hebben bijgedragen aan de verbetering',
          'Overweeg om succesvolle elementen van het behandelplan te versterken'
        ],
        confidence: 0.8
      });
    }
  }
  
  // Analyze fatigue scores
  const fatigueScores = reflections
    .filter(r => r.vermoeidheid_score !== undefined && r.vermoeidheid_score !== null)
    .map(r => ({ score: r.vermoeidheid_score, date: new Date(r.created_at) }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  
  if (fatigueScores.length >= 5) {
    // Calculate average fatigue
    const avgFatigue = fatigueScores.reduce((sum, item) => sum + item.score, 0) / fatigueScores.length;
    
    if (avgFatigue > 15) {
      insights.push({
        userId: patientId,
        title: 'Hoge vermoeidheidsscores',
        description: 'De gemiddelde vermoeidheidsscore is hoog over de afgelopen periode. Dit kan impact hebben op dagelijks functioneren.',
        insightType: 'warning',
        relevantData: {
          fatigueScores: fatigueScores,
          avgFatigue: avgFatigue
        },
        suggestedActions: [
          'Bespreek energiemanagement met de patiënt',
          'Overweeg aanpassing van het behandelplan',
          'Controleer slaapkwaliteit en andere factoren die vermoeidheid kunnen beïnvloeden'
        ],
        confidence: 0.8
      });
    }
  }
  
  return insights;
}

/**
 * Generate insights about treatment efficacy
 */
function generateTreatmentEfficacyInsights(
  patientId: string,
  reflections: Reflectie[],
  taskLogs: TaskLog[]
): AIInsight[] {
  const insights: AIInsight[] = [];
  
  // Check if we have enough data
  if (taskLogs.length < 10) {
    return insights;
  }
  
  // Group task logs by task type
  const tasksByType: Record<string, any[]> = {};
  
  taskLogs.forEach(log => {
    const taskType = log.tasks?.type || 'unknown';
    if (!tasksByType[taskType]) {
      tasksByType[taskType] = [];
    }
    tasksByType[taskType].push(log);
  });
  
  // Analyze each task type with enough data
  Object.entries(tasksByType).forEach(([taskType, logs]) => {
    if (logs.length < 5) return;
    
    // Calculate average pain and fatigue scores before and after tasks
    const painBefore = logs
      .filter(log => log.pijn_score_voor !== undefined && log.pijn_score_voor !== null)
      .map(log => log.pijn_score_voor);
    
    const painAfter = logs
      .filter(log => log.pijn_score !== undefined && log.pijn_score !== null)
      .map(log => log.pijn_score);
    
    const fatigueBefore = logs
      .filter(log => log.vermoeidheid_score_voor !== undefined && log.vermoeidheid_score_voor !== null)
      .map(log => log.vermoeidheid_score_voor);
    
    const fatigueAfter = logs
      .filter(log => log.vermoeidheid_score !== undefined && log.vermoeidheid_score !== null)
      .map(log => log.vermoeidheid_score);
    
    // Only analyze if we have enough before/after data
    if (painBefore.length >= 5 && painAfter.length >= 5) {
      const avgPainBefore = painBefore.reduce((sum, score) => sum + score, 0) / painBefore.length;
      const avgPainAfter = painAfter.reduce((sum, score) => sum + score, 0) / painAfter.length;
      const painDiff = avgPainAfter - avgPainBefore;
      
      if (Math.abs(painDiff) >= 2) {
        insights.push({
          userId: patientId,
          title: painDiff < 0 
            ? `${taskType} taken verminderen pijn` 
            : `${taskType} taken verhogen pijn`,
          description: painDiff < 0
            ? `Taken van het type '${taskType}' lijken de pijn te verminderen. De gemiddelde pijnscore daalt met ${Math.abs(painDiff).toFixed(1)} punten na deze taken.`
            : `Taken van het type '${taskType}' lijken de pijn te verhogen. De gemiddelde pijnscore stijgt met ${painDiff.toFixed(1)} punten na deze taken.`,
          insightType: painDiff < 0 ? 'correlation' : 'warning',
          relevantData: {
            taskType: taskType,
            avgPainBefore: avgPainBefore,
            avgPainAfter: avgPainAfter,
            painDiff: painDiff
          },
          suggestedActions: painDiff < 0
            ? [
                `Moedig meer ${taskType} taken aan`,
                'Bespreek de positieve effecten met de patiënt',
                'Overweeg vergelijkbare taken toe te voegen aan het behandelplan'
              ]
            : [
                `Evalueer de intensiteit van ${taskType} taken`,
                'Bespreek mogelijke aanpassingen om de taken minder belastend te maken',
                'Overweeg alternatieve taken met vergelijkbare doelen'
              ],
          confidence: 0.75
        });
      }
    }
    
    if (fatigueBefore.length >= 5 && fatigueAfter.length >= 5) {
      const avgFatigueBefore = fatigueBefore.reduce((sum, score) => sum + score, 0) / fatigueBefore.length;
      const avgFatigueAfter = fatigueAfter.reduce((sum, score) => sum + score, 0) / fatigueAfter.length;
      const fatigueDiff = avgFatigueAfter - avgFatigueBefore;
      
      if (Math.abs(fatigueDiff) >= 2) {
        insights.push({
          userId: patientId,
          title: fatigueDiff < 0 
            ? `${taskType} taken verminderen vermoeidheid` 
            : `${taskType} taken verhogen vermoeidheid`,
          description: fatigueDiff < 0
            ? `Taken van het type '${taskType}' lijken de vermoeidheid te verminderen. De gemiddelde vermoeidheidsscore daalt met ${Math.abs(fatigueDiff).toFixed(1)} punten na deze taken.`
            : `Taken van het type '${taskType}' lijken de vermoeidheid te verhogen. De gemiddelde vermoeidheidsscore stijgt met ${fatigueDiff.toFixed(1)} punten na deze taken.`,
          insightType: fatigueDiff < 0 ? 'correlation' : 'warning',
          relevantData: {
            taskType: taskType,
            avgFatigueBefore: avgFatigueBefore,
            avgFatigueAfter: avgFatigueAfter,
            fatigueDiff: fatigueDiff
          },
          suggestedActions: fatigueDiff < 0
            ? [
                `Moedig meer ${taskType} taken aan`,
                'Bespreek de positieve effecten met de patiënt',
                'Overweeg vergelijkbare taken toe te voegen aan het behandelplan'
              ]
            : [
                `Evalueer de intensiteit van ${taskType} taken`,
                'Bespreek mogelijke aanpassingen om de taken minder belastend te maken',
                'Overweeg alternatieve taken met vergelijkbare doelen'
              ],
          confidence: 0.75
        });
      }
    }
  });
  
  return insights;
}

/**
 * Generate insights about activity correlation with symptoms
 */
function generateActivityCorrelationInsights(
  patientId: string,
  reflections: Reflectie[],
  taskLogs: TaskLog[]
): AIInsight[] {
  const insights: AIInsight[] = [];
  
  // Check if we have enough data
  if (taskLogs.length < 10 || reflections.length < 5) {
    return insights;
  }
  
  // Analyze correlation between task duration and symptoms
  const tasksWithDuration = taskLogs.filter(log => 
    log.eind_tijd !== null && 
    log.start_tijd !== null && 
    log.pijn_score !== null
  );
  
  if (tasksWithDuration.length >= 5) {
    // Calculate durations
    const tasksWithMetrics = tasksWithDuration.map(log => {
      const start = new Date(log.start_tijd);
      const end = new Date(log.eind_tijd);
      const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
      
      return {
        duration: durationMinutes,
        painScore: log.pijn_score,
        fatigueScore: log.vermoeidheid_score,
        taskType: log.tasks?.type || 'unknown',
        log
      };
    });
    
    // Check for correlation between duration and pain
    const longTasks = tasksWithMetrics.filter(t => t.duration > 30);
    const shortTasks = tasksWithMetrics.filter(t => t.duration <= 30);
    
    if (longTasks.length >= 3 && shortTasks.length >= 3) {
      const avgPainLong = longTasks.reduce((sum, t) => sum + t.painScore, 0) / longTasks.length;
      const avgPainShort = shortTasks.reduce((sum, t) => sum + t.painScore, 0) / shortTasks.length;
      
      const painDiff = avgPainLong - avgPainShort;
      
      if (Math.abs(painDiff) >= 2) {
        insights.push({
          userId: patientId,
          title: painDiff > 0 
            ? 'Langere activiteiten verhogen pijn' 
            : 'Kortere activiteiten verlagen pijn',
          description: painDiff > 0
            ? 'Langere activiteiten (>30 min) lijken samen te hangen met hogere pijnscores. Overweeg om activiteiten op te delen in kortere sessies.'
            : 'Kortere activiteiten (≤30 min) lijken samen te hangen met lagere pijnscores. Dit is een positief patroon om voort te zetten.',
          insightType: painDiff > 0 ? 'warning' : 'correlation',
          relevantData: {
            avgPainLong: avgPainLong,
            avgPainShort: avgPainShort,
            painDiff: painDiff,
            longTasksCount: longTasks.length,
            shortTasksCount: shortTasks.length
          },
          suggestedActions: painDiff > 0
            ? [
                'Deel langere activiteiten op in kortere sessies',
                'Plan vaker pauzes in',
                'Wissel activiteiten af'
              ]
            : [
                'Blijf activiteiten opdelen in kortere sessies',
                'Houd dit patroon aan'
              ],
          confidence: 0.8
        });
      }
    }
  }
  
  // Analyze time of day correlation
  const morningTasks = taskLogs.filter(log => {
    const time = new Date(log.start_tijd);
    return time.getHours() < 12;
  });
  
  const afternoonTasks = taskLogs.filter(log => {
    const time = new Date(log.start_tijd);
    return time.getHours() >= 12 && time.getHours() < 18;
  });
  
  const eveningTasks = taskLogs.filter(log => {
    const time = new Date(log.start_tijd);
    return time.getHours() >= 18;
  });
  
  if (morningTasks.length >= 3 && afternoonTasks.length >= 3) {
    const avgPainMorning = morningTasks
      .filter(log => log.pijn_score !== null)
      .reduce((sum, log) => sum + log.pijn_score, 0) / morningTasks.length;
    
    const avgPainAfternoon = afternoonTasks
      .filter(log => log.pijn_score !== null)
      .reduce((sum, log) => sum + log.pijn_score, 0) / afternoonTasks.length;
    
    const painDiff = avgPainMorning - avgPainAfternoon;
    
    if (Math.abs(painDiff) >= 2) {
      insights.push({
        userId: patientId,
        title: painDiff < 0 
          ? 'Ochtendactiviteiten geven minder pijn' 
          : 'Middagactiviteiten geven minder pijn',
        description: painDiff < 0
          ? 'Activiteiten in de ochtend lijken samen te hangen met lagere pijnscores dan activiteiten in de middag.'
          : 'Activiteiten in de middag lijken samen te hangen met lagere pijnscores dan activiteiten in de ochtend.',
        insightType: 'correlation',
          relevantData: {
            avgPainMorning: avgPainMorning,
            avgPainAfternoon: avgPainAfternoon,
            painDiff: painDiff
          },
        suggestedActions: painDiff < 0
          ? [
              'Plan meer activiteiten in de ochtend',
              'Bespreek dit patroon met de patiënt'
            ]
          : [
              'Plan meer activiteiten in de middag',
              'Bespreek dit patroon met de patiënt'
            ],
        confidence: 0.7
      });
    }
  }
  
  return insights;
}
