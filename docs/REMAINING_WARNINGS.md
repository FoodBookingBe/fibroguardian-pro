# Resterende Supabase Waarschuwingen

Dit document beschrijft de resterende waarschuwingen in Supabase na het uitvoeren van het gecorrigeerde database schema en hoe deze kunnen worden opgelost.

## Waarschuwing 1: Function Search Path Mutable

### Beschrijving
Deze waarschuwing geeft aan dat bepaalde functies een "role mutable search_path" hebben, wat een beveiligingsrisico kan zijn. Dit betekent dat de zoekpad voor deze functies kan worden gewijzigd door de gebruiker, wat kan leiden tot SQL-injectie aanvallen.

### Getroffen Functies
- `public.handle_new_user`
- `public.secure_insert_task`
- `public.secure_update_task`
- `public.log_action`

### Oplossing
Voor elke functie die deze waarschuwing geeft, moet de `SECURITY DEFINER` en `SET search_path = public` (of een andere geschikte schema) worden toegevoegd aan de functiedefinitie. In het gecorrigeerde schema hebben we dit al toegepast op de `update_updated_at()` functie en andere functies die we hebben gedefinieerd.

Voor functies die niet in ons schema zijn gedefinieerd, maar wel in de database bestaan, moet je deze als volgt aanpassen:

```sql
-- Voorbeeld voor handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS [return_type] AS $$
BEGIN
  -- Functie-inhoud
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Voorbeeld voor secure_insert_task
CREATE OR REPLACE FUNCTION public.secure_insert_task()
RETURNS [return_type] AS $$
BEGIN
  -- Functie-inhoud
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Voorbeeld voor secure_update_task
CREATE OR REPLACE FUNCTION public.secure_update_task()
RETURNS [return_type] AS $$
BEGIN
  -- Functie-inhoud
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Voorbeeld voor log_action
CREATE OR REPLACE FUNCTION public.log_action()
RETURNS [return_type] AS $$
BEGIN
  -- Functie-inhoud
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;
```

Vervang `[return_type]` en de functie-inhoud met de juiste waarden voor elke functie.

## Waarschuwing 2: Materialized View in API

### Beschrijving
Deze waarschuwing geeft aan dat de materialized view `public.patient_activity_summary` toegankelijk is via de Data APIs, wat een beveiligingsrisico kan zijn.

### Oplossing
In het gecorrigeerde schema hebben we dit opgelost door:
1. Een beveiligde functie te maken die de toegang controleert
2. Deze functie gebruikt SECURITY DEFINER en controleert de toegangsrechten
3. Rechten te verlenen op de functie aan authenticated gebruikers

```sql
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
```

Deze aanpak werkt omdat we de directe toegang tot de materialized view omzeilen door een beveiligde functie te gebruiken. De functie controleert de toegangsrechten en retourneert alleen de gegevens waar de gebruiker toegang toe heeft. Dit is een robuuste oplossing die werkt in Supabase, aangezien we hebben ontdekt dat RLS niet kan worden ingeschakeld voor materialized views of views.

## Waarschuwing 3: Auth RLS Initialization Plan

### Beschrijving
Deze waarschuwing geeft aan dat `auth.uid()` direct wordt gebruikt in RLS policies, wat kan leiden tot suboptimale query performance. Voor elke rij in de tabel wordt `auth.uid()` opnieuw geëvalueerd, wat inefficiënt is.

### Getroffen Policies
Veel RLS policies in verschillende tabellen, waaronder:
- `profiles`: "Gebruikers kunnen alleen eigen profiel zien", "Gebruikers kunnen alleen eigen profiel bewerken"
- `tasks`: "Gebruikers kunnen alleen eigen taken zien", "Gebruikers kunnen alleen eigen taken aanmaken", etc.
- `task_logs`: "Gebruikers kunnen alleen eigen logs zien", "Gebruikers kunnen alleen eigen logs aanmaken", etc.
- En vele andere policies in andere tabellen

### Oplossing
Vervang `auth.uid()` door `(SELECT auth.uid())` in alle RLS policies. Dit zorgt ervoor dat `auth.uid()` slechts één keer wordt geëvalueerd voor de hele query, in plaats van voor elke rij.

Bijvoorbeeld, verander:
```sql
CREATE POLICY "Gebruikers kunnen alleen eigen profiel zien"
ON profiles FOR SELECT USING (auth.uid() = id);
```

Naar:
```sql
CREATE POLICY "Gebruikers kunnen alleen eigen profiel zien"
ON profiles FOR SELECT USING ((SELECT auth.uid()) = id);
```

Dit moet worden toegepast op alle RLS policies die `auth.uid()` gebruiken.

## Waarschuwing 4: Multiple Permissive Policies

### Beschrijving
Deze waarschuwing geeft aan dat er meerdere permissive policies zijn voor dezelfde rol en actie, wat kan leiden tot suboptimale query performance. Elke policy moet worden geëvalueerd voor elke relevante query.

### Getroffen Tabellen
Meerdere tabellen hebben dit probleem, waaronder:
- `profiles`: Meerdere policies voor SELECT en UPDATE
- `tasks`: Meerdere policies voor SELECT, INSERT, UPDATE en DELETE
- `task_logs`: Meerdere policies voor SELECT en INSERT

### Oplossing
Combineer meerdere permissive policies voor dezelfde rol en actie in één policy met een OR-conditie. Bijvoorbeeld, in plaats van:

