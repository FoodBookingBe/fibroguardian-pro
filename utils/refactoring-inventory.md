# Component Refactoring Inventory

Dit document bevat een geprioriteerde lijst van componenten die gerefactord moeten worden.
De focus ligt op het verplaatsen van data fetching en complexe state naar Container componenten,
en het standaardiseren van UI feedback (notificaties, error handling).


### Hoge Prioriteit (Data Fetching / Directe DB Calls / Kritieke UI Issues)

- [x] **AIInsights** (Refactored to AIInsightsContainer.tsx & AIInsightsPresentational.tsx)
  - Reden: Bevat data fetching/directe Supabase calls.
  - Actie: Maak Container + Presentational componenten. (Voltooid)
- [x] **Sidebar** (containers/layout/SidebarContainer.tsx & components/layout/SidebarPresentational.tsx)
  - Reden: Bevat data fetching/directe Supabase calls.
  - Actie: Maak Container + Presentational componenten. (Voltooid)
- [x] **Topbar** (containers/layout/TopbarContainer.tsx & components/layout/TopbarPresentational.tsx)
  - Reden: Bevat data fetching/directe Supabase calls.
  - Actie: Maak Container + Presentational componenten. (Voltooid)
- [x] **RapportGenerator** (containers/rapporten/RapportGeneratorContainer.tsx & components/rapporten/RapportGeneratorPresentational.tsx)
  - Reden: Bevat data fetching/directe Supabase calls.
  - Actie: Maak Container + Presentational componenten. (Voltooid)
- [x] **ReflectieForm** (containers/reflecties/ReflectieFormContainer.tsx & components/reflecties/ReflectieFormPresentational.tsx)
  - Reden: Bevat data fetching/directe Supabase calls.
  - Actie: Maak Container + Presentational componenten. (Voltooid)
- [x] **ProfileForm** (containers/settings/ProfileFormContainer.tsx & components/settings/ProfileFormPresentational.tsx)
  - Reden: Bevat data fetching/directe Supabase calls.
  - Actie: Maak Container + Presentational componenten. (Voltooid)
- [x] **AddPatientButton** (containers/specialisten/AddPatientButtonContainer.tsx & components/specialisten/AddPatientButtonPresentational.tsx)
  - Reden: Bevat data fetching/directe Supabase calls. Gebruikt window.location.reload().
  - Actie: Maak Container + Presentational componenten. (Voltooid, window.location.reload() vervangen door query invalidation)
- [x] **AddSpecialistButton** (containers/specialisten/AddSpecialistButtonContainer.tsx & components/specialisten/AddSpecialistButtonPresentational.tsx)
  - Reden: Bevat data fetching/directe Supabase calls. Gebruikt window.location.reload().
  - Actie: Maak Container + Presentational componenten. (Voltooid, window.location.reload() vervangen door query invalidation)
- [x] **PatientDetails** (containers/specialisten/PatientDetailsContainer.tsx & components/specialisten/PatientDetailsPresentational.tsx)
  - Reden: Bevat data fetching/directe Supabase calls.
  - Actie: Maak Container + Presentational componenten. (Voltooid, wacht op gebruik in app/specialisten/patient/[id]/page.tsx)
- [x] **TaskExecution** (containers/tasks/TaskExecutionContainer.tsx & components/tasks/TaskExecutionPresentational.tsx)
  - Reden: Bevat data fetching/directe Supabase calls.
  - Actie: Maak Container + Presentational componenten. (Voltooid)
- [x] **TaskForm** (containers/tasks/TaskFormContainer.tsx & components/tasks/TaskFormPresentational.tsx)
  - Reden: Bevat data fetching/directe Supabase calls.
  - Actie: Maak Container + Presentational componenten. (Voltooid)
- [x] **TaskLogs** (containers/tasks/TaskLogsContainer.tsx & components/tasks/TaskLogsPresentational.tsx)
  - Reden: Bevat data fetching/directe Supabase calls.
  - Actie: Maak Container + Presentational componenten. (Voltooid)
