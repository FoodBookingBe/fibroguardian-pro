-- FibroGuardian Database Fix Script
-- Dit script lost alle bekende problemen op in de Supabase database:
-- 1. Voegt pijn_score en vermoeidheid_score velden toe aan de reflecties tabel
-- 2. Verwijdert dubbele RLS policies
-- 3. Voegt ontbrekende indexes toe

-- Begin een transactie zodat alle wijzigingen als één geheel worden uitgevoerd
BEGIN;

-- ===== STAP 1: Voeg ontbrekende velden toe aan de reflecties tabel =====
DO $$
BEGIN
  -- Controleer of de kolommen al bestaan voordat we ze toevoegen
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reflecties' AND column_name = 'pijn_score') THEN
    ALTER TABLE reflecties 
    ADD COLUMN pijn_score integer CHECK (pijn_score BETWEEN 1 AND 20);
    
    RAISE NOTICE 'Kolom pijn_score toegevoegd aan reflecties tabel';
  ELSE
    RAISE NOTICE 'Kolom pijn_score bestaat al in reflecties tabel';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reflecties' AND column_name = 'vermoeidheid_score') THEN
    ALTER TABLE reflecties 
    ADD COLUMN vermoeidheid_score integer CHECK (vermoeidheid_score BETWEEN 1 AND 20);
    
    RAISE NOTICE 'Kolom vermoeidheid_score toegevoegd aan reflecties tabel';
  ELSE
    RAISE NOTICE 'Kolom vermoeidheid_score bestaat al in reflecties tabel';
  END IF;
END $$;

-- ===== STAP 2: Verwijder dubbele RLS policies =====
DO $$
DECLARE
  policy_record RECORD;
  drop_statement TEXT;
BEGIN
  -- Identificeer en verwijder dubbele RLS policies
  FOR policy_record IN 
    WITH duplicate_policies AS (
      SELECT 
        tablename, 
        policyname, 
        COUNT(*) as policy_count
      FROM 
        pg_policies 
      GROUP BY 
        tablename, policyname
      HAVING 
        COUNT(*) > 1
    )
    SELECT 
      'DROP POLICY IF EXISTS ' || policyname || ' ON ' || tablename || ';' as drop_statement,
      tablename,
      policyname
    FROM 
      duplicate_policies
  LOOP
    drop_statement := policy_record.drop_statement;
    EXECUTE drop_statement;
    RAISE NOTICE 'Dubbele policy verwijderd: % op tabel %', policy_record.policyname, policy_record.tablename;
  END LOOP;
END $$;

-- ===== STAP 3: Zorg ervoor dat alle RLS policies voor reflecties correct zijn =====
-- Verwijder eerst alle bestaande policies voor reflecties om schoon te beginnen
DROP POLICY IF EXISTS "Reflecties_policy" ON reflecties;
DROP POLICY IF EXISTS "Reflecties_insert_policy" ON reflecties;
DROP POLICY IF EXISTS "Reflecties_update_policy" ON reflecties;
DROP POLICY IF EXISTS "Reflecties_delete_policy" ON reflecties;

-- Maak de correcte policies opnieuw aan
CREATE POLICY "Reflecties_policy"
ON reflecties
FOR SELECT
USING (
  (SELECT auth.uid()) = user_id
  OR EXISTS (
    SELECT 1 FROM specialist_patienten
    WHERE specialist_id = (SELECT auth.uid())
    AND patient_id = user_id
    AND 'view_reflecties' = ANY(toegangsrechten)
  )
  OR (SELECT public.is_admin())
);

CREATE POLICY "Reflecties_insert_policy"
ON reflecties
FOR INSERT
WITH CHECK (
  (SELECT auth.uid()) = user_id
  OR (SELECT public.is_admin())
);

CREATE POLICY "Reflecties_update_policy"
ON reflecties
FOR UPDATE
USING (
  (SELECT auth.uid()) = user_id
  OR (SELECT public.is_admin())
);

CREATE POLICY "Reflecties_delete_policy"
ON reflecties
FOR DELETE
USING (
  (SELECT auth.uid()) = user_id
  OR (SELECT public.is_admin())
);

-- ===== STAP 4: Voeg ontbrekende indexes toe =====
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