```sql
CREATE POLICY "Admins hebben volledige toegang tot profielen"
ON profiles FOR SELECT USING (public.is_admin());

CREATE POLICY "Gebruikers kunnen alleen eigen profiel zien"
ON profiles FOR SELECT USING (auth.uid() = id);
```

Gebruik:

```sql
CREATE POLICY "Profielen_select_policy"
ON profiles FOR SELECT USING (
  (SELECT auth.uid()) = id
  OR (SELECT public.is_admin())
);
```

Dit moet worden toegepast op alle tabellen met meerdere permissive policies voor dezelfde rol en actie.

## Waarschuwing 5: Leaked Password Protection Disabled

### Beschrijving
Deze waarschuwing geeft aan dat de bescherming tegen gelekte wachtwoorden is uitgeschakeld in Supabase Auth. Deze functie controleert wachtwoorden tegen HaveIBeenPwned.org om te voorkomen dat gecompromitteerde wachtwoorden worden gebruikt.

### Oplossing
Dit is een instelling in Supabase Auth en niet direct gerelateerd aan het database schema. Om dit op te lossen:

1. Ga naar het Supabase dashboard
2. Selecteer je project
3. Ga naar "Authentication" > "Settings"
4. Scroll naar beneden naar de sectie "Password Security"
5. Schakel "Leaked Password Protection" in
6. Klik op "Save"

## Conclusie

Na het uitvoeren van het gecorrigeerde schema en het toepassen van de bovenstaande oplossingen, zouden alle waarschuwingen in Supabase moeten zijn opgelost. Als er nog steeds waarschuwingen zijn, controleer dan of alle stappen correct zijn uitgevoerd en of er geen nieuwe waarschuwingen zijn toegevoegd.

Voor de functies die niet in ons schema zijn gedefinieerd, moet je eerst de huidige definitie van deze functies ophalen uit de database voordat je ze aanpast. Dit kan worden gedaan met de volgende query:

```sql
SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'function_name' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
```

Vervang `function_name` met de naam van de functie die je wilt ophalen (bijvoorbeeld `handle_new_user`).

## Voorbeeld Script voor RLS Policy Optimalisatie

Hier is een voorbeeld script dat alle RLS policies optimaliseert door `auth.uid()` te vervangen door `(SELECT auth.uid())` en meerdere permissive policies te combineren:

```sql
-- Verwijder bestaande policies voor profiles
DROP POLICY IF EXISTS "Gebruikers kunnen alleen eigen profiel zien" ON profiles;
DROP POLICY IF EXISTS "Gebruikers kunnen alleen eigen profiel bewerken" ON profiles;
DROP POLICY IF EXISTS "Admins hebben volledige toegang tot profielen" ON profiles;

-- Maak geoptimaliseerde policies voor profiles
CREATE POLICY "Profiles_select_policy"
ON profiles FOR SELECT USING (
  (SELECT auth.uid()) = id
  OR (SELECT public.is_admin())
);

CREATE POLICY "Profiles_update_policy"
ON profiles FOR UPDATE USING (
  (SELECT auth.uid()) = id
  OR (SELECT public.is_admin())
);

CREATE POLICY "Profiles_insert_delete_policy"
ON profiles FOR ALL USING (
  (SELECT public.is_admin())
);

-- Verwijder bestaande policies voor tasks
DROP POLICY IF EXISTS "Admins hebben volledige toegang tot tasks" ON tasks;
DROP POLICY IF EXISTS "Gebruikers kunnen alleen eigen taken zien" ON tasks;
DROP POLICY IF EXISTS "Gebruikers kunnen alleen eigen taken aanmaken" ON tasks;
DROP POLICY IF EXISTS "Gebruikers kunnen alleen eigen taken bewerken" ON tasks;
DROP POLICY IF EXISTS "Gebruikers kunnen alleen eigen taken verwijderen" ON tasks;
DROP POLICY IF EXISTS "Specialisten kunnen taken zien van hun patiënten" ON tasks;
DROP POLICY IF EXISTS "Specialisten kunnen taken aanmaken voor hun patiënten" ON tasks;

-- Maak geoptimaliseerde policies voor tasks
CREATE POLICY "Tasks_select_policy"
ON tasks FOR SELECT USING (
  (SELECT auth.uid()) = user_id
  OR EXISTS (
    SELECT 1 FROM specialist_patienten
    WHERE specialist_id = (SELECT auth.uid())
    AND patient_id = user_id
    AND 'view_tasks' = ANY(toegangsrechten)
  )
  OR (SELECT public.is_admin())
);

CREATE POLICY "Tasks_insert_policy"
ON tasks FOR INSERT WITH CHECK (
  (SELECT auth.uid()) = user_id
  OR EXISTS (
    SELECT 1 FROM specialist_patienten
    WHERE specialist_id = (SELECT auth.uid())
    AND patient_id = user_id
    AND 'create_tasks' = ANY(toegangsrechten)
  )
  OR (SELECT public.is_admin())
);

CREATE POLICY "Tasks_update_policy"
ON tasks FOR UPDATE USING (
  (SELECT auth.uid()) = user_id
  OR (SELECT public.is_admin())
);

CREATE POLICY "Tasks_delete_policy"
ON tasks FOR DELETE USING (
  (SELECT auth.uid()) = user_id
  OR (SELECT public.is_admin())
);
```

Dit script kan worden uitgebreid voor alle tabellen met RLS policies.