- [x] **TasksPageClient** (containers/tasks/TasksPageContainer.tsx)
  - Reden: Bevat data fetching/directe Supabase calls.
  - Actie: Maak Container + Presentational componenten. (Voltooid - was al TasksPageContainer.tsx)
- [x] **AIInsightsContainer** (containers/dashboard/AIInsightsContainer.tsx)
  - Reden: Bevat data fetching/directe Supabase calls. (Verifies correct pattern with AIInsightsPresentational.tsx)
  - Actie: Maak Container + Presentational componenten. (Voltooid)


### Gemiddelde Prioriteit (Client Componenten met State / UI Issues)

- [x] **AIInsightVisualization** (components/ai/AIInsightVisualization.tsx)
  - Reden: Client component met state management. (Beoordeeld: Huidige state management is lokaal en acceptabel. Ontvangt data via props van AIInsightsContainer. Geen container/presentational split nodig.)
- [x] **AuthForm** (components/auth/AuthForm.tsx)
  - Reden: Client component met state management. (Beoordeeld: Supabase calls verplaatst naar custom mutation hooks `useSignInEmailPassword` en `useSignUpWithEmailPassword` in `hooks/useMutations.ts`. Huidige component state management voor formulier is acceptabel.)
- [x] **AuthProvider** (components/auth/AuthProvider.tsx)
  - Reden: Client component met state management. (Beoordeeld: Profiel ophalen geüpdatet om `useProfile` hook te gebruiken. Overige state management is acceptabel voor een context provider.)
- [x] **HealthMetrics** (components/dashboard/HealthMetrics.tsx)
  - Reden: Client component met state management. (Beoordeeld: State management is lokaal (UI state) en voor derived data (`chartData` via `useMemo`). Ontvangt data via props. Geen container/presentational split nodig.)
- [x] **HealthMetricsChart** (components/dashboard/HealthMetricsChart.tsx)
  - Reden: Client component met state management. (Beoordeeld: State management is lokaal (UI state) en voor derived data (`chartData` via `useMemo`). Ontvangt data via props. Geen container/presentational split nodig.)
- [x] **SessionStatus** (components/debug/SessionStatus.tsx)
  - Reden: Client component met state management. (Beoordeeld: Geüpdatet om `useAuth` hook te gebruiken, wat de lokale state en data fetching overbodig maakt.)
- [x] **DashboardLayout** (components/layout/DashboardLayout.tsx)
  - Reden: Client component met state management. (Beoordeeld: Redundantie redirectie logica verwijderd, vertrouwt nu op AuthProvider. `mounted` state is standaard. Geen verdere split nodig.)
- [x] **PatientList** (components/specialisten/PatientList.tsx)
  - Reden: Client component met state management. (Beoordeeld: State management is lokaal (UI state voor search/sort) en voor derived data (`filteredPatients` via `useMemo`). Ontvangt data via props. Geen container/presentational split nodig.)
- [x] **TaskFilters** (components/tasks/TaskFilters.tsx)
  - Reden: Client component met state management. (Beoordeeld: State management is lokaal voor filterwaarden en URL synchronisatie. Communiceert via `onFilterChange` callback. Huidige structuur is acceptabel.)


### Lage Prioriteit (Client Componenten - Handmatige Check Nodig)

- [x] **NotificationSystem** (components/common/NotificationSystem.tsx)
  - Reden: Client component, handmatige check nodig. (Beoordeeld: Redundante auto-dismiss logica verwijderd. Component rendert nu enkel notificaties van NotificationContext. State management is effectief gecentraliseerd in de provider.)
- [x] **QuickActions** (components/dashboard/QuickActions.tsx)
  - Reden: Client component, handmatige check nodig. (Beoordeeld: Component is stateless en puur presentational. Geen refactoring nodig.)
- [x] **AddTaskButton** (components/tasks/AddTaskButton.tsx)
  - Reden: Client component, handmatige check nodig. (Beoordeeld: Component is stateless en puur presentational (een Link). Geen refactoring nodig.)


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
