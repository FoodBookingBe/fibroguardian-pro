-- Migration: Database Optimization
-- Description: Optimizes database performance and ensures data integrity
-- Date: 2025-05-22

-- =============================================
-- PART 1: INDEXES FOR PERFORMANCE OPTIMIZATION
-- =============================================

-- Add indexes to task_logs table for faster queries
CREATE INDEX task_logs_user_id_idx ON task_logs(user_id);
CREATE INDEX task_logs_task_id_idx ON task_logs(task_id);
CREATE INDEX task_logs_start_tijd_idx ON task_logs(start_tijd);

-- Add indexes to reflecties table for faster queries
CREATE INDEX reflecties_user_id_idx ON reflecties(user_id);
CREATE INDEX reflecties_datum_idx ON reflecties(datum);

-- Add indexes to tasks table for faster queries
CREATE INDEX tasks_user_id_idx ON tasks(user_id);
CREATE INDEX tasks_specialist_id_idx ON tasks(specialist_id);
CREATE INDEX tasks_type_idx ON tasks(type);

-- Add indexes to profiles table for faster queries
CREATE INDEX profiles_type_idx ON profiles(type);

-- Add indexes to specialist_patienten table for faster queries
CREATE INDEX specialist_patienten_specialist_id_idx ON specialist_patienten(specialist_id);
CREATE INDEX specialist_patienten_patient_id_idx ON specialist_patienten(patient_id);

-- Add indexes to expert_knowledge table for faster queries
CREATE INDEX expert_knowledge_specialist_id_idx ON expert_knowledge(specialist_id);
CREATE INDEX expert_knowledge_content_type_idx ON expert_knowledge(content_type);
CREATE INDEX expert_knowledge_is_approved_idx ON expert_knowledge(is_approved);

-- Add indexes to ai_recommendations table for faster queries
CREATE INDEX ai_recommendations_user_id_idx ON ai_recommendations(user_id);
CREATE INDEX ai_recommendations_context_type_idx ON ai_recommendations(context_type);
CREATE INDEX ai_recommendations_is_dismissed_idx ON ai_recommendations(is_dismissed);

-- =============================================
-- PART 2: CONSTRAINTS FOR DATA INTEGRITY
-- =============================================

-- Add check constraints to task_logs table
ALTER TABLE task_logs ADD CONSTRAINT task_logs_energie_voor_range CHECK (energie_voor >= 0 AND energie_voor <= 10);
ALTER TABLE task_logs ADD CONSTRAINT task_logs_energie_na_range CHECK (energie_na >= 0 AND energie_na <= 10);
ALTER TABLE task_logs ADD CONSTRAINT task_logs_pijn_score_range CHECK (pijn_score >= 0 AND pijn_score <= 10);

-- Add check constraints to reflecties table
ALTER TABLE reflecties ADD CONSTRAINT reflecties_pijn_score_range CHECK (pijn_score >= 0 AND pijn_score <= 10);
ALTER TABLE reflecties ADD CONSTRAINT reflecties_vermoeidheid_score_range CHECK (vermoeidheid_score >= 0 AND vermoeidheid_score <= 10);

-- Add check constraints to tasks table
ALTER TABLE tasks ADD CONSTRAINT tasks_duur_positive CHECK (duur > 0);
ALTER TABLE tasks ADD CONSTRAINT tasks_hartslag_doel_positive CHECK (hartslag_doel > 0);

-- Add check constraints to profiles table
ALTER TABLE profiles ADD CONSTRAINT profiles_type_valid CHECK (type IN ('patient', 'specialist', 'admin'));

-- =============================================
-- PART 3: OPTIMIZE QUERIES
-- =============================================

-- Create optimized query for getting task logs with task titles
-- This can be used as a reference for creating a view later
/*
SELECT
  tl.*,
  t.titel AS task_titel,
  t.type AS task_type
FROM
  task_logs tl
LEFT JOIN
  tasks t ON tl.task_id = t.id;
*/

-- Create optimized query for getting patient activity summary
-- This can be used as a reference for creating a view later
/*
SELECT
  p.id AS patient_id,
  p.voornaam,
  p.achternaam,
  COUNT(DISTINCT tl.id) AS task_log_count,
  COUNT(DISTINCT r.id) AS reflectie_count,
  MAX(tl.start_tijd) AS last_task_log,
  MAX(r.datum) AS last_reflectie,
  AVG(tl.pijn_score) AS avg_pijn_score,
  AVG(tl.energie_voor) AS avg_energie_voor,
  AVG(tl.energie_na) AS avg_energie_na
FROM
  profiles p
LEFT JOIN
  task_logs tl ON p.id = tl.user_id
LEFT JOIN
  reflecties r ON p.id = r.user_id
WHERE
  p.type = 'patient'
GROUP BY
  p.id, p.voornaam, p.achternaam;
*/
