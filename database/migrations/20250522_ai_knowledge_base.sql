-- Migration: AI Knowledge Base Tables
-- Description: Creates tables for AI expert knowledge and recommendations
-- Date: 2025-05-22

-- Create expert_knowledge table for storing specialist-provided knowledge
CREATE TABLE IF NOT EXISTS expert_knowledge (
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

-- Create ai_recommendations table for storing AI-generated recommendations
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users,
  context_type text CHECK (context_type IN ('task_suggestion', 'symptom_alert', 'pattern_insight')),
  recommendation_text text NOT NULL,
  confidence_score float,
  source_knowledge_ids uuid[],
  is_dismissed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Add Row Level Security (RLS) policies for expert_knowledge
ALTER TABLE expert_knowledge ENABLE ROW LEVEL SECURITY;

-- Specialists can view and edit their own knowledge entries
CREATE POLICY specialist_knowledge_crud ON expert_knowledge
  FOR ALL
  TO authenticated
  USING (specialist_id = auth.uid() OR is_approved = true)
  WITH CHECK (specialist_id = auth.uid());

-- Admins can view and edit all knowledge entries
CREATE POLICY admin_knowledge_crud ON expert_knowledge
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.type = 'admin'
    )
  );

-- Add Row Level Security (RLS) policies for ai_recommendations
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;

-- Users can view and update (dismiss) their own recommendations
CREATE POLICY user_recommendations_crud ON ai_recommendations
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Specialists can view recommendations for their patients
CREATE POLICY specialist_view_patient_recommendations ON ai_recommendations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM specialist_patienten
      WHERE specialist_patienten.specialist_id = auth.uid()
      AND specialist_patienten.patient_id = ai_recommendations.user_id
    )
  );

-- Admins can view all recommendations
CREATE POLICY admin_view_all_recommendations ON ai_recommendations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.type = 'admin'
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS expert_knowledge_specialist_id_idx ON expert_knowledge(specialist_id);
CREATE INDEX IF NOT EXISTS expert_knowledge_content_type_idx ON expert_knowledge(content_type);
CREATE INDEX IF NOT EXISTS expert_knowledge_tags_idx ON expert_knowledge USING GIN(tags);
CREATE INDEX IF NOT EXISTS expert_knowledge_is_approved_idx ON expert_knowledge(is_approved);

CREATE INDEX IF NOT EXISTS ai_recommendations_user_id_idx ON ai_recommendations(user_id);
CREATE INDEX IF NOT EXISTS ai_recommendations_context_type_idx ON ai_recommendations(context_type);
CREATE INDEX IF NOT EXISTS ai_recommendations_is_dismissed_idx ON ai_recommendations(is_dismissed);
CREATE INDEX IF NOT EXISTS ai_recommendations_created_at_idx ON ai_recommendations(created_at);
