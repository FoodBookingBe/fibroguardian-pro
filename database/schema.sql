-- Schema voor FibroGuardian Pro

-- 1. Gebruikersprofiel uitbreiding
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  voornaam text,
  achternaam text,
  avatar_url text,
  type text check (type in ('patient', 'specialist', 'admin')) default 'patient', -- Added 'admin'
  postcode text,
  gemeente text,
  geboortedatum date,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 2. Taken en opdrachten
create table tasks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  type text check (type in ('taak', 'opdracht')) not null,
  titel text not null,
  beschrijving text,
  duur integer, -- in minuten
  hartslag_doel integer,
  herhaal_patroon text check (herhaal_patroon in ('eenmalig', 'dagelijks', 'wekelijks', 'maandelijks', 'aangepast')),
  dagen_van_week text[],
  metingen text[],
  notities text,
  labels text[],
  specialist_id uuid references auth.users,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 3. Logs van uitgevoerde taken
create table task_logs (
  id uuid default uuid_generate_v4() primary key,
  task_id uuid references tasks on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  start_tijd timestamptz not null,
  eind_tijd timestamptz,
  energie_voor integer check (energie_voor between 1 and 20),
  energie_na integer check (energie_na between 1 and 20),
  pijn_score integer check (pijn_score between 1 and 20),
  vermoeidheid_score integer check (vermoeidheid_score between 1 and 20),
  stemming text,
  hartslag integer,
  notitie text,
  ai_validatie text,
  created_at timestamptz default now() not null
);

