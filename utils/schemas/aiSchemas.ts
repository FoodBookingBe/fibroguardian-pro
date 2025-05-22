import { z } from 'zod';

// Define a Zod schema for creating a new expert knowledge entry
export const createExpertKnowledgeSchema = z.object({
  specialist_id: z.string().uuid({ message: 'Ongeldige specialist-ID (UUID).' }),
  content_type: z.enum(['article', 'guideline', 'recommendation'], {
    errorMap: () => ({ message: 'Content type moet article, guideline of recommendation zijn.' })
  }),
  title: z.string().min(1, { message: 'Titel is verplicht.' }),
  content: z.string().min(1, { message: 'Content is verplicht.' }),
  tags: z.array(z.string()).nullable().optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
  is_approved: z.boolean().default(false).optional(),
  // created_at is typically handled by the database
});

// Schema for updating an expert knowledge entry (all fields optional)
export const _updateExpertKnowledgeSchema = createExpertKnowledgeSchema.partial();

// Define a Zod schema for creating a new AI recommendation
export const createAIRecommendationSchema = z.object({
  user_id: z.string().uuid({ message: 'Ongeldige gebruikers-ID (UUID).' }),
  context_type: z.enum(['task_suggestion', 'symptom_alert', 'pattern_insight'], {
    errorMap: () => ({ message: 'Context type moet task_suggestion, symptom_alert of pattern_insight zijn.' })
  }),
  recommendation_text: z.string().min(1, { message: 'Aanbevelingstekst is verplicht.' }),
  confidence_score: z.number().min(0).max(1).nullable().optional(),
  source_knowledge_ids: z.array(z.string().uuid()).nullable().optional(),
  is_dismissed: z.boolean().default(false).optional(),
  // created_at is typically handled by the database
});

// Schema for updating an AI recommendation (all fields optional)
export const _updateAIRecommendationSchema = createAIRecommendationSchema.partial();

// Schema for dismissing an AI recommendation
export const _dismissAIRecommendationSchema = z.object({
  id: z.string().uuid({ message: 'Ongeldige aanbeveling-ID (UUID).' }),
  is_dismissed: z.literal(true)
});

// Schema for AI analysis request
export const _aiAnalysisRequestSchema = z.object({
  userId: z.string().uuid({ message: 'Ongeldige gebruikers-ID (UUID).' }),
  analysisType: z.enum(['task_suggestion', 'symptom_pattern', 'insight_generation'], {
    errorMap: () => ({ message: 'Analyse type moet task_suggestion, symptom_pattern of insight_generation zijn.' })
  }),
  timeframe: z.enum(['day', 'week', 'month']).optional(),
  includeData: z.object({
    taskLogs: z.boolean().optional(),
    reflecties: z.boolean().optional(),
    profile: z.boolean().optional()
  }).optional()
});

// Schema for task suggestion
export const _taskSuggestionSchema = z.object({
  suggestedTask: z.object({
    type: z.string().optional(),
    titel: z.string(),
    beschrijving: z.string().optional(),
    duur: z.number().int().positive().optional(),
    hartslag_doel: z.number().int().positive().optional(),
    herhaal_patroon: z.string().optional(),
    dagen_van_week: z.array(z.string()).optional(),
    metingen: z.array(z.string()).optional(),
    notities: z.string().optional(),
    labels: z.array(z.string()).optional()
  }),
  reasoning: z.string(),
  confidence: z.number().min(0).max(1),
  basedOnPatterns: z.array(z.string())
});

// Schema for task difficulty adjustment
export const _taskDifficultyAdjustmentSchema = z.object({
  taskId: z.string().uuid(),
  newDifficulty: z.number().int().min(1).max(10),
  reason: z.string(),
  basedOnMetrics: z.array(z.any()) // This would ideally reference the TaskLog schema
});

// Schema for symptom pattern
export const symptomPatternSchema = z.object({
  userId: z.string().uuid(),
  patternType: z.enum(['increasing', 'decreasing', 'fluctuating', 'stable']),
  symptomType: z.enum(['pain', 'fatigue', 'energy', 'mood']),
  severity: z.enum(['mild', 'moderate', 'severe']),
  timeframe: z.enum(['day', 'week', 'month']),
  description: z.string(),
  relatedFactors: z.array(z.string()).optional(),
  confidence: z.number().min(0).max(1)
});

// Schema for AI insight
export const _aiInsightSchema = z.object({
  userId: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  insightType: z.enum(['correlation', 'trend', 'recommendation', 'warning']),
  relevantData: z.object({
    taskLogs: z.array(z.any()).optional(), // This would ideally reference the TaskLog schema
    reflecties: z.array(z.any()).optional(), // This would ideally reference the Reflectie schema
    patterns: z.array(symptomPatternSchema).optional()
  }),
  suggestedActions: z.array(z.string()).optional(),
  confidence: z.number().min(0).max(1)
});
