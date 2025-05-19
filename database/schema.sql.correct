-- FibroGuardian Database Schema (Gecorrigeerde Versie)
-- Dit script bevat een volledig gecorrigeerd schema voor de FibroGuardian database
-- Het lost de volgende problemen op:
-- 1. Duplicatie van tabeldefinities
-- 2. Duplicatie van triggers
-- 3. Functiedefinitie problemen
-- 4. Onvolledige materialized view
-- 5. Volgordeproblemen

-- Begin transactie voor atomische uitvoering
BEGIN;

-- ===== STAP 1: VERWIJDER BESTAANDE OBJECTEN =====

-- Verwijder materialized view
DROP MATERIALIZED VIEW IF EXISTS patient_activity_summary CASCADE;

-- Verwijder alle functies met CASCADE om afhankelijkheden op te lossen
DROP FUNCTION IF EXISTS public.refresh_activity_summary() CASCADE;
DROP FUNCTION IF EXISTS public.create_patient_account(TEXT, TEXT, JSONB, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.update_profile_for_owner(UUID, JSONB, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.create_task_log_for_owner(JSONB, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_id_by_email(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.update_task_log_for_owner(UUID, JSONB, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_profile_for_owner(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.create_task_with_owner(JSONB, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.create_profile_for_new_user() CASCADE;

-- Verwijder tabellen met CASCADE
-- Dit zal automatisch alle afhankelijke triggers verwijderen
DROP TABLE IF EXISTS task_logs CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS planning CASCADE;
DROP TABLE IF EXISTS reflecties CASCADE;
DROP TABLE IF EXISTS inzichten CASCADE;
DROP TABLE IF EXISTS specialist_patienten CASCADE;
DROP TABLE IF EXISTS abonnementen CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Verwijder eventuele overgebleven triggers
-- Deze stap is meestal niet nodig omdat CASCADE hierboven de triggers al verwijdert
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;

-- ===== STAP 2: DEFINIEER BASISFUNCTIES =====

-- Functie voor automatische timestamp update
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- ===== STAP 3: MAAK TABELLEN AAN =====

-- 1. User profile extension
CREATE TABLE profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  voornaam text,
  achternaam text,
  avatar_url text,
  type text CHECK (type IN ('patient', 'specialist', 'admin')) DEFAULT 'patient',
  postcode text,
  gemeente text,
  geboortedatum date,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 2. Tasks and assignments
CREATE TABLE tasks (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  type text CHECK (type IN ('taak', 'opdracht')) NOT NULL,
  titel text NOT NULL,
  beschrijving text,
  duur integer, -- in minutes
  hartslag_doel integer,
  herhaal_patroon text CHECK (herhaal_patroon IN ('eenmalig', 'dagelijks', 'wekelijks', 'maandelijks', 'aangepast')),
  dagen_van_week text[],
  metingen text[],
  notities text,
  labels text[],
  specialist_id uuid REFERENCES auth.users,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 3. Logs of executed tasks
CREATE TABLE task_logs (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id uuid REFERENCES tasks ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  start_tijd timestamptz NOT NULL,
  eind_tijd timestamptz,
  energie_voor integer CHECK (energie_voor BETWEEN 1 AND 20),
  energie_na integer CHECK (energie_na BETWEEN 1 AND 20),
  pijn_score integer CHECK (pijn_score BETWEEN 1 AND 20),
  vermoeidheid_score integer CHECK (vermoeidheid_score BETWEEN 1 AND 20),
  stemming text,
  hartslag integer,
  notitie text,
  ai_validatie text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 4. Daily planning
CREATE TABLE planning (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  datum date NOT NULL,
  task_ids uuid[],
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 5. Reflections
CREATE TABLE reflecties (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  datum date NOT NULL,
  stemming text,
  notitie text,
  ai_validatie text,
  pijn_score integer CHECK (pijn_score BETWEEN 1 AND 20),
  vermoeidheid_score integer CHECK (vermoeidheid_score BETWEEN 1 AND 20),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 6. Specialist-patient relationships
CREATE TABLE specialist_patienten (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  specialist_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  patient_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  toegangsrechten text[] DEFAULT array['view_tasks', 'view_logs', 'create_tasks'],
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(specialist_id, patient_id)
);

-- 7. AI-generated insights
CREATE TABLE inzichten (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  periode text CHECK (periode IN ('dag', 'week', 'maand')) NOT NULL,
  trend_type text,
  beschrijving text NOT NULL,
  gegenereerd_door_ai boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 8. Subscriptions for specialists
CREATE TABLE abonnementen (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan_type text CHECK (plan_type IN ('basis', 'premium', 'enterprise')),
  max_patienten integer,
  verloopt_op timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- ===== STAP 4: MAAK TRIGGERS AAN =====

-- Triggers voor automatische timestamp update
CREATE TRIGGER tasks_updated_at
BEFORE UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER planning_updated_at
BEFORE UPDATE ON planning
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER abonnementen_updated_at
BEFORE UPDATE ON abonnementen
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ===== STAP 5: DEFINIEER OVERIGE FUNCTIES DIE TABELLEN GEBRUIKEN =====

-- Functie om automatisch een profiel aan te maken voor nieuwe gebruikers
CREATE OR REPLACE FUNCTION public.create_profile_for_new_user()
RETURNS TRIGGER AS $$
DECLARE
  profile_type TEXT;
  v_voornaam TEXT;
  v_achternaam TEXT;
BEGIN
  -- Attempt to get names from raw_user_meta_data if available
  v_voornaam := COALESCE(NEW.raw_user_meta_data->>'voornaam', 'Nieuwe');
  v_achternaam := COALESCE(NEW.raw_user_meta_data->>'achternaam', 'Gebruiker');

  -- Explicitly set type for admin@foodbooking.be for this test
  IF NEW.email = 'admin@foodbooking.be' THEN
    profile_type := 'admin';
  ELSIF NEW.raw_app_meta_data IS NOT NULL AND NEW.raw_app_meta_data ? 'type' THEN
    profile_type := NEW.raw_app_meta_data->>'type';
    IF profile_type NOT IN ('patient', 'specialist', 'admin') THEN
      profile_type := 'patient';
    END IF;
  ELSE
    profile_type := 'patient';
  END IF;

  INSERT INTO public.profiles (id, type, voornaam, achternaam, created_at, updated_at)
  VALUES (
    NEW.id, 
    profile_type, 
    v_voornaam, 
    v_achternaam, 
    now(), 
    now()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Maak trigger aan die activeert bij nieuwe gebruikers
CREATE TRIGGER create_profile_on_signup
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.create_profile_for_new_user();

-- Functie om een taak aan te maken met expliciete eigenaar
CREATE OR REPLACE FUNCTION public.create_task_with_owner(
  task_data JSONB,
  owner_user_id UUID
)
RETURNS SETOF tasks
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Basic validation for required fields from JSONB
  IF NOT (task_data ? 'type' AND task_data ? 'titel') THEN
    RAISE EXCEPTION 'Task data must include "type" (text) and "titel" (text).';
  END IF;

  RETURN QUERY
  INSERT INTO public.tasks (
    user_id,
    type,
    titel,
    beschrijving,
    duur,
    hartslag_doel,
    herhaal_patroon,
    dagen_van_week,
    metingen,
    notities,
    labels,
    specialist_id
  )
  VALUES (
    owner_user_id,
    task_data->>'type',
    task_data->>'titel',
    task_data->>'beschrijving',
    (task_data->>'duur')::integer,
    (task_data->>'hartslag_doel')::integer,
    task_data->>'herhaal_patroon',
    CASE WHEN task_data->'dagen_van_week' IS NOT NULL AND jsonb_typeof(task_data->'dagen_van_week') = 'array'
         THEN ARRAY(SELECT jsonb_array_elements_text(task_data->'dagen_van_week')) ELSE NULL END,
    CASE WHEN task_data->'metingen' IS NOT NULL AND jsonb_typeof(task_data->'metingen') = 'array'
         THEN ARRAY(SELECT jsonb_array_elements_text(task_data->'metingen')) ELSE NULL END,
    task_data->>'notities',
    CASE WHEN task_data->'labels' IS NOT NULL AND jsonb_typeof(task_data->'labels') = 'array'
         THEN ARRAY(SELECT jsonb_array_elements_text(task_data->'labels')) ELSE NULL END,
    (task_data->>'specialist_id')::uuid
  )
  RETURNING *;
END;
$$ LANGUAGE plpgsql;

-- Functie om een profiel op te halen voor een specifieke eigenaar
CREATE OR REPLACE FUNCTION public.get_profile_for_owner(
  owner_user_id UUID
)
RETURNS SETOF profiles
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.profiles
  WHERE id = owner_user_id;
END;
$$ LANGUAGE plpgsql;

-- Functie om een task log bij te werken voor een specifieke eigenaar
CREATE OR REPLACE FUNCTION public.update_task_log_for_owner(
  p_log_id UUID,
  p_log_data JSONB,
  p_owner_user_id UUID
)
RETURNS SETOF task_logs
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_log task_logs;
BEGIN
  -- Check if the log exists and belongs to the owner
  SELECT * INTO target_log FROM public.task_logs WHERE id = p_log_id AND user_id = p_owner_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task log not found or user does not have permission to update. Log ID: %, User ID: %', p_log_id, p_owner_user_id;
  END IF;

  RETURN QUERY
  UPDATE public.task_logs
  SET 
    start_tijd = COALESCE((p_log_data->>'start_tijd')::timestamptz, start_tijd),
    eind_tijd = COALESCE((p_log_data->>'eind_tijd')::timestamptz, eind_tijd),
    energie_voor = COALESCE((p_log_data->>'energie_voor')::integer, energie_voor),
    energie_na = COALESCE((p_log_data->>'energie_na')::integer, energie_na),
    pijn_score = COALESCE((p_log_data->>'pijn_score')::integer, pijn_score),
    vermoeidheid_score = COALESCE((p_log_data->>'vermoeidheid_score')::integer, vermoeidheid_score),
    stemming = COALESCE(p_log_data->>'stemming', stemming),
    hartslag = COALESCE((p_log_data->>'hartslag')::integer, hartslag),
    notitie = COALESCE(p_log_data->>'notitie', notitie),
    ai_validatie = COALESCE(p_log_data->>'ai_validatie', ai_validatie)
  WHERE id = p_log_id AND user_id = p_owner_user_id
  RETURNING *;
END;
$$ LANGUAGE plpgsql;

-- Functie om een gebruikers-ID op te halen op basis van e-mail
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(p_email TEXT)
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT id FROM auth.users WHERE email = p_email LIMIT 1;
$$;

-- Functie om een task log aan te maken met expliciete eigenaar
CREATE OR REPLACE FUNCTION public.create_task_log_for_owner(
  p_log_data JSONB,
  p_owner_user_id UUID
)
RETURNS SETOF task_logs
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validation
  IF NOT (p_log_data ? 'task_id' AND p_log_data ? 'start_tijd') THEN
    RAISE EXCEPTION 'Task log data must include "task_id" (UUID) and "start_tijd" (timestamp).';
  END IF;

  -- Check if the task exists and belongs to this user or the user is a specialist for the task owner
  IF NOT EXISTS (
    SELECT 1 FROM tasks 
    WHERE id = (p_log_data->>'task_id')::uuid 
    AND (user_id = p_owner_user_id OR 
         EXISTS (SELECT 1 FROM specialist_patienten WHERE specialist_id = p_owner_user_id AND patient_id = user_id))
  ) THEN
    RAISE EXCEPTION 'Task not found or user does not have permission.';
  END IF;

  RETURN QUERY
  INSERT INTO public.task_logs (
    task_id,
    user_id,
    start_tijd,
    eind_tijd,
    energie_voor,
    energie_na,
    pijn_score,
    vermoeidheid_score,
    stemming,
    hartslag,
    notitie,
    ai_validatie
  )
  VALUES (
    (p_log_data->>'task_id')::uuid,
    p_owner_user_id,
    (p_log_data->>'start_tijd')::timestamptz,
    (p_log_data->>'eind_tijd')::timestamptz,
    (p_log_data->>'energie_voor')::integer,
    (p_log_data->>'energie_na')::integer,
    (p_log_data->>'pijn_score')::integer,
    (p_log_data->>'vermoeidheid_score')::integer,
    p_log_data->>'stemming',
    (p_log_data->>'hartslag')::integer,
    p_log_data->>'notitie',
    p_log_data->>'ai_validatie'
  )
  RETURNING *;
END;
$$ LANGUAGE plpgsql;

-- Functie om een profiel bij te werken voor eigenaar
CREATE OR REPLACE FUNCTION public.update_profile_for_owner(
  p_profile_id UUID,
  p_profile_data JSONB,
  p_owner_user_id UUID
)
RETURNS SETOF profiles
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the profile exists and belongs to the owner
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_profile_id AND id = p_owner_user_id) THEN
    RAISE EXCEPTION 'Profile not found or user does not have permission to update.';
  END IF;

  RETURN QUERY
  UPDATE public.profiles
  SET 
    voornaam = COALESCE(p_profile_data->>'voornaam', voornaam),
    achternaam = COALESCE(p_profile_data->>'achternaam', achternaam),
    avatar_url = COALESCE(p_profile_data->>'avatar_url', avatar_url),
    postcode = COALESCE(p_profile_data->>'postcode', postcode),
    gemeente = COALESCE(p_profile_data->>'gemeente', gemeente),
    geboortedatum = CASE WHEN p_profile_data->>'geboortedatum' IS NOT NULL THEN (p_profile_data->>'geboortedatum')::date ELSE geboortedatum END,
    updated_at = now()
  WHERE id = p_profile_id AND id = p_owner_user_id
  RETURNING *;
END;
$$ LANGUAGE plpgsql;

-- Functie om een patiëntaccount aan te maken door specialist
CREATE OR REPLACE FUNCTION public.create_patient_account(
  p_email TEXT,
  p_password TEXT,
  p_profile_data JSONB,
  p_specialist_id UUID
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id UUID;
  v_profile profiles;
  v_specialist_profile profiles;
  v_result JSONB;
BEGIN
  -- Check if specialist exists and has type='specialist'
  SELECT * INTO v_specialist_profile FROM profiles WHERE id = p_specialist_id AND type = 'specialist';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Specialist not found or not authorized to create patient accounts';
  END IF;

  -- Create the new user via auth.users
  INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, raw_app_meta_data)
  VALUES (
    p_email, 
    crypt(p_password, gen_salt('bf')), 
    now(),
    jsonb_build_object('type', 'patient')
  )
  RETURNING id INTO v_user_id;

  -- Create a profile for this user
  INSERT INTO profiles (
    id,
    type,
    voornaam,
    achternaam,
    postcode,
    gemeente,
    geboortedatum,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    'patient',
    p_profile_data->>'voornaam',
    p_profile_data->>'achternaam',
    p_profile_data->>'postcode',
    p_profile_data->>'gemeente',
    (p_profile_data->>'geboortedatum')::date,
    now(),
    now()
  )
  RETURNING * INTO v_profile;

  -- Create the specialist-patient relationship
  INSERT INTO specialist_patienten (specialist_id, patient_id)
  VALUES (p_specialist_id, v_user_id);

  -- Compose the result
  v_result := jsonb_build_object(
    'user_id', v_user_id,
    'email', p_email,
    'profile', row_to_json(v_profile)::jsonb
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ===== STAP 6: DEFINIEER ADMIN FUNCTIE =====

-- Helper functie om te controleren of huidige gebruiker een admin is
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND type = 'admin'
  );
$$;

-- ===== STAP 7: MAAK MATERIALIZED VIEW AAN =====

-- Materialized view voor efficiënte dashboards
CREATE MATERIALIZED VIEW patient_activity_summary AS
SELECT 
  tl.user_id,
  p.voornaam,
  p.achternaam,
  date_trunc('day', tl.start_tijd) as activity_date,
  COUNT(*) as task_count,
  AVG(tl.pijn_score) as avg_pain,
  AVG(tl.vermoeidheid_score) as avg_fatigue,
  AVG(tl.energie_voor) as avg_energy_before,
  AVG(tl.energie_na) as avg_energy_after
FROM 
  task_logs tl
JOIN 
  profiles p ON tl.user_id = p.id
GROUP BY 
  tl.user_id, p.voornaam, p.achternaam, date_trunc('day', tl.start_tijd);

-- Opmerking: RLS kan niet worden ingeschakeld voor materialized views of views in Supabase
-- Om de "Materialized View in API" waarschuwing op te lossen, moeten we de toegang beperken
-- via een beveiligde functie die de toegang controleert

-- Maak een beveiligde functie die de toegang controleert
CREATE OR REPLACE FUNCTION public.get_patient_activity_summary(p_user_id UUID DEFAULT NULL)
RETURNS SETOF patient_activity_summary
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM patient_activity_summary
  WHERE 
    -- Als geen user_id is opgegeven, gebruik dan de huidige gebruiker
    (p_user_id IS NULL AND (
      -- Huidige gebruiker kan alleen eigen data zien
      user_id = auth.uid()
      -- Of specialist kan data van patiënten zien
      OR EXISTS (
        SELECT 1 FROM specialist_patienten
        WHERE specialist_id = auth.uid()
        AND patient_id = user_id
        AND 'view_logs' = ANY(toegangsrechten)
      )
      -- Of admin kan alle data zien
      OR public.is_admin()
    ))
    -- Als user_id is opgegeven, controleer dan of de huidige gebruiker toegang heeft
    OR (p_user_id IS NOT NULL AND (
      -- Admin kan alle data zien
      public.is_admin()
      -- Of specialist kan data van specifieke patiënt zien
      OR (
        EXISTS (
          SELECT 1 FROM specialist_patienten
          WHERE specialist_id = auth.uid()
          AND patient_id = p_user_id
          AND 'view_logs' = ANY(toegangsrechten)
        )
        AND user_id = p_user_id
      )
      -- Of gebruiker kan eigen data zien
      OR (auth.uid() = p_user_id AND user_id = p_user_id)
    ));
$$;

-- Geef rechten op de functie
GRANT EXECUTE ON FUNCTION public.get_patient_activity_summary(UUID) TO authenticated;

-- Functie om materialized view te vernieuwen
CREATE OR REPLACE FUNCTION refresh_activity_summary()
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  REFRESH MATERIALIZED VIEW patient_activity_summary;
$$;

-- ===== STAP 8: SCHAKEL ROW LEVEL SECURITY IN =====

-- Enable RLS for all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE planning ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflecties ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialist_patienten ENABLE ROW LEVEL SECURITY;
ALTER TABLE inzichten ENABLE ROW LEVEL SECURITY;
ALTER TABLE abonnementen ENABLE ROW LEVEL SECURITY;

-- ===== STAP 9: DEFINIEER RLS POLICIES =====

-- RLS policies for profiles
CREATE POLICY "Gebruikers kunnen alleen eigen profiel zien"
ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Gebruikers kunnen alleen eigen profiel bewerken"
ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins hebben volledige toegang tot profielen"
ON profiles FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- RLS policies for tasks
CREATE POLICY "Admins hebben volledige toegang tot tasks"
ON tasks FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Gebruikers kunnen alleen eigen taken zien"
ON tasks FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Gebruikers kunnen alleen eigen taken aanmaken"
ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Gebruikers kunnen alleen eigen taken bewerken"
ON tasks FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Gebruikers kunnen alleen eigen taken verwijderen"
ON tasks FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Specialisten kunnen taken zien van hun patiënten"
ON tasks FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM specialist_patienten
    WHERE specialist_id = auth.uid() 
    AND patient_id = user_id
    AND 'view_tasks' = ANY(toegangsrechten)
  )
);

CREATE POLICY "Specialisten kunnen taken aanmaken voor hun patiënten"
ON tasks FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM specialist_patienten
    WHERE specialist_id = auth.uid() 
    AND patient_id = user_id
    AND 'create_tasks' = ANY(toegangsrechten)
  )
);

-- RLS policies for task logs
CREATE POLICY "Admins hebben volledige toegang tot task_logs"
ON task_logs FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Gebruikers kunnen alleen eigen logs zien"
ON task_logs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Gebruikers kunnen alleen eigen logs aanmaken"
ON task_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Specialisten kunnen logs zien van hun patiënten"
ON task_logs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM specialist_patienten
    WHERE specialist_id = auth.uid() 
    AND patient_id = user_id
    AND 'view_logs' = ANY(toegangsrechten)
  )
);

-- RLS policies for planning
CREATE POLICY "Planning_policy"
ON planning
FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM specialist_patienten
    WHERE specialist_id = auth.uid()
    AND patient_id = user_id
    AND 'view_tasks' = ANY(toegangsrechten)
  )
  OR public.is_admin()
);

CREATE POLICY "Planning_insert_policy"
ON planning
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  OR public.is_admin()
);

CREATE POLICY "Planning_update_policy"
ON planning
FOR UPDATE
USING (
  auth.uid() = user_id
  OR public.is_admin()
);

CREATE POLICY "Planning_delete_policy"
ON planning
FOR DELETE
USING (
  auth.uid() = user_id
  OR public.is_admin()
);

-- RLS policies for reflecties
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

-- RLS policies for specialist_patienten
CREATE POLICY "Specialist_patienten_select_policy"
ON specialist_patienten
FOR SELECT
USING (
  auth.uid() = patient_id
  OR auth.uid() = specialist_id
  OR public.is_admin()
);

CREATE POLICY "Specialist_patienten_insert_policy"
ON specialist_patienten
FOR INSERT
WITH CHECK (
  auth.uid() = specialist_id
  OR public.is_admin()
);

CREATE POLICY "Specialist_patienten_update_policy"
ON specialist_patienten
FOR UPDATE
USING (
  auth.uid() = specialist_id
  OR public.is_admin()
);

CREATE POLICY "Specialist_patienten_delete_policy"
ON specialist_patienten
FOR DELETE
USING (
  auth.uid() = specialist_id
  OR public.is_admin()
);

-- RLS policies for inzichten
CREATE POLICY "Inzichten_policy"
ON inzichten
FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM specialist_patienten
    WHERE specialist_id = auth.uid()
    AND patient_id = user_id
    AND 'view_inzichten' = ANY(toegangsrechten)
  )
  OR public.is_admin()
);

CREATE POLICY "Inzichten_insert_policy"
ON inzichten
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  OR public.is_admin()
);

CREATE POLICY "Inzichten_update_policy"
ON inzichten
FOR UPDATE
USING (
  auth.uid() = user_id
  OR public.is_admin()
);

CREATE POLICY "Inzichten_delete_policy"
ON inzichten
FOR DELETE
USING (
  auth.uid() = user_id
  OR public.is_admin()
);

-- RLS policies for abonnementen
CREATE POLICY "Abonnementen_select_policy"
ON abonnementen
FOR SELECT
USING (
  auth.uid() = user_id
  OR public.is_admin()
);

CREATE POLICY "Abonnementen_insert_policy"
ON abonnementen
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  OR public.is_admin()
);

