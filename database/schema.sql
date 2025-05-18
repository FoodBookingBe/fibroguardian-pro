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

-- Helper function to check if current user is an admin
create or replace function public.is_admin()
returns boolean
language sql
security definer
-- SET search_path = public -- Ensure 'profiles' table is found if not in public schema and using a different search_path
as $$
  select exists (
    select 1
    from public.profiles -- Explicitly schema-qualify if needed, assuming 'profiles' is in 'public'
    where id = auth.uid() and type = 'admin'
  );
$$;

-- Row Level Security (RLS) policies
alter table profiles enable row level security;
alter table tasks enable row level security;
alter table task_logs enable row level security;
alter table planning enable row level security;
alter table reflecties enable row level security;
alter table specialist_patienten enable row level security;
alter table inzichten enable row level security;
alter table abonnementen enable row level security;

-- RLS-beleid voor gebruikers
create policy "Gebruikers kunnen alleen eigen profiel zien"
on profiles for select using (auth.uid() = id);

create policy "Gebruikers kunnen alleen eigen profiel bewerken"
on profiles for update using (auth.uid() = id);

create policy "Admins hebben volledige toegang tot profielen"
on profiles for all -- SELECT, INSERT, UPDATE, DELETE
using (public.is_admin())
with check (public.is_admin());

-- RLS-beleid voor tasks
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

-- RLS-beleid voor specialisten
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

-- RLS-beleid voor task logs
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

-- RLS-beleid voor planning
create policy "Admins hebben volledige toegang tot planning"
on planning for all using (public.is_admin()) with check (public.is_admin());

create policy "Gebruikers kunnen alleen eigen planning zien"
on planning for select using (auth.uid() = user_id);

create policy "Gebruikers kunnen alleen eigen planning bewerken"
on planning for update using (auth.uid() = user_id);

create policy "Gebruikers kunnen alleen eigen planning aanmaken"
on planning for insert with check (auth.uid() = user_id);

create policy "Gebruikers kunnen alleen eigen planning verwijderen"
on planning for delete using (auth.uid() = user_id);

create policy "Specialisten kunnen planning zien van hun patiënten"
on planning for select using (
  exists (
    select 1 from specialist_patienten
    where specialist_id = auth.uid() 
    and patient_id = user_id
    and 'view_tasks' = any(toegangsrechten)
  )
);

-- RLS-beleid voor reflecties
create policy "Admins hebben volledige toegang tot reflecties"
on reflecties for all using (public.is_admin()) with check (public.is_admin());

create policy "Gebruikers kunnen alleen eigen reflecties zien"
on reflecties for select using (auth.uid() = user_id);

create policy "Gebruikers kunnen alleen eigen reflecties aanmaken"
on reflecties for insert with check (auth.uid() = user_id);

create policy "Gebruikers kunnen alleen eigen reflecties bewerken"
on reflecties for update using (auth.uid() = user_id);

create policy "Gebruikers kunnen alleen eigen reflecties verwijderen"
on reflecties for delete using (auth.uid() = user_id);

create policy "Specialisten kunnen reflecties zien van hun patiënten"
on reflecties for select using (
  exists (
    select 1 from specialist_patienten
    where specialist_id = auth.uid() 
    and patient_id = user_id
    and 'view_reflecties' = any(toegangsrechten)
  )
);

-- RLS-beleid voor specialist_patienten
create policy "Admins hebben volledige toegang tot specialist_patienten"
on specialist_patienten for all using (public.is_admin()) with check (public.is_admin());

create policy "Gebruikers kunnen zien met welke specialisten ze verbonden zijn"
on specialist_patienten for select using (auth.uid() = patient_id);

create policy "Specialisten kunnen hun eigen patiënten zien"
on specialist_patienten for select using (auth.uid() = specialist_id);

create policy "Specialisten kunnen patiënten toevoegen"
on specialist_patienten for insert with check (auth.uid() = specialist_id);

create policy "Specialisten kunnen patiëntrelaties bijwerken"
on specialist_patienten for update using (auth.uid() = specialist_id);

create policy "Specialisten kunnen patiëntrelaties verwijderen"
on specialist_patienten for delete using (auth.uid() = specialist_id);

-- RLS-beleid voor inzichten
create policy "Admins hebben volledige toegang tot inzichten"
on inzichten for all using (public.is_admin()) with check (public.is_admin());

create policy "Gebruikers kunnen alleen eigen inzichten zien"
on inzichten for select using (auth.uid() = user_id);

create policy "Gebruikers kunnen alleen eigen inzichten aanmaken"
on inzichten for insert with check (auth.uid() = user_id);

create policy "Specialisten kunnen inzichten zien van hun patiënten"
on inzichten for select using (
  exists (
    select 1 from specialist_patienten
    where specialist_id = auth.uid() 
    and patient_id = user_id
    and 'view_inzichten' = any(toegangsrechten)
  )
);

-- RLS-beleid voor abonnementen
create policy "Admins hebben volledige toegang tot abonnementen"
on abonnementen for all using (public.is_admin()) with check (public.is_admin());

create policy "Gebruikers kunnen alleen eigen abonnementen zien"
on abonnementen for select using (auth.uid() = user_id);

create policy "Gebruikers kunnen alleen eigen abonnementen aanmaken"
on abonnementen for insert with check (auth.uid() = user_id);

create policy "Gebruikers kunnen alleen eigen abonnementen bijwerken"
on abonnementen for update using (auth.uid() = user_id);

-- Index creation for performance
create index idx_tasks_user_id on tasks(user_id);
create index idx_task_logs_user_id on task_logs(user_id);
create index idx_task_logs_task_id on task_logs(task_id);
create index idx_planning_user_id_datum on planning(user_id, datum);
create index idx_specialist_patienten_specialist_id on specialist_patienten(specialist_id);
create index idx_specialist_patienten_patient_id on specialist_patienten(patient_id);
create index idx_inzichten_user_id on inzichten(user_id);
