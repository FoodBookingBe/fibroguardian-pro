# Supabase Database Correctie Instructies

Dit document bevat stap-voor-stap instructies voor het corrigeren van de database in Supabase. Er zijn twee opties: een volledige reset van de database of een incrementele update.

## Optie 1: Volledige Reset (Schone Lei)

Deze optie is aanbevolen als u met een nieuwe database wilt beginnen of als data verlies acceptabel is.

### Stap 1: Maak een backup (optioneel maar sterk aanbevolen)

1. Ga naar het Supabase dashboard
2. Selecteer uw project
3. Ga naar de "Database" sectie
4. Klik op "Backups" in het linkermenu
5. Klik op "Create Backup" en volg de instructies

### Stap 2: Implementeer het gecorrigeerde schema

1. Ga naar het Supabase dashboard
2. Selecteer uw project
3. Ga naar de "SQL Editor" sectie
4. Klik op "New Query"
5. Open het bestand `database/schema.sql.correct` in uw lokale editor
6. Kopieer de volledige inhoud van dit bestand
7. Plak de inhoud in de SQL Editor in Supabase
8. Klik op "Run" om het gecorrigeerde schema te implementeren

Dit script zal:
- Alle bestaande tabellen, functies, triggers en materialized views verwijderen
- Alle objecten in de juiste volgorde opnieuw aanmaken
- De juiste RLS policies instellen
- De benodigde indexes aanmaken
- De vereiste permissies toekennen
- Verificatie queries uitvoeren om te controleren of alles correct is geïmplementeerd

### Stap 3: Verifieer de implementatie

1. Ga naar de "Table Editor" sectie in Supabase
2. Controleer of alle tabellen correct zijn aangemaakt
3. Controleer specifiek de `reflecties` tabel om te zien of deze de `pijn_score` en `vermoeidheid_score` velden bevat
4. Controleer of er geen waarschuwingen meer zijn in het Supabase dashboard
5. Bekijk de resultaten van de verificatie queries die aan het einde van het script zijn uitgevoerd

## Optie 2: Incrementele Update (Behoud Bestaande Data)

Deze optie is aanbevolen als u bestaande data wilt behouden.

### Stap 1: Maak een backup (verplicht voor deze optie)

1. Ga naar het Supabase dashboard
2. Selecteer uw project
3. Ga naar de "Database" sectie
4. Klik op "Backups" in het linkermenu
5. Klik op "Create Backup" en volg de instructies

### Stap 2: Voer de incrementele update uit

1. Ga naar het Supabase dashboard
2. Selecteer uw project
3. Ga naar de "SQL Editor" sectie
4. Klik op "New Query"
5. Open het bestand `database/schema.sql.update` in uw lokale editor
6. Kopieer de volledige inhoud van dit bestand
7. Plak de inhoud in de SQL Editor in Supabase
8. Klik op "Run" om de incrementele update uit te voeren

### Stap 3: Verwijder dubbele RLS policies

1. Blijf in de "SQL Editor" sectie
2. Klik opnieuw op "New Query"
3. Voer het volgende SQL commando in om dubbele RLS policies te identificeren en verwijderen:

```sql
-- Identificeer dubbele RLS policies
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
  'DROP POLICY IF EXISTS ' || policyname || ' ON ' || tablename || ';' as drop_statement
FROM 
  duplicate_policies;
```

4. Noteer de resulterende DROP POLICY statements
5. Maak een nieuwe query en voer de DROP POLICY statements uit die in de vorige stap zijn geïdentificeerd
6. Voer vervolgens het volgende commando uit om de correcte RLS policies opnieuw aan te maken:

```sql
-- Voeg de correcte RLS policies toe voor de reflecties tabel
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
```

### Stap 4: Voeg ontbrekende indexes toe

1. Blijf in de "SQL Editor" sectie
2. Klik opnieuw op "New Query"
3. Voer het volgende SQL commando in om de ontbrekende indexes toe te voegen:

```sql
-- Voeg basis indexes toe voor performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_task_logs_user_id ON task_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_task_logs_task_id ON task_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_planning_user_id_datum ON planning(user_id, datum);
CREATE INDEX IF NOT EXISTS idx_specialist_patienten_specialist_id ON specialist_patienten(specialist_id);
CREATE INDEX IF NOT EXISTS idx_specialist_patienten_patient_id ON specialist_patienten(patient_id);
CREATE INDEX IF NOT EXISTS idx_inzichten_user_id ON inzichten(user_id);

-- Voeg aanvullende indexes toe voor efficiëntere queries
CREATE INDEX IF NOT EXISTS idx_profiles_type ON profiles(type);
CREATE INDEX IF NOT EXISTS idx_task_logs_start_tijd ON task_logs(start_tijd);
CREATE INDEX IF NOT EXISTS idx_task_logs_user_id_start_tijd ON task_logs(user_id, start_tijd);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id_type ON tasks(user_id, type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_patient_activity_summary ON patient_activity_summary(user_id, activity_date);
```

### Stap 5: Verifieer de implementatie

1. Ga naar de "Table Editor" sectie in Supabase
2. Controleer of de `reflecties` tabel nu de `pijn_score` en `vermoeidheid_score` velden bevat
3. Controleer of er geen dubbele RLS policies meer zijn door de volgende query uit te voeren:

```sql
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
```

4. Controleer of alle indexes correct zijn aangemaakt door de volgende query uit te voeren:

```sql
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
```

5. Controleer of er geen waarschuwingen meer zijn in het Supabase dashboard

## Problemen Oplossen

Als u problemen ondervindt tijdens het uitvoeren van deze instructies, probeer dan het volgende:

1. **SQL Fouten**: Als u SQL fouten krijgt, controleer dan de foutmelding zorgvuldig. Vaak geven deze duidelijke aanwijzingen over wat er mis is.

2. **Volgorde van Uitvoering**: Zorg ervoor dat u de commando's in de juiste volgorde uitvoert. Tabellen moeten bijvoorbeeld worden verwijderd voordat ze opnieuw worden aangemaakt.

3. **Bestaande Objecten**: Als een object al bestaat, gebruik dan de `IF NOT EXISTS` clausule of verwijder het object eerst met `DROP ... IF EXISTS`.

4. **Permissies**: Zorg ervoor dat u voldoende rechten heeft om de commando's uit te voeren. Als u niet de eigenaar van het Supabase project bent, vraag dan de eigenaar om hulp.

5. **Restore Backup**: Als er iets misgaat, kunt u altijd de backup herstellen die u in stap 1 heeft gemaakt.

## Conclusie

Na het volgen van deze instructies zou uw Supabase database correct moeten zijn geconfigureerd zonder waarschuwingen. De `reflecties` tabel bevat nu de `pijn_score` en `vermoeidheid_score` velden die nodig zijn voor de AI validatie functionaliteit, en alle dubbele RLS policies zijn verwijderd.
