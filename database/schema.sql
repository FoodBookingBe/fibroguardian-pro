BEGIN; -- Begin transaction for atomic execution

-- Drop existing objects in the correct order to respect dependencies
DROP MATERIALIZED VIEW IF EXISTS patient_activity_summary CASCADE;

-- Remove all functions with CASCADE to resolve dependencies
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

-- Remove triggers
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;
DROP TRIGGER IF EXISTS tasks_updated_at ON tasks;
DROP TRIGGER IF EXISTS planning_updated_at ON planning;
DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS abonnementen_updated_at ON abonnementen;

-- Remove tables with CASCADE
DROP TABLE IF EXISTS task_logs CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS planning CASCADE;
DROP TABLE IF EXISTS reflecties CASCADE;
DROP TABLE IF EXISTS inzichten CASCADE;
DROP TABLE IF EXISTS specialist_patienten CASCADE;
DROP TABLE IF EXISTS abonnementen CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ===== TABLE DEFINITIONS =====

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

-- ===== FUNCTIONS & TRIGGERS =====

-- Function for automatic timestamp update
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic timestamp update
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

-- Trigger to automatically create a profile for new users
CREATE OR REPLACE FUNCTION public.create_profile_for_new_user()
RETURNS TRIGGER AS $$
DECLARE
  profile_type TEXT;
  v_voornaam TEXT;
  v_achternaam TEXT;
BEGIN
  RAISE NOTICE '[TRIGGER] create_profile_for_new_user Fired. User ID: %, Email: %', NEW.id, NEW.email;

  -- Attempt to get names from raw_user_meta_data if available
  v_voornaam := COALESCE(NEW.raw_user_meta_data->>'voornaam', 'Nieuwe');
  v_achternaam := COALESCE(NEW.raw_user_meta_data->>'achternaam', 'Gebruiker');
  RAISE NOTICE '[TRIGGER] Voornaam from metadata: %, Achternaam from metadata: %', v_voornaam, v_achternaam;

  -- Explicitly set type for admin@foodbooking.be for this test
  IF NEW.email = 'admin@foodbooking.be' THEN
    profile_type := 'admin';
    RAISE NOTICE '[TRIGGER] User is admin@foodbooking.be. Forced profile_type: admin';
  ELSIF NEW.raw_app_meta_data IS NOT NULL AND NEW.raw_app_meta_data ? 'type' THEN
    profile_type := NEW.raw_app_meta_data->>'type';
    RAISE NOTICE '[TRIGGER] User is NOT admin@foodbooking.be. Type from raw_app_meta_data: %', profile_type;
    IF profile_type NOT IN ('patient', 'specialist', 'admin') THEN
      RAISE NOTICE '[TRIGGER] Invalid type from metadata ''%'', defaulting to patient.', profile_type;
      profile_type := 'patient';
    END IF;
  ELSE
    profile_type := 'patient';
    RAISE NOTICE '[TRIGGER] User is NOT admin@foodbooking.be. No type in raw_app_meta_data, defaulting to patient.';
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
  
  RAISE NOTICE '[TRIGGER] Profile INSERTED for User ID: %, Type: %, Voornaam: %, Achternaam: %', NEW.id, profile_type, v_voornaam, v_achternaam;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Maak trigger aan die activeert bij nieuwe gebruikers
CREATE TRIGGER create_profile_on_signup
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.create_profile_for_new_user();

-- Helper function to check if current user is an admin
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

-- Function to create a task with explicit owner, bypassing RLS for the insert itself
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

-- Function to get a profile for a specific owner, bypassing RLS
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

-- Function to update a task log for a specific owner, ensuring ownership
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

-- Function to get a user ID by email
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(p_email TEXT)
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT id FROM auth.users WHERE email = p_email LIMIT 1;
$$;

-- Function to create a task log with explicit owner
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

-- Function to update a profile for owner
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

-- Function to create a patient account by specialist
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

-- Materialized view for efficient dashboards
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

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_activity_summary()
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  REFRESH MATERIALIZED VIEW patient_activity_summary;
$$;

-- ===== ROW LEVEL SECURITY =====

-- Enable RLS for all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE planning ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflecties ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialist_patienten ENABLE ROW LEVEL SECURITY;
ALTER TABLE inzichten ENABLE ROW LEVEL SECURITY;
ALTER TABLE abonnementen ENABLE ROW LEVEL SECURITY;

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
  (SELECT auth.uid()) = user_id
  OR EXISTS (
    SELECT 1 FROM specialist_patienten
    WHERE specialist_id = (SELECT auth.uid())
    AND patient_id = user_id
    AND 'view_tasks' = ANY(toegangsrechten)
  )
  OR (SELECT public.is_admin())
);

CREATE POLICY "Planning_insert_policy"
ON planning
FOR INSERT
WITH CHECK (
  (SELECT auth.uid()) = user_id
  OR (SELECT public.is_admin())
);

CREATE POLICY "Planning_update_policy"
ON planning
FOR UPDATE
USING (
  (SELECT auth.uid()) = user_id
  OR (SELECT public.is_admin())
);

CREATE POLICY "Planning_delete_policy"
ON planning
FOR DELETE
USING (
  (SELECT auth.uid()) = user_id
  OR (SELECT public.is_admin())
);

-- RLS policies for reflecties
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

-- RLS policies for specialist_patienten
CREATE POLICY "Specialist_patienten_select_policy"
ON specialist_patienten
FOR SELECT
USING (
  (SELECT auth.uid()) = patient_id
  OR (SELECT auth.uid()) = specialist_id
  OR (SELECT public.is_admin())
);

CREATE POLICY "Specialist_patienten_insert_policy"
ON specialist_patienten
FOR INSERT
WITH CHECK (
  (SELECT auth.uid()) = specialist_id
  OR (SELECT public.is_admin())
);

