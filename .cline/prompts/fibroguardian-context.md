# FibroGuardian Pro Development Context

## Project Overview
- **Purpose**: Intelligent fibromyalgia management platform
- **Tech Stack**: Next.js 14, TypeScript, Supabase, TanStack Query
- **AI Integration**: OpenAI GPT-4, custom ML models
- **Target Users**: Fibromyalgia patients, medical specialists

## Database Schema Summary
- `profiles`: User profiles (patients, specialists, admins)
- `task_logs`: Activity tracking with pain/energy scores
- `reflecties`: Daily symptom reflections
- `expert_knowledge`: Clinical knowledge base for AI
- `ai_recommendations`: AI-generated user recommendations
- `specialist_patienten`: Patient-specialist relationships

## Development Rules
1. **Type Safety First**: Always use typed Supabase client
2. **Clinical Safety**: Validate all health-related data
3. **Performance**: Optimize for low-energy users (simple UI)
4. **Privacy**: Implement proper RLS and data encryption
5. **Accessibility**: WCAG 2.1 AA compliance minimum

## Common Patterns
```typescript
// Always use this pattern for database operations
const { typedQuery } = useTypedSupabase();
const data = await typedQuery.taskLogs.getByUser(userId);

// Always include loading and error states
const { data, isLoading, error } = useQuery({
  queryKey: ['key'],
  queryFn: () => fetchFunction()
});

// Always validate with Zod before database operations
const validatedData = TaskLogInsertSchema.parse(formData);
```

## AI Recommendations Guidelines
- Confidence score must be > 0.7 for automatic actions
- Include clinical reasoning in recommendations
- Consider patient's current energy/pain levels
- Provide fallback options for rejected recommendations