-- Controleer of de materialized view bestaat voordat we een index aanmaken
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM pg_matviews 
    WHERE matviewname = 'patient_activity_summary'
  ) THEN
    -- Probeer de unieke index aan te maken als de view bestaat
    BEGIN
      CREATE UNIQUE INDEX IF NOT EXISTS idx_patient_activity_summary 
      ON patient_activity_summary(user_id, activity_date);
      
      RAISE NOTICE 'Unieke index aangemaakt op patient_activity_summary';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Kon geen unieke index aanmaken op patient_activity_summary: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'Materialized view patient_activity_summary bestaat niet, index wordt overgeslagen';
  END IF;
END $$;

-- ===== STAP 5: Controleer of de is_admin functie bestaat en maak deze aan indien nodig =====
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_proc 
    WHERE proname = 'is_admin' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    -- Maak de is_admin functie aan als deze niet bestaat
    EXECUTE '
    CREATE OR REPLACE FUNCTION public.is_admin()
    RETURNS boolean
    LANGUAGE sql
    SECURITY DEFINER
    SET search_path = public
    AS $$
      SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = (SELECT auth.uid()) AND type = ''admin''
      );
    $$;
    ';
    
    RAISE NOTICE 'Functie is_admin aangemaakt';
  ELSE
    RAISE NOTICE 'Functie is_admin bestaat al';
  END IF;
END $$;

-- ===== STAP 6: Controleer of de update_updated_at functie bestaat en maak deze aan indien nodig =====
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_proc 
    WHERE proname = 'update_updated_at' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    -- Maak de update_updated_at functie aan als deze niet bestaat
    EXECUTE '
    CREATE OR REPLACE FUNCTION update_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    ';
    
    RAISE NOTICE 'Functie update_updated_at aangemaakt';
  ELSE
    RAISE NOTICE 'Functie update_updated_at bestaat al';
  END IF;
END $$;

-- ===== STAP 7: Controleer of de triggers bestaan en maak deze aan indien nodig =====
DO $$
BEGIN
  -- Controleer en maak de tasks_updated_at trigger aan
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_trigger 
    WHERE tgname = 'tasks_updated_at'
  ) THEN
    CREATE TRIGGER tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    
    RAISE NOTICE 'Trigger tasks_updated_at aangemaakt';
  ELSE
    RAISE NOTICE 'Trigger tasks_updated_at bestaat al';
  END IF;
  
  -- Controleer en maak de planning_updated_at trigger aan
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_trigger 
    WHERE tgname = 'planning_updated_at'
  ) THEN
    CREATE TRIGGER planning_updated_at
    BEFORE UPDATE ON planning
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    
    RAISE NOTICE 'Trigger planning_updated_at aangemaakt';
  ELSE
    RAISE NOTICE 'Trigger planning_updated_at bestaat al';
  END IF;
  
  -- Controleer en maak de profiles_updated_at trigger aan
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_trigger 
    WHERE tgname = 'profiles_updated_at'
  ) THEN
    CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    
    RAISE NOTICE 'Trigger profiles_updated_at aangemaakt';
  ELSE
    RAISE NOTICE 'Trigger profiles_updated_at bestaat al';
  END IF;
  
  -- Controleer en maak de abonnementen_updated_at trigger aan
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_trigger 
    WHERE tgname = 'abonnementen_updated_at'
  ) THEN
    CREATE TRIGGER abonnementen_updated_at
    BEFORE UPDATE ON abonnementen
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    
    RAISE NOTICE 'Trigger abonnementen_updated_at aangemaakt';
  ELSE
    RAISE NOTICE 'Trigger abonnementen_updated_at bestaat al';
  END IF;
END $$;

-- Commit de transactie
COMMIT;

-- ===== STAP 8: Verificatie queries =====
-- Deze queries worden buiten de transactie uitgevoerd om de resultaten te tonen

-- Controleer of de pijn_score en vermoeidheid_score velden bestaan in de reflecties tabel
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'reflecties' 
AND column_name IN ('pijn_score', 'vermoeidheid_score');

-- Controleer of er nog dubbele RLS policies zijn
WITH duplicate_policies AS (
  SELECT 
    tablename, 
    policyname, 
    COUNT(*) as policy_count
  FROM 
    pg_policies 
  GROUP BY 
    tablename, policyname
  HAVING 
    COUNT(*) > 1
)
SELECT * FROM duplicate_policies;

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