CREATE POLICY "Specialist_patienten_update_policy"
ON specialist_patienten
FOR UPDATE
USING (
  (SELECT auth.uid()) = specialist_id
  OR (SELECT public.is_admin())
);

CREATE POLICY "Specialist_patienten_delete_policy"
ON specialist_patienten
FOR DELETE
USING (
  (SELECT auth.uid()) = specialist_id
  OR (SELECT public.is_admin())
);

-- RLS policies for inzichten
CREATE POLICY "Inzichten_policy"
ON inzichten
FOR SELECT
USING (
  (SELECT auth.uid()) = user_id
  OR EXISTS (
    SELECT 1 FROM specialist_patienten
    WHERE specialist_id = (SELECT auth.uid())
    AND patient_id = user_id
    AND 'view_inzichten' = ANY(toegangsrechten)
  )
  OR (SELECT public.is_admin())
);

CREATE POLICY "Inzichten_insert_policy"
ON inzichten
FOR INSERT
WITH CHECK (
  (SELECT auth.uid()) = user_id
  OR (SELECT public.is_admin())
);

CREATE POLICY "Inzichten_update_policy"
ON inzichten
FOR UPDATE
USING (
  (SELECT auth.uid()) = user_id
  OR (SELECT public.is_admin())
);

CREATE POLICY "Inzichten_delete_policy"
ON inzichten
FOR DELETE
USING (
  (SELECT auth.uid()) = user_id
  OR (SELECT public.is_admin())
);

-- RLS policies for abonnementen
CREATE POLICY "Abonnementen_select_policy"
ON abonnementen
FOR SELECT
USING (
  (SELECT auth.uid()) = user_id
  OR (SELECT public.is_admin())
);

CREATE POLICY "Abonnementen_insert_policy"
ON abonnementen
FOR INSERT
WITH CHECK (
  (SELECT auth.uid()) = user_id
  OR (SELECT public.is_admin())
);

CREATE POLICY "Abonnementen_update_policy"
ON abonnementen
FOR UPDATE
USING (
  (SELECT auth.uid()) = user_id
  OR (SELECT public.is_admin())
);

CREATE POLICY "Abonnementen_delete_policy"
ON abonnementen
FOR DELETE
USING (
  (SELECT public.is_admin())
);

-- ===== INDEXES =====

-- Basic indexes for performance
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_task_logs_user_id ON task_logs(user_id);
CREATE INDEX idx_task_logs_task_id ON task_logs(task_id);
CREATE INDEX idx_planning_user_id_datum ON planning(user_id, datum);
CREATE INDEX idx_specialist_patienten_specialist_id ON specialist_patienten(specialist_id);
CREATE INDEX idx_specialist_patienten_patient_id ON specialist_patienten(patient_id);
CREATE INDEX idx_inzichten_user_id ON inzichten(user_id);

-- Additional indexes for more efficient queries
CREATE INDEX idx_profiles_type ON profiles(type);
CREATE INDEX idx_task_logs_start_tijd ON task_logs(start_tijd);
CREATE INDEX idx_task_logs_user_id_start_tijd ON task_logs(user_id, start_tijd);
CREATE INDEX idx_tasks_user_id_type ON tasks(user_id, type);
CREATE UNIQUE INDEX idx_patient_activity_summary ON patient_activity_summary(user_id, activity_date);

-- ===== GRANT PERMISSIONS =====

