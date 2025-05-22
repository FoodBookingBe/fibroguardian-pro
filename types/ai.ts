// AI-related types for FibroGuardian Pro

import { Reflectie, Task, TaskLog } from './index';

// Expert knowledge types
export type ContentType = 'article' | 'guideline' | 'recommendation';

export interface ExpertKnowledge {
  id: string;
  specialist_id: string;
  content_type: ContentType;
  title: string;
  content: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  is_approved: boolean;
  created_at: Date;
}

// AI recommendation types
export type ContextType = 'task_suggestion' | 'symptom_alert' | 'pattern_insight';

export interface AIRecommendation {
  id: string;
  user_id: string;
  context_type: ContextType;
  recommendation_text: string;
  confidence_score?: number;
  source_knowledge_ids?: string[];
  is_dismissed: boolean;
  created_at: Date;
}

// Task suggestion types
export interface TaskSuggestion {
  suggestedTask: Partial<Task>;
  reasoning: string;
  confidence: number;
  basedOnPatterns: string[];
}

// Task difficulty adjustment
export interface TaskDifficultyAdjustment {
  taskId: string;
  newDifficulty: number;
  reason: string;
  basedOnMetrics: TaskLog[];
}

// Symptom pattern analysis
export interface SymptomPattern {
  userId: string;
  patternType: 'increasing' | 'decreasing' | 'fluctuating' | 'stable';
  symptomType: 'pain' | 'fatigue' | 'energy' | 'mood';
  severity: 'mild' | 'moderate' | 'severe';
  timeframe: 'day' | 'week' | 'month';
  description: string;
  relatedFactors?: string[];
  confidence: number;
}

// AI insight generation
export interface AIInsight {
  userId: string;
  title: string;
  description: string;
  insightType: 'correlation' | 'trend' | 'recommendation' | 'warning';
  relevantData: {
    taskLogs?: TaskLog[];
    reflecties?: Reflectie[];
    patterns?: SymptomPattern[];
    painScores?: Array<{ score: number | undefined | null; date: Date }>;
    fatigueScores?: Array<{ score: number | undefined | null; date: Date }>;
    avgFatigue?: number;
    taskType?: string;
    avgPainBefore?: number;
    avgPainAfter?: number;
    painDiff?: number;
    avgFatigueBefore?: number;
    avgFatigueAfter?: number;
    fatigueDiff?: number;
    avgPainLong?: number;
    avgPainShort?: number;
    longTasksCount?: number;
    shortTasksCount?: number;
    avgPainMorning?: number;
    avgPainAfternoon?: number;
    [key: string]: any; // Allow for additional properties
  };
  suggestedActions?: string[];
  confidence: number;
}

// AI analysis request
export interface AIAnalysisRequest {
  userId: string;
  analysisType: 'task_suggestion' | 'symptom_pattern' | 'insight_generation';
  timeframe?: 'day' | 'week' | 'month';
  includeData?: {
    taskLogs?: boolean;
    reflecties?: boolean;
    profile?: boolean;
  };
}

// AI analysis response
export interface AIAnalysisResponse {
  userId: string;
  analysisType: string;
  results: {
    taskSuggestions?: TaskSuggestion[];
    symptomPatterns?: SymptomPattern[];
    insights?: AIInsight[];
  };
  processingTime?: number;
  timestamp: Date;
}
