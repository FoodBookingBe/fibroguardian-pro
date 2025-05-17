# Component Refactoring Inventory

Dit document bevat een geprioriteerde lijst van componenten die gerefactord moeten worden.
De focus ligt op het verplaatsen van data fetching en complexe state naar Container componenten,
en het standaardiseren van UI feedback (notificaties, error handling).


### Hoge Prioriteit (Data Fetching / Directe DB Calls / Kritieke UI Issues)

- [ ] **AIInsights** (components/dashboard/AIInsights.tsx)
  - Reden: Bevat data fetching/directe Supabase calls.
  - Actie: Maak Container + Presentational componenten.
- [ ] **Sidebar** (components/layout/Sidebar.tsx)
  - Reden: Bevat data fetching/directe Supabase calls.
  - Actie: Maak Container + Presentational componenten.
- [ ] **Topbar** (components/layout/Topbar.tsx)
  - Reden: Bevat data fetching/directe Supabase calls.
  - Actie: Maak Container + Presentational componenten.
- [ ] **RapportGenerator** (components/rapporten/RapportGenerator.tsx)
  - Reden: Bevat data fetching/directe Supabase calls.
  - Actie: Maak Container + Presentational componenten.
- [ ] **ReflectieForm** (components/reflecties/ReflectieForm.tsx)
  - Reden: Bevat data fetching/directe Supabase calls.
  - Actie: Maak Container + Presentational componenten.
- [ ] **ProfileForm** (components/settings/ProfileForm.tsx)
  - Reden: Bevat data fetching/directe Supabase calls.
  - Actie: Maak Container + Presentational componenten.
- [ ] **AddPatientButton** (components/specialisten/AddPatientButton.tsx)
  - Reden: Bevat data fetching/directe Supabase calls. Gebruikt window.location.reload().
  - Actie: Maak Container + Presentational componenten.
- [ ] **AddSpecialistButton** (components/specialisten/AddSpecialistButton.tsx)
  - Reden: Bevat data fetching/directe Supabase calls. Gebruikt window.location.reload().
  - Actie: Maak Container + Presentational componenten.
- [ ] **PatientDetails** (components/specialisten/PatientDetails.tsx)
  - Reden: Bevat data fetching/directe Supabase calls.
  - Actie: Maak Container + Presentational componenten.
- [ ] **TaskExecution** (components/tasks/TaskExecution.tsx)
  - Reden: Bevat data fetching/directe Supabase calls.
  - Actie: Maak Container + Presentational componenten.
- [ ] **TaskForm** (components/tasks/TaskForm.tsx)
  - Reden: Bevat data fetching/directe Supabase calls.
  - Actie: Maak Container + Presentational componenten.
- [ ] **TaskLogs** (components/tasks/TaskLogs.tsx)
  - Reden: Bevat data fetching/directe Supabase calls.
  - Actie: Maak Container + Presentational componenten.
- [ ] **TasksPageClient** (components/tasks/TasksPageClient.tsx)
  - Reden: Bevat data fetching/directe Supabase calls.
  - Actie: Maak Container + Presentational componenten.
- [ ] **AIInsightsContainer** (containers/dashboard/AIInsightsContainer.tsx)
  - Reden: Bevat data fetching/directe Supabase calls.
  - Actie: Maak Container + Presentational componenten.


### Gemiddelde Prioriteit (Client Componenten met State / UI Issues)

- [ ] **AIInsightVisualization** (components/ai/AIInsightVisualization.tsx)
  - Reden: Client component met state management.
- [ ] **AuthForm** (components/auth/AuthForm.tsx)
  - Reden: Client component met state management.
- [ ] **AuthProvider** (components/auth/AuthProvider.tsx)
  - Reden: Client component met state management.
- [ ] **HealthMetrics** (components/dashboard/HealthMetrics.tsx)
  - Reden: Client component met state management.
- [ ] **HealthMetricsChart** (components/dashboard/HealthMetricsChart.tsx)
  - Reden: Client component met state management.
- [ ] **SessionStatus** (components/debug/SessionStatus.tsx)
  - Reden: Client component met state management.
- [ ] **DashboardLayout** (components/layout/DashboardLayout.tsx)
  - Reden: Client component met state management.
- [ ] **PatientList** (components/specialisten/PatientList.tsx)
  - Reden: Client component met state management.
- [ ] **TaskFilters** (components/tasks/TaskFilters.tsx)
  - Reden: Client component met state management.


### Lage Prioriteit (Client Componenten - Handmatige Check Nodig)

- [ ] **NotificationSystem** (components/common/NotificationSystem.tsx)
  - Reden: Client component, handmatige check nodig.
- [ ] **QuickActions** (components/dashboard/QuickActions.tsx)
  - Reden: Client component, handmatige check nodig.
- [ ] **AddTaskButton** (components/tasks/AddTaskButton.tsx)
  - Reden: Client component, handmatige check nodig.


## Refactoring Instructies

Voor componenten die een Container + Presentational split nodig hebben:

1.  **Maak een Container component** (bv. in een nieuwe `containers/` map of naast het presentational component):
    *   Verantwoordelijk voor data fetching (met React Query hooks) en state management.
    *   Gebruikt `ConditionalRender` voor loading/error/empty states.
    *   Definieert alle event handlers en callbacks.
    *   Rendert het Presentational component en geeft alle benodigde data en functies als props door.
2.  **Refactor het oorspronkelijke component naar een Presentational component:**
    *   Verwijder alle data fetching, directe Supabase calls, en complexe state logica.
    *   Accepteert alleen props en is verantwoordelijk voor de UI rendering.
    *   Gebruik `React.memo` voor optimalisatie indien zinvol.
3.  **Update de parent componenten** om de nieuwe Container component te gebruiken.

Voor andere refactorings (bv. vervangen `window.alert`, `window.location.reload`):
*   Gebruik `useNotification()` voor gebruikersfeedback.
*   Gebruik `queryClient.invalidateQueries()` na mutaties om data te verversen i.p.v. `window.location.reload()`.
