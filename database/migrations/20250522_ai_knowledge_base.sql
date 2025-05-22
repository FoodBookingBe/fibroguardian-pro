-- Migration: AI Knowledge Base Tables
-- Description: Creates tables for AI expert knowledge and recommendations
-- Date: 2025-05-22

-- Create expert_knowledge table for storing specialist-provided knowledge
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'expert_knowledge')
BEGIN
    CREATE TABLE expert_knowledge (
        id UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
        specialist_id UNIQUEIDENTIFIER,
        content_type NVARCHAR(50) CONSTRAINT CK_expert_knowledge_content_type CHECK (content_type IN ('article', 'guideline', 'recommendation')),
        title NVARCHAR(MAX) NOT NULL,
        content NVARCHAR(MAX) NOT NULL,
        tags NVARCHAR(MAX), -- Stored as JSON array
        metadata NVARCHAR(MAX), -- Stored as JSON
        is_approved BIT DEFAULT 0,
        created_at DATETIMEOFFSET DEFAULT GETUTCDATE()
    );

    -- Add foreign key constraint
    ALTER TABLE expert_knowledge ADD CONSTRAINT FK_expert_knowledge_specialist_id
    FOREIGN KEY (specialist_id) REFERENCES [auth].[users](id);
END;

-- Create ai_recommendations table for storing AI-generated recommendations
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ai_recommendations')
BEGIN
    CREATE TABLE ai_recommendations (
        id UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
        user_id UNIQUEIDENTIFIER,
        context_type NVARCHAR(50) CONSTRAINT CK_ai_recommendations_context_type CHECK (context_type IN ('task_suggestion', 'symptom_alert', 'pattern_insight')),
        recommendation_text NVARCHAR(MAX) NOT NULL,
        confidence_score FLOAT,
        source_knowledge_ids NVARCHAR(MAX), -- Stored as JSON array of UUIDs
        is_dismissed BIT DEFAULT 0,
        created_at DATETIMEOFFSET DEFAULT GETUTCDATE()
    );

    -- Add foreign key constraint
    ALTER TABLE ai_recommendations ADD CONSTRAINT FK_ai_recommendations_user_id
    FOREIGN KEY (user_id) REFERENCES [auth].[users](id);
END;

-- Security implementation using views and stored procedures instead of RLS
-- Note: In MSSQL, we would typically implement security through views, stored procedures,
-- and application-level security rather than PostgreSQL's Row Level Security.
-- The following comments outline the security requirements that should be implemented
-- in the application layer or through stored procedures:

/*
Security requirements for expert_knowledge:
1. Specialists can view and edit their own knowledge entries
2. All authenticated users can view approved knowledge entries
3. Admins can view and edit all knowledge entries

Security requirements for ai_recommendations:
1. Users can view and update (dismiss) their own recommendations
2. Specialists can view recommendations for their patients
3. Admins can view all recommendations
*/

-- Create indexes for performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_expert_knowledge_specialist_id')
    CREATE INDEX IX_expert_knowledge_specialist_id ON expert_knowledge(specialist_id);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_expert_knowledge_content_type')
    CREATE INDEX IX_expert_knowledge_content_type ON expert_knowledge(content_type);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_expert_knowledge_is_approved')
    CREATE INDEX IX_expert_knowledge_is_approved ON expert_knowledge(is_approved);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ai_recommendations_user_id')
    CREATE INDEX IX_ai_recommendations_user_id ON ai_recommendations(user_id);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ai_recommendations_context_type')
    CREATE INDEX IX_ai_recommendations_context_type ON ai_recommendations(context_type);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ai_recommendations_is_dismissed')
    CREATE INDEX IX_ai_recommendations_is_dismissed ON ai_recommendations(is_dismissed);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ai_recommendations_created_at')
    CREATE INDEX IX_ai_recommendations_created_at ON ai_recommendations(created_at);

-- Note: For the tags field in expert_knowledge, which was originally a text[] in PostgreSQL,
-- we're now storing it as NVARCHAR(MAX) containing a JSON array. To search within this JSON array,
-- you would use JSON functions in SQL Server 2016+ or implement custom search logic.
