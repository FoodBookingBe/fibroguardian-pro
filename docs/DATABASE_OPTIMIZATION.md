# Database Optimization Guide

This document provides guidance on optimizing the FibroGuardian Pro database for performance, integrity, and AI integration.

## Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Optimization Techniques](#optimization-techniques)
4. [AI Integration](#ai-integration)
5. [Maintenance Scripts](#maintenance-scripts)
6. [Best Practices](#best-practices)

## Overview

FibroGuardian Pro uses Supabase (PostgreSQL) as its database backend. The database is structured to support:

- User authentication and profiles
- Task management and logging
- Daily reflections and symptom tracking
- Specialist-patient relationships
- AI recommendations and knowledge base

This guide explains how to keep the database optimized and in sync with the codebase.

## Database Schema

### Core Tables

- **profiles**: User profiles with personal information
- **tasks**: Tasks and assignments for patients
- **task_logs**: Execution logs for tasks with health metrics
- **reflecties**: Daily reflections and symptom tracking
- **specialist_patienten**: Relationships between specialists and patients
- **inzichten**: Insights generated from user data
- **abonnementen**: Subscription information

### AI-Related Tables

- **expert_knowledge**: Knowledge base for AI recommendations
- **ai_recommendations**: AI-generated recommendations for users

## Optimization Techniques

### Indexes

We've added indexes to improve query performance:

```sql
-- Example indexes for task_logs
CREATE INDEX task_logs_user_id_idx ON task_logs(user_id);
CREATE INDEX task_logs_task_id_idx ON task_logs(task_id);
CREATE INDEX task_logs_start_tijd_idx ON task_logs(start_tijd);
```

Indexes are particularly important for:
- Foreign key relationships (e.g., user_id, task_id)
- Frequently filtered fields (e.g., type, datum)
- Fields used in sorting (e.g., created_at)

### Constraints

Data integrity is enforced through constraints:

```sql
-- Example constraints for task_logs
ALTER TABLE task_logs ADD CONSTRAINT task_logs_energie_voor_range 
  CHECK (energie_voor >= 0 AND energie_voor <= 10);
```

These constraints ensure:
- Score ranges are valid (0-10)
- Required fields are present
- Enumerated values are valid

### Query Optimization

Optimized queries have been created for common operations:

```sql
-- Example optimized query for patient activity
SELECT
  p.id AS patient_id,
  COUNT(DISTINCT tl.id) AS task_log_count,
  AVG(tl.pijn_score) AS avg_pijn_score
FROM
  profiles p
LEFT JOIN
  task_logs tl ON p.id = tl.user_id
WHERE
  p.type = 'patient'
GROUP BY
  p.id;
```

## AI Integration

The AI system is integrated with the database through:

1. **Knowledge Base**: The `expert_knowledge` table stores specialist-provided information
2. **Recommendations**: The `ai_recommendations` table stores AI-generated suggestions
3. **Pattern Recognition**: AI analyzes `task_logs` and `reflecties` to identify patterns

### AI Knowledge Base Schema

```sql
CREATE TABLE expert_knowledge (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  specialist_id uuid REFERENCES auth.users,
  content_type text CHECK (content_type IN ('article', 'guideline', 'recommendation')),
  title text NOT NULL,
  content text NOT NULL,
  tags text[],
  metadata jsonb,
  is_approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
```

### AI Recommendations Schema

```sql
CREATE TABLE ai_recommendations (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users,
  context_type text CHECK (context_type IN ('task_suggestion', 'symptom_alert', 'pattern_insight')),
  recommendation_text text NOT NULL,
  confidence_score float,
  source_knowledge_ids uuid[],
  is_dismissed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
```

## Maintenance Scripts

### Environment Setup

The database optimization script uses environment variables from the `.env.local` file. This file should already exist in your project with the necessary Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> **Important**: The `SUPABASE_SERVICE_ROLE_KEY` is required for the database optimization script to work. This key has admin privileges, so keep it secure and never expose it in client-side code.

If you need to create a new `.env.local` file, you can copy from the `.env.example` template:
```bash
cp .env.example .env.local
```

Then update the values with your actual Supabase credentials.

### Database Optimization Script

We've created a script to optimize the database:

```bash
npm run db:optimize
```

This script:
1. Runs all migration files
2. Verifies the database schema against TypeScript types
3. Optimizes database performance by analyzing tables

The script has two modes:

#### Development Mode (Default)

In development mode, the script simulates the operations without actually executing them:

```bash
npm run db:optimize
```

This is useful for testing and previewing what would happen in production.

#### Production Mode

The script includes a production mode, but due to Supabase API limitations, it cannot directly execute SQL statements through the REST API:

```bash
npm run db:optimize:prod
```

In production mode, the script will:
1. Attempt to execute SQL statements (but will likely encounter permission errors)
2. Verify that all expected tables exist in the database
3. Attempt to run ANALYZE on all tables

> **Important**: For actual production database changes, you should:
> 1. Use the Supabase dashboard SQL editor to run the migration scripts
> 2. Use the Supabase CLI to run migrations: `supabase migration up`
> 3. Create a database function that can execute SQL (requires admin privileges)
>
> Always back up your database before making changes in production.

### Migration Script

To run database migrations:

```bash
npm run db:migrate
```

This applies all pending migrations in the `database/migrations` directory.

## Best Practices

### 1. Keep Types in Sync

Ensure TypeScript types in `types/database.ts` match the database schema:

```typescript
export interface Database {
  public: {
    Tables: {
      expert_knowledge: {
        Row: {
          id: string;
          specialist_id: string;
          // ...other fields
        };
        // ...Insert and Update types
      };
      // ...other tables
    };
  };
}
```

### 2. Use Zod Schemas for Validation

Create Zod schemas for all database operations:

```typescript
export const createExpertKnowledgeSchema = z.object({
  specialist_id: z.string().uuid(),
  content_type: z.enum(['article', 'guideline', 'recommendation']),
  // ...other fields
});
```

### 3. Regular Maintenance

Schedule regular maintenance:

- Run `npm run db:optimize` weekly
- Check for unused indexes
- Monitor query performance
- Update statistics with `ANALYZE`

### 4. Connection Pooling

For production, configure connection pooling:

- Set appropriate pool size based on load
- Set statement timeout to prevent long-running queries
- Configure idle connection timeout

## Conclusion

By following these optimization techniques and maintenance procedures, FibroGuardian Pro's database will remain performant, consistent, and reliable as the application scales.
