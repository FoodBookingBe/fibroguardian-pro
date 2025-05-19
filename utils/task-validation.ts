import { Task, TaskLog } from '@/types';

/**
 * AI validation service for task logs
 * 
 * This service analyzes task logs and provides personalized insights based on the data.
 * It uses rule-based analysis for now, but could be extended to use external AI services.
 * 
 * @param log - The task log to validate
 * @param task - The associated task
 * @returns A validation message or null if validation fails
 */
export async function validateLogWithAI(log: Partial<TaskLog> & { user_id: string }, task: Partial<Task>) {
  try {
    if (!log || !task) {
      return 'Log succesvol verwerkt. (Onvoldoende gegevens voor analyse)';
    }
    
    // Extract key metrics for analysis
    const painScore = log.pijn_score ?? 0;
    const fatigueScore = log.vermoeidheid_score ?? 0;
    const energyBefore = log.energie_voor ?? 0;
    const energyAfter = log.energie_na ?? 0;
    const energyDifference = energyBefore - energyAfter;
    const taskType = task.type || 'activiteit';
    const taskTitle = task.titel || 'onbekende activiteit';
    const taskDuration = task.duur || 0;
    
    // Log the analysis for debugging and future improvements
    console.debug('AI Validation Analysis', {
      user_id: log.user_id,
      task_id: log.task_id,
      metrics: { painScore, fatigueScore, energyBefore, energyAfter, energyDifference, taskDuration },
      taskInfo: { taskType, taskTitle }
    });
    
    // Analyze patterns and generate insights
    const insights = [];
    
    // High pain and fatigue warning
    if (painScore > 15 && fatigueScore > 15) {
      insights.push(`Opgelet: Hoge pijn (${painScore}/20) en vermoeidheid (${fatigueScore}/20) na "${taskTitle}". Overweeg aanpassingen.`);
    } else if (painScore > 15) {
      insights.push(`Opgelet: Hoge pijn (${painScore}/20) na "${taskTitle}". Overweeg aanpassingen.`);
    } else if (fatigueScore > 15) {
      insights.push(`Opgelet: Hoge vermoeidheid (${fatigueScore}/20) na "${taskTitle}". Overweeg aanpassingen.`);
    }
    
    // Energy expenditure analysis
    if (energyDifference > 8) {
      insights.push(`Deze ${taskType} ("${taskTitle}") lijkt veel energie te kosten (verschil: ${energyDifference}). Overweeg de duur of intensiteit aan te passen.`);
    } else if (energyDifference > 5) {
      insights.push(`Deze ${taskType} ("${taskTitle}") kost behoorlijk wat energie (verschil: ${energyDifference}). Houd dit in de gaten.`);
    }
    
    // Duration vs energy analysis
    if (taskDuration > 30 && energyDifference > 5) {
      insights.push(`Overweeg om "${taskTitle}" op te delen in kortere sessies om energieverlies te beperken.`);
    }
    
    // Return combined insights or default message
    if (insights.length > 0) {
      return insights.join(' ');
    }
    
    // Default validation if no specific flags
    return `Log voor "${taskTitle}" succesvol verwerkt. Blijf uw symptomen monitoren.`;
  } catch (error) {
    console.error('Fout bij AI validatie van log:', error, { 
      user_id: log?.user_id || 'unknown', 
      task_id: log?.task_id || 'unknown' 
    });
    return 'Log succesvol verwerkt. (Fout bij genereren van inzichten)';
  }
}
