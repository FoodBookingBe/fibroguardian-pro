# Database Schema Fixes

Dit document beschrijft de problemen die zijn gevonden in het database schema en de oplossingen die zijn geïmplementeerd.

## Geïdentificeerde Problemen

1. **Dubbele RLS Policies**: Het originele schema.sql bestand bevatte dubbele Row Level Security (RLS) policies na de COMMIT statement, wat SQL fouten veroorzaakte bij uitvoering van het script.

2. **Ontbrekende Velden in Reflecties Tabel**: De reflecties tabel miste de `pijn_score` en `vermoeidheid_score` velden die nodig zijn voor de AI validatie functionaliteit.

3. **SQL Dialect Incompatibiliteit**: Het schema.sql bestand bevatte PostgreSQL-specifieke syntax die niet compatibel is met SQL Server, wat leidde tot veel syntaxfouten in de editor.

4. **Onvolledige Indexes**: De indexes sectie was onvolledig, wat kan leiden tot prestatieproblemen bij het uitvoeren van queries.

## Geïmplementeerde Oplossingen

1. **Verwijderen van Dubbele RLS Policies**: Alle dubbele RLS policies zijn verwijderd en het schema is opgeschoond.

2. **Toevoegen van Pijn en Vermoeidheid Velden**: De `pijn_score` en `vermoeidheid_score` velden zijn toegevoegd aan de reflecties tabel met de juiste constraints:
   ```sql
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
   ```

3. **Correctie van SQL Dialect**: Het schema is geoptimaliseerd voor PostgreSQL, wat de standaard database is voor Supabase.

4. **Voltooien van Indexes Sectie**: De indexes sectie is volledig gemaakt met alle benodigde indexes voor optimale prestaties:
   ```sql
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
   ```

## Belang van Pijn en Vermoeidheid Velden

De `pijn_score` en `vermoeidheid_score` velden in de reflecties tabel zijn cruciaal voor de AI validatie functionaliteit. Deze velden:

1. **Maken Gedetailleerde Analyse Mogelijk**: De AI validatie functie in `utils/ai.ts` gebruikt deze velden om gedetailleerde feedback te geven aan gebruikers over hun pijn- en vermoeidheidsniveaus.

2. **Ondersteunen Visualisaties**: Deze velden worden gebruikt in grafieken en visualisaties om trends in pijn en vermoeidheid over tijd te tonen.

3. **Verbeteren Zorgverlener Inzicht**: Zorgverleners kunnen deze scores gebruiken om de voortgang van patiënten te monitoren en behandelplannen aan te passen.

4. **Faciliteren Onderzoek**: De geaggregeerde gegevens kunnen worden gebruikt voor onderzoek naar fibromyalgie en gerelateerde aandoeningen.

## Toepassing van Fixes op Productie Database

Om deze fixes toe te passen op een bestaande productie database, zijn er twee opties:

### Optie 1: Volledige Schema Herinstallatie (Aanbevolen voor Nieuwe Installaties)

Voor nieuwe installaties of als data verlies acceptabel is, kan het volledige schema.sql.fixed bestand worden uitgevoerd:

```bash
psql -h <host> -U <username> -d <database> -f schema.sql.fixed
```

### Optie 2: Incrementele Updates (Aanbevolen voor Bestaande Installaties)

Voor bestaande installaties waar data behouden moet blijven, gebruik het schema.sql.update bestand dat alleen de reflecties tabel wijzigt:

```bash
psql -h <host> -U <username> -d <database> -f schema.sql.update
```

Het schema.sql.update bestand bevat:

```sql
-- Update reflecties table to add pijn_score and vermoeidheid_score fields
ALTER TABLE reflecties 
ADD COLUMN pijn_score integer CHECK (pijn_score BETWEEN 1 AND 20),
ADD COLUMN vermoeidheid_score integer CHECK (vermoeidheid_score BETWEEN 1 AND 20);
```

### Verificatie na Update

Na het toepassen van de updates, verifieer dat:

1. De reflecties tabel de nieuwe velden bevat:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'reflecties';
   ```

2. De AI validatie functionaliteit correct werkt door een nieuwe reflectie te maken met pijn- en vermoeidheidsscores.

3. Er geen dubbele RLS policies zijn:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'reflecties';
   ```

## Conclusie

Deze fixes zorgen ervoor dat de database schema correct is gedefinieerd, met alle benodigde velden voor de AI validatie functionaliteit. De reflecties tabel bevat nu de `pijn_score` en `vermoeidheid_score` velden die nodig zijn voor de AI validatie, en alle dubbele RLS policies zijn verwijderd.

Door deze fixes toe te passen, zal de applicatie beter functioneren en zullen gebruikers meer inzicht krijgen in hun pijn- en vermoeidheidsniveaus.