-- Permissions for SECURITY DEFINER functions
GRANT EXECUTE ON FUNCTION public.create_task_with_owner(JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_profile_for_owner(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_task_log_for_owner(UUID, JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_id_by_email(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_task_log_for_owner(JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_profile_for_owner(UUID, JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_patient_account(TEXT, TEXT, JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_activity_summary() TO authenticated;

COMMIT; -- Complete the transaction
</final_file_content>

IMPORTANT: For any future changes to this file, use the final_file_content shown above as your reference. This content reflects the current state of the file, including any auto-formatting (e.g., if you used single quotes but the formatter converted them to double quotes). Always base your SEARCH/REPLACE operations on this final version to ensure accuracy.



New problems detected after saving the file:
database/schema.sql
- [Error] Line 4: Incorrect syntax near 'CASCADE'.
- [Error] Line 7: Incorrect syntax near 'public'.  Expecting '.', ID, or QUOTED_ID.
- [Error] Line 7: Incorrect syntax near ')'.  Expecting '(', or SELECT.
- [Error] Line 8: Incorrect syntax near 'public'.  Expecting '.', ID, or QUOTED_ID.
- [Error] Line 8: Incorrect syntax near 'TEXT'.  Expecting '(', or SELECT.
- [Error] Line 9: Incorrect syntax near 'public'.  Expecting '.', ID, or QUOTED_ID.
- [Error] Line 9: Incorrect syntax near 'UUID'.  Expecting '(', or SELECT.
- [Error] Line 10: Incorrect syntax near 'public'.  Expecting '.', ID, or QUOTED_ID.
- [Error] Line 10: Incorrect syntax near 'JSONB'.  Expecting '(', or SELECT.
- [Error] Line 11: Incorrect syntax near 'public'.  Expecting '.', ID, or QUOTED_ID.
- [Error] Line 11: Incorrect syntax near 'TEXT'.  Expecting '(', or SELECT.
- [Error] Line 12: Incorrect syntax near 'public'.  Expecting '.', ID, or QUOTED_ID.
- [Error] Line 12: Incorrect syntax near 'UUID'.  Expecting '(', or SELECT.
- [Error] Line 13: Incorrect syntax near 'public'.  Expecting '.', ID, or QUOTED_ID.
- [Error] Line 13: Incorrect syntax near 'UUID'.  Expecting '(', or SELECT.
- [Error] Line 14: Incorrect syntax near 'public'.  Expecting '.', ID, or QUOTED_ID.
- [Error] Line 14: Incorrect syntax near 'JSONB'.  Expecting '(', or SELECT.
- [Error] Line 15: Incorrect syntax near 'public'.  Expecting '.', ID, or QUOTED_ID.
- [Error] Line 15: Incorrect syntax near ')'.  Expecting '(', or SELECT.
- [Error] Line 16: Incorrect syntax near 'public'.  Expecting '.', ID, or QUOTED_ID.
- [Error] Line 16: Incorrect syntax near ')'.  Expecting '(', or SELECT.
- [Error] Line 17: Incorrect syntax near 'public'.  Expecting '.', ID, or QUOTED_ID.
- [Error] Line 17: Incorrect syntax near ')'.  Expecting '(', or SELECT.
- [Error] Line 20: Incorrect syntax near 'auth'.  Expecting ALL, or DATABASE.
- [Error] Line 21: Incorrect syntax near 'tasks'.
- [Error] Line 22: Incorrect syntax near 'planning'.
- [Error] Line 23: Incorrect syntax near 'profiles'.
- [Error] Line 24: Incorrect syntax near 'abonnementen'.
- [Error] Line 27: Incorrect syntax near 'CASCADE'.
- [Error] Line 28: Incorrect syntax near 'CASCADE'.
- [Error] Line 29: Incorrect syntax near 'CASCADE'.
- [Error] Line 30: Incorrect syntax near 'CASCADE'.
- [Error] Line 31: Incorrect syntax near 'CASCADE'.
- [Error] Line 32: Incorrect syntax near 'CASCADE'.
- [Error] Line 33: Incorrect syntax near 'CASCADE'.
- [Error] Line 34: Incorrect syntax near 'CASCADE'.
- [Error] Line 60: Incorrect syntax near '[]'.
- [Error] Line 65: Incorrect syntax near ')'.  Expecting '(', or SELECT.
- [Error] Line 66: Incorrect syntax near ')'.  Expecting '(', or SELECT.
- [Error] Line 92: Incorrect syntax near '[]'.
- [Error] Line 93: Incorrect syntax near ')'.  Expecting '(', or SELECT.
- [Error] Line 94: Incorrect syntax near ')'.  Expecting '(', or SELECT.
- [Error] Line 113: Incorrect syntax near '[]'.
- [Error] Line 114: Incorrect syntax near ')'.  Expecting '(', or SELECT.
- [Error] Line 115: Incorrect syntax near 'specialist_id'.  Expecting '(', or SELECT.
- [Error] Line 146: Incorrect syntax near 'REPLACE'.  Expecting ALTER.
- [Error] Line 146: Incorrect syntax near ')'.  Expecting '(', or SELECT.
- [Error] Line 149: '' is not a recognized CURSOR option.
- [Error] Line 149: Incorrect syntax near ';'.  Expecting CURSOR, or ID.
- [Error] Line 152: An expression of non-boolean type specified in a context where a condition is expected.
- [Error] Line 152: Incorrect syntax near '?'.
- [Error] Line 155: Incorrect syntax near 'THEN'.
- [Error] Line 157: Incorrect syntax near 'IF'.  Expecting CONVERSATION.
- [Error] Line 157: Incorrect syntax near ';'.
- [Error] Line 157: An expression of non-boolean type specified in a context where a condition is expected.
- [Error] Line 159: Incorrect syntax near 'profile_type'.
- [Error] Line 160: Incorrect syntax near 'IF'.  Expecting CONVERSATION.
- [Error] Line 160: An expression of non-boolean type specified in a context where a condition is expected.
- [Error] Line 160: Incorrect syntax near ';'.
- [Error] Line 162: Incorrect syntax near 'public'.
- [Error] Line 165: Incorrect syntax near ';'.  Expecting CONVERSATION.
- [Error] Line 169: Incorrect syntax near 'auth'.  Expecting ALL, or DATABASE.
- [Error] Line 173: Incorrect syntax near 'AFTER'.  Expecting ON.
- [Error] Line 173: Incorrect syntax near 'ON'.
- [Error] Line 174: Incorrect syntax near 'FOR'.  Expecting '(', DEFAULT, EXECUTE, SELECT, or VALUES.
- [Error] Line 175: Incorrect syntax near 'FUNCTION'.
- [Error] Line 175: Incorrect syntax near ')'.  Expecting '(', or SELECT.
- [Error] Line 178: Incorrect syntax near 'REPLACE'.  Expecting ALTER.
- [Error] Line 178: Incorrect syntax near ')'.  Expecting '(', or SELECT.
- [Error] Line 183: Incorrect syntax near 'EXISTS'.
- [Error] Line 185: Incorrect syntax near 'public'.
- [Error] Line 188: Incorrect syntax near '$'.
- [Error] Line 191: Incorrect syntax near 'REPLACE'.  Expecting ALTER.
- [Error] Line 192: Incorrect syntax near 'task_data'.  Expecting '(', or SELECT.
- [Error] Line 198: Incorrect syntax near '='.
- [Error] Line 202: An expression of non-boolean type specified in a context where a condition is expected.
- [Error] Line 202: Incorrect syntax near '?'.
- [Error] Line 204: An expression of non-boolean type specified in a context where a condition is expected.
- [Error] Line 204: Incorrect syntax near ';'.
- [Error] Line 207: Incorrect syntax near 'public'.
- [Error] Line 225: Incorrect syntax near '>>'.
- [Error] Line 226: Incorrect syntax near '>>'.
- [Error] Line 227: Incorrect syntax near '>>'.
- [Error] Line 228: Incorrect syntax near '>>'.
- [Error] Line 228: Incorrect syntax near '::'.
- [Error] Line 229: Incorrect syntax near 'task_data'.  Expecting '(', or SELECT.
- [Error] Line 231: Incorrect syntax near 'task_data'.  Expecting '(', or SELECT.
- [Error] Line 232: Incorrect syntax near '>'.
- [Error] Line 232: Incorrect syntax near ')'.  Expecting ',', AND, or OR.
- [Error] Line 232: Incorrect syntax near 'ELSE'.
- [Error] Line 232: Incorrect syntax near ','.  Expecting CONVERSATION.
- [Error] Line 233: Incorrect syntax near 'task_data'.  Expecting '(', or SELECT.
- [Error] Line 234: Incorrect syntax near '>'.
- [Error] Line 234: Incorrect syntax near ')'.  Expecting ',', AND, or OR.
- [Error] Line 234: Incorrect syntax near 'ELSE'.
- [Error] Line 234: Incorrect syntax near ','.  Expecting CONVERSATION.
- [Error] Line 236: Incorrect syntax near 'task_data'.  Expecting '(', or SELECT.
- [Error] Line 237: Incorrect syntax near '>'.
- [Error] Line 237: Incorrect syntax near ')'.  Expecting ',', AND, or OR.
- [Error] Line 237: Incorrect syntax near 'ELSE'.
- [Error] Line 237: Incorrect syntax near ','.  Expecting CONVERSATION.
- [Error] Line 238: Incorrect syntax near 'task_data'.  Expecting '(', or SELECT.
- [Error] Line 241: Incorrect syntax near ';'.  Expecting CONVERSATION.
- [Error] Line 245: Incorrect syntax near '.'.  Expecting DOUBLECOLON, or ID.
- [Error] Line 245: Incorrect syntax near 'JSONB'.  Expecting '(', or SELECT.
- [Error] Line 248: Incorrect syntax near 'REPLACE'.  Expecting ALTER.
- [Error] Line 249: Incorrect syntax near 'owner_user_id'.  Expecting '(', or SELECT.
- [Error] Line 254: Incorrect syntax near '='.
- [Error] Line 259: Incorrect syntax near 'public'.
- [Error] Line 262: Incorrect syntax near '$'.
- [Error] Line 265: Incorrect syntax near '.'.  Expecting DOUBLECOLON, or ID.
- [Error] Line 265: Incorrect syntax near 'UUID'.  Expecting '(', or SELECT.
- [Error] Line 268: Incorrect syntax near 'REPLACE'.  Expecting ALTER.
- [Error] Line 269: Incorrect syntax near 'p_log_id'.  Expecting '(', or SELECT.
- [Error] Line 275: Incorrect syntax near '='.
- [Error] Line 278: '' is not a recognized CURSOR option.
- [Error] Line 278: Incorrect syntax near ';'.  Expecting CURSOR, or ID.
- [Error] Line 281: Incorrect syntax near 'public'.
- [Error] Line 283: An expression of non-boolean type specified in a context where a condition is expected.
- [Error] Line 283: Incorrect syntax near 'THEN'.
- [Error] Line 287: An expression of non-boolean type specified in a context where a condition is expected.
- [Error] Line 287: Incorrect syntax near ';'.
- [Error] Line 290: Incorrect syntax near 'public'.
- [Error] Line 292: Incorrect syntax near '>>'.
- [Error] Line 292: Incorrect syntax near '::'.
- [Error] Line 293: Incorrect syntax near '>>'.
- [Error] Line 293: Incorrect syntax near '::'.
- [Error] Line 294: Incorrect syntax near '>>'.
- [Error] Line 294: Incorrect syntax near '::'.
- [Error] Line 295: Incorrect syntax near '>>'.
- [Error] Line 295: Incorrect syntax near '::'.
- [Error] Line 296: Incorrect syntax near '>>'.
- [Error] Line 296: Incorrect syntax near '::'.
- [Error] Line 297: Incorrect syntax near '>>'.
- [Error] Line 297: Incorrect syntax near '::'.
- [Error] Line 298: Incorrect syntax near '>>'.
- [Error] Line 299: Incorrect syntax near '>>'.
- [Error] Line 299: Incorrect syntax near '::'.
- [Error] Line 300: Incorrect syntax near '>>'.
- [Error] Line 301: Incorrect syntax near '>>'.
- [Error] Line 304: Incorrect syntax near 'RETURNING'.
- [Error] Line 305: Incorrect syntax near ';'.  Expecting CONVERSATION.
- [Error] Line 309: Incorrect syntax near '.'.  Expecting DOUBLECOLON, or ID.
- [Error] Line 309: Incorrect syntax near 'UUID'.  Expecting '(', or SELECT.
- [Error] Line 312: Incorrect syntax near 'REPLACE'.  Expecting ALTER.
- [Error] Line 312: Incorrect syntax near 'p_email'.  Expecting '(', or SELECT.
- [Error] Line 316: Incorrect syntax near '='.
- [Error] Line 318: Incorrect syntax near 'LIMIT'.
- [Error] Line 321: Incorrect syntax near '.'.  Expecting DOUBLECOLON, or ID.
- [Error] Line 321: Incorrect syntax near 'TEXT'.  Expecting '(', or SELECT.
- [Error] Line 324: Incorrect syntax near 'REPLACE'.  Expecting ALTER.
- [Error] Line 325: Incorrect syntax near 'p_log_data'.  Expecting '(', or SELECT.
- [Error] Line 330: Incorrect syntax near '='.
- [Error] Line 334: An expression of non-boolean type specified in a context where a condition is expected.
- [Error] Line 334: Incorrect syntax near '?'.
- [Error] Line 338: An expression of non-boolean type specified in a context where a condition is expected.
- [Error] Line 338: Incorrect syntax near 'THEN'.
- [Error] Line 342: An expression of non-boolean type specified in a context where a condition is expected.
- [Error] Line 342: Incorrect syntax near ';'.
- [Error] Line 345: Incorrect syntax near 'public'.
- [Error] Line 362: Incorrect syntax near '>>'.
- [Error] Line 363: Incorrect syntax near '>>'.
- [Error] Line 363: Incorrect syntax near '::'.
- [Error] Line 364: Incorrect syntax near '>>'.
- [Error] Line 364: Incorrect syntax near '::'.
- [Error] Line 365: Incorrect syntax near '>>'.
- [Error] Line 365: Incorrect syntax near '::'.
- [Error] Line 366: Incorrect syntax near '>>'.
- [Error] Line 366: Incorrect syntax near '::'.
- [Error] Line 367: Incorrect syntax near '>>'.
- [Error] Line 368: Incorrect syntax near '>>'.
- [Error] Line 368: Incorrect syntax near '::'.
- [Error] Line 369: Incorrect syntax near '>>'.
- [Error] Line 370: Incorrect syntax near '>>'.
- [Error] Line 373: Incorrect syntax near ';'.  Expecting CONVERSATION.
- [Error] Line 377: Incorrect syntax near '.'.  Expecting DOUBLECOLON, or ID.
- [Error] Line 377: Incorrect syntax near 'JSONB'.  Expecting '(', or SELECT.
- [Error] Line 380: Incorrect syntax near 'REPLACE'.  Expecting ALTER.
- [Error] Line 381: Incorrect syntax near 'p_profile_id'.  Expecting '(', or SELECT.
- [Error] Line 386: Incorrect syntax near '='.
- [Error] Line 389: An expression of non-boolean type specified in a context where a condition is expected.
- [Error] Line 389: Incorrect syntax near 'THEN'.
- [Error] Line 393: An expression of non-boolean type specified in a context where a condition is expected.
- [Error] Line 393: Incorrect syntax near ';'.
- [Error] Line 396: Incorrect syntax near 'public'.
- [Error] Line 404: Incorrect syntax near '>>'.
- [Error] Line 404: Incorrect syntax near '::'.
- [Error] Line 407: Incorrect syntax near ';'.  Expecting CONVERSATION.
- [Error] Line 411: Incorrect syntax near '.'.  Expecting DOUBLECOLON, or ID.
- [Error] Line 411: Incorrect syntax near 'UUID'.  Expecting '(', or SELECT.
- [Error] Line 414: Incorrect syntax near 'REPLACE'.  Expecting ALTER.
- [Error] Line 415: Incorrect syntax near 'p_email'.  Expecting '(', or SELECT.
- [Error] Line 421: Incorrect syntax near '='.
- [Error] Line 424: '' is not a recognized CURSOR option.
- [Error] Line 424: Incorrect syntax near ';'.  Expecting CURSOR, or ID.
- [Error] Line 427: Incorrect syntax near 'profiles'.
- [Error] Line 429: An expression of non-boolean type specified in a context where a condition is expected.
- [Error] Line 429: Incorrect syntax near 'THEN'.
- [Error] Line 433: An expression of non-boolean type specified in a context where a condition is expected.
- [Error] Line 433: Incorrect syntax near ';'.
- [Error] Line 436: Incorrect syntax near 'auth'.
- [Error] Line 442: Incorrect syntax near 'id'.  Expecting CONVERSATION, DIALOG, DISTRIBUTED, or TRANSACTION.
- [Error] Line 442: Incorrect syntax near ')'.  Expecting '(', or SELECT.
- [Error] Line 445: Incorrect syntax near 'profiles'.
- [Error] Line 456: Incorrect syntax near '>>'.
- [Error] Line 456: Incorrect syntax near '::'.
- [Error] Line 459: Incorrect syntax near ';'.  Expecting CONVERSATION.
- [Error] Line 462: Incorrect syntax near 'specialist_patienten'.
- [Error] Line 466: Incorrect syntax near 'jsonb_build_object'.
- [Error] Line 471: Incorrect syntax near ';'.  Expecting CONVERSATION.
- [Error] Line 475: Incorrect syntax near '.'.  Expecting DOUBLECOLON, or ID.
- [Error] Line 475: Incorrect syntax near 'JSONB'.  Expecting '(', or SELECT.
- [Error] Line 478: Incorrect syntax near 'MATERIALIZED'.
- [Error] Line 493: Incorrect syntax near ';'.
- [Error] Line 496: Incorrect syntax near 'REPLACE'.  Expecting ALTER.
- [Error] Line 497: Incorrect syntax near ')'.  Expecting '(', or SELECT.
- [Error] Line 502: Incorrect syntax near 'MATERIALIZED'.
- [Error] Line 503: Incorrect syntax near ';'.
- [Error] Line 508: Incorrect syntax near 'row'.  Expecting ALTTAB_EN_CHANGE_TRACKING, ALTTAB_EN_FILETABLE_NAMESPACE, or TRIGGER.
- [Error] Line 509: Incorrect syntax near 'row'.  Expecting ALTTAB_EN_CHANGE_TRACKING, ALTTAB_EN_FILETABLE_NAMESPACE, or TRIGGER.
- [Error] Line 510: Incorrect syntax near 'row'.  Expecting ALTTAB_EN_CHANGE_TRACKING, ALTTAB_EN_FILETABLE_NAMESPACE, or TRIGGER.
- [Error] Line 511: Incorrect syntax near 'row'.  Expecting ALTTAB_EN_CHANGE_TRACKING, ALTTAB_EN_FILETABLE_NAMESPACE, or TRIGGER.
- [Error] Line 512: Incorrect syntax near 'row'.  Expecting ALTTAB_EN_CHANGE_TRACKING, ALTTAB_EN_FILETABLE_NAMESPACE, or TRIGGER.
- [Error] Line 513: Incorrect syntax near 'row'.  Expecting ALTTAB_EN_CHANGE_TRACKING, ALTTAB_EN_FILETABLE_NAMESPACE, or TRIGGER.
- [Error] Line 514: Incorrect syntax near 'row'.  Expecting ALTTAB_EN_CHANGE_TRACKING, ALTTAB_EN_FILETABLE_NAMESPACE, or TRIGGER.
- [Error] Line 515: Incorrect syntax near 'row'.  Expecting ALTTAB_EN_CHANGE_TRACKING, ALTTAB_EN_FILETABLE_NAMESPACE, or TRIGGER.
- [Error] Line 518: Incorrect syntax near 'policy'.
- [Error] Line 519: Incorrect syntax near ')'.  Expecting ',', AND, or OR.
- [Error] Line 521: Incorrect syntax near 'policy'.
- [Error] Line 522: Incorrect syntax near '('.  Expecting ')', ',', or '.'.
- [Error] Line 522: Incorrect syntax near ')'.
- [Error] Line 522: Incorrect syntax near '='.
- [Error] Line 524: Incorrect syntax near 'policy'.
- [Error] Line 526: Incorrect syntax near 'public'.  Expecting '(', or SELECT.
- [Error] Line 526: Incorrect syntax near ')'.  Expecting '(', or SELECT.
- [Error] Line 527: Incorrect syntax near 'public'.  Expecting '(', or SELECT.
- [Error] Line 527: Incorrect syntax near ')'.  Expecting '(', or SELECT.
- [Error] Line 530: Incorrect syntax near 'policy'.
- [Error] Line 531: Incorrect syntax near 'public'.  Expecting '(', or SELECT.
- [Error] Line 531: Incorrect syntax near ')'.  Expecting '(', or SELECT.
- [Error] Line 531: Incorrect syntax near 'public'.  Expecting '(', or SELECT.
- [Error] Line 531: Incorrect syntax near ')'.  Expecting '(', or SELECT.
- [Error] Line 533: Incorrect syntax near 'policy'.
- [Error] Line 534: Incorrect syntax near ')'.  Expecting ',', AND, or OR.
- [Error] Line 536: Incorrect syntax near 'policy'.
- [Error] Line 537: Incorrect syntax near 'with check'.
- [Error] Line 537: Incorrect syntax near '('.  Expecting ')', ',', or '.'.
- [Error] Line 537: Incorrect syntax near ')'.  Expecting '(', or SELECT.
- [Error] Line 537: Incorrect syntax near ')'.
- [Error] Line 539: Incorrect syntax near 'policy'.
- [Error] Line 540: Incorrect syntax near '('.  Expecting ')', ',', or '.'.
- [Error] Line 540: Incorrect syntax near ')'.
- [Error] Line 540: Incorrect syntax near '='.
- [Error] Line 542: Incorrect syntax near 'policy'.
- [Error] Line 543: Incorrect syntax near '('.  Expecting ')', ',', or '.'.
- [Error] Line 543: Incorrect syntax near ')'.  Expecting '(', or SELECT.
- [Error] Line 545: Incorrect syntax near 'policy'.
- [Error] Line 551: Incorrect syntax near 'toegangsrechten'.  Expecting '(', or SELECT.
- [Error] Line 552: Incorrect syntax near ')'.  Expecting ',', AND, or OR.
- [Error] Line 553: Incorrect syntax near ')'.
- [Error] Line 555: Incorrect syntax near 'policy'.
- [Error] Line 556: Incorrect syntax near 'with check'.
- [Error] Line 557: Incorrect syntax near 'exists'.  Expecting '.', ID, PSEUDOCOL, or QUOTED_ID.
- [Error] Line 561: Incorrect syntax near 'toegangsrechten'.  Expecting '(', or SELECT.
- [Error] Line 562: Incorrect syntax near ')'.
- [Error] Line 566: Incorrect syntax near 'policy'.
- [Error] Line 567: Incorrect syntax near 'public'.  Expecting '(', or SELECT.
- [Error] Line 567: Incorrect syntax near ')'.  Expecting '(', or SELECT.
- [Error] Line 567: Incorrect syntax near 'public'.  Expecting '(', or SELECT.
- [Error] Line 567: Incorrect syntax near ')'.  Expecting '(', or SELECT.
- [Error] Line 569: Incorrect syntax near 'policy'.
- [Error] Line 570: Incorrect syntax near ')'.  Expecting ',', AND, or OR.
- [Error] Line 572: Incorrect syntax near 'policy'.
- [Error] Line 573: Incorrect syntax near 'with check'.
- [Error] Line 573: Incorrect syntax near '('.  Expecting ')', ',', or '.'.
- [Error] Line 573: Incorrect syntax near ')'.  Expecting '(', or SELECT.
- [Error] Line 573: Incorrect syntax near ')'.
- [Error] Line 575: Incorrect syntax near 'policy'.
- [Error] Line 581: Incorrect syntax near 'toegangsrechten'.  Expecting '(', or SELECT.
- [Error] Line 582: Incorrect syntax near ')'.  Expecting ',', AND, or OR.
- [Error] Line 583: Incorrect syntax near ')'.
- [Error] Line 587: Incorrect syntax near 'POLICY'.
- [Error] Line 596: Incorrect syntax near 'toegangsrechten'.  Expecting '(', or SELECT.
- [Error] Line 597: Incorrect syntax near ')'.  Expecting ',', AND, or OR.
- [Error] Line 598: Incorrect syntax near 'OR'.
- [Error] Line 598: Incorrect syntax near 'public'.
- [Error] Line 599: Incorrect syntax near ')'.
- [Error] Line 601: Incorrect syntax near 'POLICY'.
- [Error] Line 604: Incorrect syntax near 'WITH CHECK'.
- [Error] Line 605: Incorrect syntax near '('.  Expecting '.', ID, PSEUDOCOL, or QUOTED_ID.
- [Error] Line 605: Incorrect syntax near '='.
- [Error] Line 606: Incorrect syntax near 'public'.
- [Error] Line 607: Incorrect syntax near ')'.
- [Error] Line 609: Incorrect syntax near 'POLICY'.
- [Error] Line 613: Incorrect syntax near '('.
- [Error] Line 613: Incorrect syntax near 'SELECT'.  Expecting '.', ID, PSEUDOCOL, or QUOTED_ID.
- [Error] Line 613: Incorrect syntax near ')'.
- [Error] Line 614: Incorrect syntax near 'public'.
- [Error] Line 615: Incorrect syntax near ')'.
- [Error] Line 617: Incorrect syntax near 'POLICY'.
- [Error] Line 621: Incorrect syntax near '('.
- [Error] Line 621: Incorrect syntax near 'SELECT'.  Expecting '.', ID, PSEUDOCOL, or QUOTED_ID.
- [Error] Line 621: Incorrect syntax near ')'.
- [Error] Line 622: Incorrect syntax near 'public'.
- [Error] Line 623: Incorrect syntax near ')'.
- [Error] Line 626: Incorrect syntax near 'POLICY'.
- [Error] Line 635: Incorrect syntax near 'toegangsrechten'.  Expecting '(', or SELECT.
- [Error] Line 636: Incorrect syntax near ')'.  Expecting ',', AND, or OR.
- [Error] Line 637: Incorrect syntax near 'OR'.
- [Error] Line 637: Incorrect syntax near 'public'.
- [Error] Line 638: Incorrect syntax near ')'.
- [Error] Line 640: Incorrect syntax near 'POLICY'.
- [Error] Line 643: Incorrect syntax near 'WITH CHECK'.
- [Error] Line 644: Incorrect syntax near '('.  Expecting '.', ID, PSEUDOCOL, or QUOTED_ID.
- [Error] Line 644: Incorrect syntax near '='.
- [Error] Line 645: Incorrect syntax near 'public'.
- [Error] Line 646: Incorrect syntax near ')'.
- [Error] Line 648: Incorrect syntax near 'POLICY'.
- [Error] Line 652: Incorrect syntax near '('.
- [Error] Line 652: Incorrect syntax near 'SELECT'.  Expecting '.', ID, PSEUDOCOL, or QUOTED_ID.
- [Error] Line 652: Incorrect syntax near ')'.
- [Error] Line 653: Incorrect syntax near 'public'.
- [Error] Line 654: Incorrect syntax near ')'.
- [Error] Line 656: Incorrect syntax near 'POLICY'.
- [Error] Line 660: Incorrect syntax near '('.
- [Error] Line 660: Incorrect syntax near 'SELECT'.  Expecting '.', ID, PSEUDOCOL, or QUOTED_ID.
- [Error] Line 660: Incorrect syntax near ')'.
- [Error] Line 661: Incorrect syntax near 'public'.
- [Error] Line 662: Incorrect syntax near ')'.
- [Error] Line 665: Incorrect syntax near 'POLICY'.
- [Error] Line 671: An expression of non-boolean type specified in a context where a condition is expected.
- [Error] Line 671: Incorrect syntax near 'public'.
- [Error] Line 672: Incorrect syntax near ')'.  Expecting ',', AND, or OR.
- [Error] Line 674: Incorrect syntax near 'POLICY'.
- [Error] Line 677: Incorrect syntax near 'WITH CHECK'.
- [Error] Line 678: Incorrect syntax near '('.  Expecting '.', ID, PSEUDOCOL, or QUOTED_ID.
- [Error] Line 678: Incorrect syntax near '='.
- [Error] Line 679: Incorrect syntax near 'public'.
- [Error] Line 680: Incorrect syntax near ')'.
- [Error] Line 682: Incorrect syntax near 'POLICY'.
- [Error] Line 686: Incorrect syntax near '('.
- [Error] Line 686: Incorrect syntax near 'SELECT'.  Expecting '.', ID, PSEUDOCOL, or QUOTED_ID.
- [Error] Line 686: Incorrect syntax near ')'.
- [Error] Line 687: Incorrect syntax near 'public'.
- [Error] Line 688: Incorrect syntax near ')'.
- [Error] Line 690: Incorrect syntax near 'POLICY'.
- [Error] Line 694: Incorrect syntax near '('.
- [Error] Line 694: Incorrect syntax near 'SELECT'.  Expecting '.', ID, PSEUDOCOL, or QUOTED_ID.
- [Error] Line 694: Incorrect syntax near ')'.
- [Error] Line 695: Incorrect syntax near 'public'.
- [Error] Line 696: Incorrect syntax near ')'.
- [Error] Line 699: Incorrect syntax near 'POLICY'.
- [Error] Line 708: Incorrect syntax near 'toegangsrechten'.  Expecting '(', or SELECT.
- [Error] Line 709: Incorrect syntax near ')'.  Expecting ',', AND, or OR.
- [Error] Line 710: Incorrect syntax near 'OR'.
- [Error] Line 710: Incorrect syntax near 'public'.
- [Error] Line 711: Incorrect syntax near ')'.
- [Error] Line 713: Incorrect syntax near 'POLICY'.
- [Error] Line 716: Incorrect syntax near 'WITH CHECK'.
- [Error] Line 717: Incorrect syntax near '('.  Expecting '.', ID, PSEUDOCOL, or QUOTED_ID.
- [Error] Line 717: Incorrect syntax near '='.
- [Error] Line 718: Incorrect syntax near 'public'.
- [Error] Line 719: Incorrect syntax near ')'.
- [Error] Line 721: Incorrect syntax near 'POLICY'.
- [Error] Line 725: Incorrect syntax near '('.
- [Error] Line 725: Incorrect syntax near 'SELECT'.  Expecting '.', ID, PSEUDOCOL, or QUOTED_ID.
- [Error] Line 725: Incorrect syntax near ')'.
- [Error] Line 726: Incorrect syntax near 'public'.
- [Error] Line 727: Incorrect syntax near ')'.
- [Error] Line 729: Incorrect syntax near 'POLICY'.
- [Error] Line 733: Incorrect syntax near '('.
- [Error] Line 733: Incorrect syntax near 'SELECT'.  Expecting '.', ID, PSEUDOCOL, or QUOTED_ID.
- [Error] Line 733: Incorrect syntax near ')'.
- [Error] Line 734: Incorrect syntax near 'public'.
- [Error] Line 735: Incorrect syntax near ')'.
- [Error] Line 738: Incorrect syntax near 'POLICY'.
- [Error] Line 743: An expression of non-boolean type specified in a context where a condition is expected.
- [Error] Line 743: Incorrect syntax near 'public'.
- [Error] Line 744: Incorrect syntax near ')'.  Expecting ',', AND, or OR.
- [Error] Line 746: Incorrect syntax near 'POLICY'.
- [Error] Line 749: Incorrect syntax near 'WITH CHECK'.
- [Error] Line 750: Incorrect syntax near '('.  Expecting '.', ID, PSEUDOCOL, or QUOTED_ID.
- [Error] Line 750: Incorrect syntax near '='.
- [Error] Line 751: Incorrect syntax near 'public'.
- [Error] Line 752: Incorrect syntax near ')'.
- [Error] Line 754: Incorrect syntax near 'POLICY'.
- [Error] Line 758: Incorrect syntax near '('.
- [Error] Line 758: Incorrect syntax near 'SELECT'.  Expecting '.', ID, PSEUDOCOL, or QUOTED_ID.
- [Error] Line 758: Incorrect syntax near ')'.
- [Error] Line 759: Incorrect syntax near 'public'.
- [Error] Line 760: Incorrect syntax near ')'.
- [Error] Line 762: Incorrect syntax near 'POLICY'.
- [Error] Line 766: Incorrect syntax near '('.
- [Error] Line 766: Incorrect syntax near 'SELECT'.  Expecting '.', ID, PSEUDOCOL, or QUOTED_ID.
- [Error] Line 766: Incorrect syntax near 'public'.
- [Error] Line 766: Incorrect syntax near ')'.
- [Error] Line 779: Incorrect syntax near '.'.  Expecting DOUBLECOLON, or ID.
- [Error] Line 779: Incorrect syntax near 'JSONB'.  Expecting '(', or SELECT.
- [Error] Line 780: Incorrect syntax near '.'.  Expecting DOUBLECOLON, or ID.
- [Error] Line 780: Incorrect syntax near 'UUID'.  Expecting '(', or SELECT.
- [Error] Line 781: Incorrect syntax near '.'.  Expecting DOUBLECOLON, or ID.
- [Error] Line 781: Incorrect syntax near 'UUID'.  Expecting '(', or SELECT.
- [Error] Line 782: Incorrect syntax near '.'.  Expecting DOUBLECOLON, or ID.
- [Error] Line 782: Incorrect syntax near 'TEXT'.  Expecting '(', or SELECT.
- [Error] Line 783: Incorrect syntax near '.'.  Expecting DOUBLECOLON, or ID.
- [Error] Line 783: Incorrect syntax near 'JSONB'.  Expecting '(', or SELECT.
- [Error] Line 784: Incorrect syntax near '.'.  Expecting DOUBLECOLON, or ID.
- [Error] Line 784: Incorrect syntax near 'UUID'.  Expecting '(', or SELECT.
- [Error] Line 785: Incorrect syntax near '.'.  Expecting DOUBLECOLON, or ID.
- [Error] Line 785: Incorrect syntax near 'TEXT'.  Expecting '(', or SELECT.
- [Error] Line 786: Incorrect syntax near '.'.  Expecting DOUBLECOLON, or ID.
- [Error] Line 786: Incorrect syntax near ')'.  Expecting '(', or SELECT.
- [Error] Line 788: Incorrect syntax near ';'.  Expecting CONVERSATION.<environment_details>
# VSCode Visible Files
database/schema.sql

# VSCode Open Tabs
types/core.ts
lib/security-headers.js
lib/supabase-client.ts
context/NotificationContext.tsx
containers/layout/TopbarContainer.tsx
containers/rapporten/RapportGeneratorContainer.tsx
app/rapporten/page.tsx
components/auth/AuthForm.tsx
containers/layout/SidebarContainer.tsx
containers/specialisten/AddSpecialistButtonContainer.tsx
lib/supabase.ts
containers/settings/ProfileFormContainer.tsx
app/dashboard/layout.tsx
app/taken/page.tsx
app/dashboard/page.tsx
app/overzicht/page.tsx
app/mijn-specialisten/page.tsx
app/mijn-specialisten/mijn-specialisten-client.tsx
app/overzicht/overzicht-client.tsx
next.config.js
app/api/reflecties/route.ts
app/api/task-logs/route.ts
app/auth-test/page.tsx
app/inzichten/page.tsx
hooks/useMutations.ts
app/taken/[id]/start/page.tsx
app/offline/page.tsx
app/globals.css
app/layout.tsx
containers/tasks/TaskExecutionContainer.tsx
lib/analytics/eventTracking.ts
components/admin/AdminSidebar.tsx
app/admin/layout.tsx
components/admin/AdminStatsCards.tsx
components/admin/RecentUsersTable.tsx
app/admin/page.tsx
app/admin/users/page.tsx
app/admin/subscriptions/page.tsx
app/admin/statistics/page.tsx
lib/monitoring/logger.ts
components/auth/AuthProvider.tsx
middleware.ts
OPTIMIZATION_CHECKLIST.md
app/api/tasks/route.ts
hooks/useSupabaseQuery.ts
app/api/task-logs/[id]/route.ts
app/api/profiles/[id]/route.ts
app/specialisten/patienten/page.tsx
lib/supabase-server.ts
app/api/specialist-patienten/route.ts
database/schema.sql

# Actively Running Terminals
## Original command: `npm run dev`

# Current Time
5/18/2025, 5:46:48 PM (Europe/Brussels, UTC+2:00)

# Context Window Usage
737,570 / 1,048.576K tokens used (70%)

# Current Mode
ACT MODE
</environment_details>