-- 4. Dagplanning
create table planning (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  datum date not null,
  task_ids uuid[],
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 5. Reflecties
create table reflecties (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  datum date not null,
  stemming text,
  notitie text,
  ai_validatie text,
  created_at timestamptz default now() not null
);

-- 6. Specialist-patiënt relaties
create table specialist_patienten (
  id uuid default uuid_generate_v4() primary key,
  specialist_id uuid references auth.users on delete cascade not null,
  patient_id uuid references auth.users on delete cascade not null,
  toegangsrechten text[] default array['view_tasks', 'view_logs', 'create_tasks'],
  created_at timestamptz default now() not null,
  unique(specialist_id, patient_id)
);

-- 7. AI-gegenereerde inzichten
create table inzichten (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  periode text check (periode in ('dag', 'week', 'maand')) not null,
  trend_type text,
  beschrijving text not null,
  gegenereerd_door_ai boolean default true,
  created_at timestamptz default now() not null
);

-- 8. Abonnementen voor specialisten
create table abonnementen (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan_type text check (plan_type in ('basis', 'premium', 'enterprise')),
  max_patienten integer,
  verloopt_op timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Trigger om automatisch een profiel aan te maken voor nieuwe gebruikers
CREATE OR REPLACE FUNCTION public.create_profile_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, created_at, updated_at) -- Explicitly list columns
  VALUES (new.id, now(), now());
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists to avoid errors bij het opnieuw uitvoeren
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;

-- Maak trigger aan die activeert bij nieuwe gebruikers
CREATE TRIGGER create_profile_on_signup
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.create_profile_for_new_user();

-- Automatische updates
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tasks_updated_at
before update on tasks
for each row execute function update_updated_at();

create trigger planning_updated_at
before update on planning
for each row execute function update_updated_at();

create trigger profiles_updated_at
before update on profiles
for each row execute function update_updated_at();

create trigger abonnementen_updated_at
before update on abonnementen
for each row execute function update_updated_at();

-- Helper function to check if current user is an admin (User's optimized version)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
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
RETURNS SETOF tasks -- Returns the created task(s)
SECURITY DEFINER
-- Set a secure search_path for SECURITY DEFINER functions
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
    dagen_van_week, -- Assuming client sends as JSON array of strings
    metingen,       -- Assuming client sends as JSON array of strings
    notities,
    labels,         -- Assuming client sends as JSON array of strings
    specialist_id
    -- created_at and updated_at have defaults and will be set automatically
    -- id has a default and will be set automatically
  )
  VALUES (
    owner_user_id,
    task_data->>'type',
    task_data->>'titel',
    task_data->>'beschrijving', -- Will be NULL if not present in JSONB
    (task_data->>'duur')::integer, -- Will be NULL if not present or not a valid integer
    (task_data->>'hartslag_doel')::integer,
    task_data->>'herhaal_patroon',
    CASE WHEN task_data->'dagen_van_week' IS NOT NULL AND jsonb_typeof(task_data->'dagen_van_week') = 'array'
         THEN ARRAY(SELECT jsonb_array_elements_text(task_data->'dagen_van_week')) ELSE NULL END,
    CASE WHEN task_data->'metingen' IS NOT NULL AND jsonb_typeof(task_data->'metingen') = 'array'
         THEN ARRAY(SELECT jsonb_array_elements_text(task_data->'metingen')) ELSE NULL END,
    task_data->>'notities',
    CASE WHEN task_data->'labels' IS NOT NULL AND jsonb_typeof(task_data->'labels') = 'array'
         THEN ARRAY(SELECT jsonb_array_elements_text(task_data->'labels')) ELSE NULL END,
    (task_data->>'specialist_id')::uuid -- Will be NULL if not present or not a valid UUID
  )
  RETURNING *;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users so they can call this function
GRANT EXECUTE ON FUNCTION public.create_task_with_owner(JSONB, UUID) TO authenticated;

-- Function to get a profile for a specific owner, bypassing RLS for the select itself
CREATE OR REPLACE FUNCTION public.get_profile_for_owner(
  owner_user_id UUID
)
RETURNS SETOF profiles -- Returns the profile record
SECURITY DEFINER
-- Set a secure search_path for SECURITY DEFINER functions
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.profiles
  WHERE id = owner_user_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_profile_for_owner(UUID) TO authenticated;

-- Function to update a task log for a specific owner, ensuring ownership, bypassing RLS for the update itself
CREATE OR REPLACE FUNCTION public.update_task_log_for_owner(
  p_log_id UUID,
  p_log_data JSONB,
  p_owner_user_id UUID
)
RETURNS SETOF task_logs -- Returns the updated task log
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
    -- Or, to mimic a 404, just return nothing:
    -- RETURN; 
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
    -- task_id and user_id should generally not be updated here
  WHERE id = p_log_id AND user_id = p_owner_user_id -- Redundant check, but safe
  RETURNING *;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.update_task_log_for_owner(UUID, JSONB, UUID) TO authenticated;

-- Function to get a user ID from auth.users by email
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(p_email TEXT)
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT id FROM auth.users WHERE email = p_email LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_id_by_email(TEXT) TO authenticated;


-- Row Level Security (RLS) policies
alter table profiles enable row level security;
alter table tasks enable row level security;
alter table task_logs enable row level security;
alter table planning enable row level security;
alter table reflecties enable row level security;
alter table specialist_patienten enable row level security;
alter table inzichten enable row level security;
alter table abonnementen enable row level security;

-- RLS-beleid voor profiles (Behouden van bestaande, inclusief admin)
create policy "Gebruikers kunnen alleen eigen profiel zien"
on profiles for select using (auth.uid() = id);

create policy "Gebruikers kunnen alleen eigen profiel bewerken"
on profiles for update using (auth.uid() = id);

create policy "Admins hebben volledige toegang tot profielen"
on profiles for all
using (public.is_admin())
with check (public.is_admin());

-- RLS-beleid voor tasks (Behouden van bestaande, inclusief admin)
create policy "Admins hebben volledige toegang tot tasks"
on tasks for all using (public.is_admin()) with check (public.is_admin());

create policy "Gebruikers kunnen alleen eigen taken zien"
on tasks for select using (auth.uid() = user_id);

create policy "Gebruikers kunnen alleen eigen taken aanmaken"
on tasks for insert with check (auth.uid() = user_id);

create policy "Gebruikers kunnen alleen eigen taken bewerken"
on tasks for update using (auth.uid() = user_id);

create policy "Gebruikers kunnen alleen eigen taken verwijderen"
on tasks for delete using (auth.uid() = user_id);

create policy "Specialisten kunnen taken zien van hun patiënten"
on tasks for select using (
  exists (
    select 1 from specialist_patienten
    where specialist_id = auth.uid() 
    and patient_id = user_id
    and 'view_tasks' = any(toegangsrechten)
  )
);

create policy "Specialisten kunnen taken aanmaken voor hun patiënten"
on tasks for insert with check (
  exists (
    select 1 from specialist_patienten
    where specialist_id = auth.uid() 
    and patient_id = user_id
    and 'create_tasks' = any(toegangsrechten)
  )
);

-- RLS-beleid voor task logs (Behouden van bestaande, inclusief admin)
create policy "Admins hebben volledige toegang tot task_logs"
on task_logs for all using (public.is_admin()) with check (public.is_admin());

create policy "Gebruikers kunnen alleen eigen logs zien"
on task_logs for select using (auth.uid() = user_id);

create policy "Gebruikers kunnen alleen eigen logs aanmaken"
on task_logs for insert with check (auth.uid() = user_id);

create policy "Specialisten kunnen logs zien van hun patiënten"
on task_logs for select using (
  exists (
    select 1 from specialist_patienten
    where specialist_id = auth.uid() 
    and patient_id = user_id
    and 'view_logs' = any(toegangsrechten)
  )
);

-- Nieuwe geoptimaliseerde policies van gebruiker:
-- ===== planning tabel =====
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

-- ===== reflecties tabel =====
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

-- ===== specialist_patienten tabel =====
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

-- ===== inzichten tabel =====
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

-- ===== abonnementen tabel =====
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

-- Index creation for performance
create index idx_tasks_user_id on tasks(user_id);
create index idx_task_logs_user_id on task_logs(user_id);
create index idx_task_logs_task_id on task_logs(task_id);
create index idx_planning_user_id_datum on planning(user_id, datum);
create index idx_specialist_patienten_specialist_id on specialist_patienten(specialist_id);
create index idx_specialist_patienten_patient_id on specialist_patienten(patient_id);
create index idx_inzichten_user_id on inzichten(user_id);
