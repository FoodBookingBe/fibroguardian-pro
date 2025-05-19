-- FibroGuardian Database Fix Script (Vereenvoudigd)
-- Dit script lost de belangrijkste problemen op in de Supabase database:
-- 1. Voegt pijn_score en vermoeidheid_score velden toe aan de reflecties tabel
-- 2. Verwijdert dubbele RLS policies
-- 3. Voegt ontbrekende indexes toe

-- ===== STAP 1: Voeg ontbrekende velden toe aan de reflecties tabel =====

-- Voeg pijn_score toe als deze nog niet bestaat
ALTER TABLE reflecties 
ADD COLUMN IF NOT EXISTS pijn_score integer CHECK (pijn_score BETWEEN 1 AND 20);

-- Voeg vermoeidheid_score toe als deze nog niet bestaat
ALTER TABLE reflecties 
ADD COLUMN IF NOT EXISTS vermoeidheid_score integer CHECK (vermoeidheid_score BETWEEN 1 AND 20);

-- ===== STAP 2: Verwijder alle RLS policies voor reflecties en maak ze opnieuw aan =====

-- Verwijder bestaande policies voor reflecties
DROP POLICY IF EXISTS "Reflecties_policy" ON reflecties;
DROP POLICY IF EXISTS "Reflecties_insert_policy" ON reflecties;
DROP POLICY IF EXISTS "Reflecties_update_policy" ON reflecties;
DROP POLICY IF EXISTS "Reflecties_delete_policy" ON reflecties;

-- Maak de correcte policies opnieuw aan
CREATE POLICY "Reflecties_policy"
ON reflecties
FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM specialist_patienten
    WHERE specialist_id = auth.uid()
    AND patient_id = user_id
    AND 'view_reflecties' = ANY(toegangsrechten)
  )
  OR public.is_admin()
);

CREATE POLICY "Reflecties_insert_policy"
ON reflecties
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  OR public.is_admin()
);

CREATE POLICY "Reflecties_update_policy"
ON reflecties
FOR UPDATE
USING (
  auth.uid() = user_id
  OR public.is_admin()
);

CREATE POLICY "Reflecties_delete_policy"
ON reflecties
FOR DELETE
USING (
  auth.uid() = user_id
  OR public.is_admin()
);

-- ===== STAP 3: Voeg ontbrekende indexes toe =====

-- Basis indexes voor performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_task_logs_user_id ON task_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_task_logs_task_id ON task_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_planning_user_id_datum ON planning(user_id, datum);
CREATE INDEX IF NOT EXISTS idx_specialist_patienten_specialist_id ON specialist_patienten(specialist_id);
CREATE INDEX IF NOT EXISTS idx_specialist_patienten_patient_id ON specialist_patienten(patient_id);
CREATE INDEX IF NOT EXISTS idx_inzichten_user_id ON inzichten(user_id);

-- Aanvullende indexes voor efficiëntere queries
CREATE INDEX IF NOT EXISTS idx_profiles_type ON profiles(type);
CREATE INDEX IF NOT EXISTS idx_task_logs_start_tijd ON task_logs(start_tijd);
CREATE INDEX IF NOT EXISTS idx_task_logs_user_id_start_tijd ON task_logs(user_id, start_tijd);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id_type ON tasks(user_id, type);

-- ===== STAP 4: Verificatie queries =====

-- Controleer of de pijn_score en vermoeidheid_score velden bestaan in de reflecties tabel
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'reflecties' 
AND column_name IN ('pijn_score', 'vermoeidheid_score');

-- Toon alle RLS policies voor de reflecties tabel
SELECT * FROM pg_policies WHERE tablename = 'reflecties';

-- Toon alle aangemaakte indexes
SELECT 
  tablename, 
  indexname, 
  indexdef 
FROM 
  pg_indexes 
WHERE 
  schemaname = 'public' 
ORDER BY 
  tablename, indexname;