CREATE POLICY "Abonnementen_update_policy"
ON abonnementen
FOR UPDATE
USING (
  auth.uid() = user_id
  OR public.is_admin()
);

CREATE POLICY "Abonnementen_delete_policy"
ON abonnementen
FOR DELETE
USING (
  public.is_admin()
);

-- ===== STAP 10: MAAK INDEXES AAN =====

-- Basis indexes voor performance
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_task_logs_user_id ON task_logs(user_id);
CREATE INDEX idx_task_logs_task_id ON task_logs(task_id);
CREATE INDEX idx_planning_user_id_datum ON planning(user_id, datum);
CREATE INDEX idx_specialist_patienten_specialist_id ON specialist_patienten(specialist_id);
CREATE INDEX idx_specialist_patienten_patient_id ON specialist_patienten(patient_id);
CREATE INDEX idx_inzichten_user_id ON inzichten(user_id);

-- Aanvullende indexes voor efficiëntere queries
CREATE INDEX idx_profiles_type ON profiles(type);
CREATE INDEX idx_task_logs_start_tijd ON task_logs(start_tijd);
CREATE INDEX idx_task_logs_user_id_start_tijd ON task_logs(user_id, start_tijd);
CREATE INDEX idx_tasks_user_id_type ON tasks(user_id, type);
CREATE UNIQUE INDEX idx_patient_activity_summary ON patient_activity_summary(user_id, activity_date);

-- ===== STAP 11: GEEF PERMISSIES =====

-- Permissies voor SECURITY DEFINER functies
GRANT EXECUTE ON FUNCTION public.create_task_with_owner(JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_profile_for_owner(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_task_log_for_owner(UUID, JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_id_by_email(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_task_log_for_owner(JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_profile_for_owner(UUID, JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_patient_account(TEXT, TEXT, JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_activity_summary() TO authenticated;

COMMIT; -- Voltooi de transactie

-- ===== STAP 12: VERIFICATIE QUERIES =====
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
