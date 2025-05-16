# FibroGuardian Pro Architectuur Gids

## Inhoudsopgave

1. [Architectuur Overview](#architectuur-overview)
2. [Data Flow](#data-flow)
3. [Component Patronen](#component-patronen)
4. [Hooks & APIs](#hooks--apis)
5. [TypeScript Best Practices](#typescript-best-practices)
6. [Performance Optimalisatie](#performance-optimalisatie)
7. [Toegankelijkheid (Accessibility)](#toegankelijkheid-accessibility)
8. [Notificatiesysteem](#notificatiesysteem)

## 1. Architectuur Overview

FibroGuardian Pro gebruikt een moderne React architectuur met Next.js App Router, gebaseerd op de volgende kernprincipes:

- **React Server Components (RSC):** Voor server-rendered inhoud en data fetching dicht bij de data source.
- **React Client Components (`'use client'`):** Voor interactieve UI elementen en browser-specifieke logica.
- **Supabase:** Als backend (Database, Authenticatie, Storage).
- **React Query (`@tanstack/react-query`):** Voor client-side data fetching, caching, en server state management.
- **TypeScript:** Voor type veiligheid en verbeterde developer experience.
- **Tailwind CSS:** Voor styling.

### Diagram

```
┌─────────────────────────────────────┐
│           Next.js App Router        │
├─────────────┬───────────────────────┤
│ Server      │ Client Components     │
│ Components  │ ┌───────────────────┐ │
│ (Data Fetch)│ │     UI Layer      │ │
│             │ └─────────┬─────────┘ │
│             │           │           │
│             │ ┌─────────▼─────────┐ │
│             │ │   Query/Mutation  │ │
│             │ │ Hooks (React Query)│ │
│             │ └─────────┬─────────┘ │
├─────────────┴───────────┼───────────┤
│                         │           │
│   ┌─────────────────────▼────────┐  │
│   │        API Routes            │  │
│   │   (voor mutaties)            │  │
│   └─────────────────────┬────────┘  │
│                         │           │
├─────────────────────────┼───────────┤
│                         │           │
│   ┌─────────────────────▼────────┐  │
│   │      Supabase Client         │  │
│   │ (via helpers/API routes)     │  │
│   └─────────────────────┬────────┘  │
│                         │           │
└─────────────────────────┼───────────┘
                          │
┌─────────────────────────▼───────────┐
│           Supabase                  │
│  (Auth, Database, Storage, etc.)    │
└─────────────────────────────────────┘
```

## 2. Data Flow

De data flow in FibroGuardian Pro volgt een gestandaardiseerd patroon:

1.  **Data Ophalen (Client-Side):**
    *   React Query hooks (uit `hooks/useSupabaseQuery.ts`) worden gebruikt in Client Components.
    *   Deze hooks roepen intern de Supabase browser client aan (via `getSupabaseBrowserClient()`).
    *   Data wordt gecached door React Query. `staleTime` en `cacheTime` zijn geconfigureerd.
    *   UI componenten gebruiken de `ConditionalRender` component (`components/ui/ConditionalRender.tsx`) om loading, error, empty, en data states af te handelen.
2.  **Data Mutaties (Client-Side naar Server-Side):**
    *   React Query mutation hooks (uit `hooks/useMutations.ts`) worden aangeroepen vanuit Client Components.
    *   Deze mutation hooks sturen `fetch` requests naar specifieke API Routes (`app/api/...`).
    *   API Routes valideren input, authenticatie/autorisatie, en voeren de database operatie uit via de Supabase server-side client (via `getSupabaseRouteHandlerClient()`).
    *   Na een succesvolle mutatie invalideren de mutation hooks relevante queries in de React Query cache om UI updates te triggeren.
3.  **Data Fetching (Server-Side):**
    *   React Server Components (RSC) kunnen data direct ophalen via `getSupabaseServerComponentClient()` tijdens server rendering. Deze data kan als `initialData` worden doorgegeven aan Client Components om de client-side cache van React Query te hydrateren.

### Code Voorbeeld (Client-Side Data Flow)

```tsx
// 1. Data ophalen in een Client Component
const { user } = useAuth(); // Voorbeeld: userId uit auth context
const { data: tasks, isLoading, error, isError } = useTasks(user?.id);

// 2. Data weergeven met ConditionalRender
<ConditionalRender
  isLoading={isLoading}
  isError={isError}
  error={error} // error is van type ErrorMessage
  data={tasks}
  skeletonType="tasks" // Gedefinieerd in SkeletonLoader
  emptyFallback={<p>Geen taken gevonden.</p>}
>
  {(tasksData) => <TaskList tasks={tasksData} />}
</ConditionalRender>

// 3. Data muteren (bv. taak verwijderen)
const { mutate: deleteTask } = useDeleteTask();
const { addNotification } = useNotification(); // Uit context/NotificationContext.tsx

const handleDelete = (taskId: string) => {
  deleteTask(taskId, {
    onSuccess: () => {
      addNotification('success', 'Taak succesvol verwijderd');
      // Query invalidation gebeurt in de useDeleteTask hook
    },
    onError: (err: ErrorMessage) => {
      addNotification('error', err.userMessage || 'Fout bij verwijderen.');
    }
  });
};
```

## 3. Component Patronen

### Container + Presentational Patroon
Dit patroon wordt aangemoedigd voor een duidelijke scheiding van verantwoordelijkheden:
*   **Container Components:** Verantwoordelijk voor data fetching (via hooks), state management, en het doorgeven van data en callbacks aan presentational components. Vaak Client Components.
*   **Presentational Components:** Verantwoordelijk voor de UI rendering. Ontvangen data en callbacks via props. Kunnen Client of Server Components zijn.

```tsx
// Voorbeeld: components/reflecties/ReflectiesListContainer.tsx
export function ReflectiesListContainer({ userId }: { userId: string }) {
  const { data, isLoading, error, isError } = useReflecties(userId);
  const { mutate: deleteReflectie } = useDeleteReflectie();
  // ... handleDelete ...
  return (
    <ConditionalRender isLoading={isLoading} isError={isError} error={error} data={data} /* ... */>
      {(reflectiesData) => (
        <ReflectiesList 
          reflecties={reflectiesData} 
          onDelete={handleDelete} 
          /* ... */ 
        />
      )}
    </ConditionalRender>
  );
}

// Voorbeeld: components/reflecties/ReflectiesList.tsx (Presentational)
export default function ReflectiesList({ reflecties, onDelete, isDeletingId }) {
  // Logica voor het renderen van de lijst...
}
```

### Form Handling
Formulieren volgen een standaard patroon:
1.  Lokale state (`useState`) voor formuliervelden.
2.  Validatie (client-side, en server-side in API routes). Overweeg Zod voor complexe validatie.
3.  Mutation hooks (`useUpsert[Resource]`) voor het submitten van data naar API routes.
4.  UI feedback (loading, error, success) via `isPending`/`isError`/`isSuccess` van de mutation hook en `AlertMessage` of het globale `useNotification` systeem.
5.  Focus management met `useFocusManagement` hook.

## 4. Hooks & APIs

### Query Hooks (`hooks/useSupabaseQuery.ts`)
*   **`useSupabaseQuery`:** Generieke wrapper voor React Query's `useQuery`, geconfigureerd voor Supabase.
*   **Specifieke Hooks (bv. `useProfile`, `useTasks`):** Gebruiken `useSupabaseQuery` en bevatten de specifieke Supabase client call en query key logica. Retourneren `QueryHookResult<TData, ErrorMessage>`.

### Mutation Hooks (`hooks/useMutations.ts`)
*   **Specifieke Hooks (bv. `useUpdateProfile`, `useUpsertTask`):** Gebruiken React Query's `useMutation`.
*   Roepen de relevante API Route aan via `fetch`.
*   Implementeren `onSuccess` voor cache invalidatie (bv. `queryClient.invalidateQueries`).
*   Retourneren `UseMutationResult<TData, ErrorMessage, TVariables, TContext>`.

### API Routes (`app/api/...`)
*   Gebruiken `getSupabaseRouteHandlerClient()` voor server-side Supabase interactie.
*   Valideren input en gebruikersrechten.
*   Gebruiken `handleSupabaseError` en `formatApiError` voor consistente JSON error responses.

## 5. TypeScript Best Practices

### Type Definitie Organisatie
*   **`types/core.ts`:** Basis types (`ApiResponse`, `ErrorResponse`, `Nullable`, etc.), type guards.
*   **`types/index.ts`:** Resource-specifieke interfaces (`Profile`, `Task`, `ReflectieFormData`, etc.).
*   **`types/query.ts`:** React Query gerelateerde helper types (`QueryHookResult`, `MutationHookOptions`).

### Type Guards
Gebruik type guards voor runtime type checking waar nodig, vooral bij het verwerken van API responses of onbekende data.

### Utility Types
Gebruik TypeScript's ingebouwde utility types (`Partial`, `Omit`, `Pick`, `NonNullable`) en custom utility types (`WithId`, `Optional`) om types DRY en accuraat te houden.

## 6. Performance Optimalisatie

### React Query Caching
*   **`lib/QueryClientConfig.ts`:** Centrale configuratie voor `QueryClient` met default `staleTime`, `cacheTime`.
*   Resource-specifieke `staleTime` kan per hook worden geconfigureerd.
*   **Cache Invalidation:** Mutation hooks zijn verantwoordelijk voor het invalideren van relevante queries na succesvolle mutaties.

### Rendering Optimalisatie
*   **`React.memo`:** Gebruik voor presentational components die niet opnieuw hoeven te renderen als hun props niet veranderen.
*   **`useMemo` & `useCallback`:** Gebruik voor het memoizeren van dure berekeningen en callbacks om onnodige re-renders van child components te voorkomen.
*   **Virtualized Lists:** Overweeg voor zeer lange lijsten (bv. `react-window` of `react-virtualized`).
*   **Lazy Loading:** Voor afbeeldingen en componenten die niet direct zichtbaar zijn.

## 7. Toegankelijkheid (Accessibility)
*   **`utils/accessibility.ts`:** Bevat `ariaProps` helpers voor consistente ARIA attributen en `useFocusManagement` hook.
*   **Semantische HTML:** Gebruik correcte HTML elementen.
*   **ARIA Attributen:** Pas `aria-*` attributen correct toe, vooral voor dynamische UI elementen en custom controls. Gebruik de `ariaProps` helpers.
*   **Keyboard Navigatie:** Zorg dat alle interactieve elementen via het toetsenbord bereikbaar en bedienbaar zijn.
*   **Focus Management:** Gebruik `useFocusManagement` om focus correct te sturen, bv. na modale dialogen of form submissions.
*   **Kleurencontrast:** Controleer op voldoende contrast (WCAG AA).
*   **Testen:** Gebruik tools zoals axe DevTools en test handmatig met screenreaders.

## 8. Notificatiesysteem
*   **`context/NotificationContext.tsx`:** Bevat `NotificationProvider` en `useNotification` hook.
*   **`components/ui/NotificationList.tsx`:** Toont de globale notificaties (toasts).
*   **Gebruik:** Roep `addNotification('success' | 'error' | ..., 'bericht')` aan vanuit componenten voor globale feedback. Vervang `window.alert`. Evalueer of een globale toast of een inline `AlertMessage` geschikter is per use case.

```

### 3.2 Maak `docs/CodeReviewChecklist.md`
De content voor deze checklist is al gespecificeerd in het plan en kan direct worden gebruikt.

<write_to_file>
<path>docs/CodeReviewChecklist.md</path>
<content>
# Code Review Checklist - FibroGuardian Pro

Deze checklist wordt gebruikt tijdens code reviews om consistente kwaliteit te waarborgen.

## Algemeen

- [ ] De code volgt de project stijlgids (Prettier, ESLint).
- [ ] Er zijn geen `console.log` statements of onnodige comments achtergebleven.
- [ ] Hardcoded strings die vertaald moeten worden of vaak voorkomen zijn vermeden of in constanten geplaatst.
- [ ] De code is voldoende gedocumenteerd (JSDoc voor complexe functies/hooks, component props).
- [ ] Bestandsnamen en mappenstructuur volgen de conventies.

## TypeScript

- [ ] Geen `any` types gebruikt, tenzij strikt noodzakelijk en gedocumenteerd.
- [ ] Functies en methodes hebben expliciete return types.
- [ ] Alle parameters hebben duidelijke types.
- [ ] Generieke types worden correct en effectief gebruikt.
- [ ] Utility types (`Partial`, `Omit`, `Pick`, custom types uit `types/core.ts`) worden gebruikt om types DRY te houden.
- [ ] Type guards worden gebruikt voor veilige runtime type checks waar nodig.
- [ ] Interfaces en Types zijn duidelijk gedefinieerd en georganiseerd (in `types/` directory).

## React Componenten

- [ ] **Container + Presentational Patroon:** Logica (data fetching, state) is gescheiden van pure UI rendering waar zinvol.
- [ ] **Conditionele Rendering:** Gebruikt de `ConditionalRender` component voor loading/error/empty/data states.
- [ ] **Props:** Props hebben expliciete interfaces en zijn goed gedocumenteerd. Destructuring van props wordt consistent toegepast.
- [ ] **State Management:** Lokale state (`useState`) wordt correct geïnitialiseerd en beheerd. Complexe state logica is eventueel in `useReducer` of custom hooks geabstraheerd.
- [ ] **Performance:**
    - Geen onnodige re-renders (check dependencies van `useEffect`, `useMemo`, `useCallback`).
    - `React.memo` gebruikt voor presentational components die vaak re-renderen met dezelfde props.
    - `useCallback` voor event handlers die aan gememoizeerde children worden doorgegeven.
    - `useMemo` voor dure berekeningen.
- [ ] **Keys:** Correcte en stabiele keys gebruikt voor lijsten.
- [ ] **Effecten (`useEffect`):** Dependencies array is correct. Cleanup functies zijn aanwezig indien nodig. Geen directe data fetching (gebruik React Query hooks).

## Data Handling (React Query & API Routes)

- [ ] **Query Hooks:** Data fetching gebeurt via de gestandaardiseerde React Query hooks uit `hooks/useSupabaseQuery.ts`.
- [ ] **Mutation Hooks:** Data mutaties (Create, Update, Delete) gebeuren via de gestandaardiseerde React Query hooks uit `hooks/useMutations.ts` die API routes aanroepen.
- [ ] **Geen directe Supabase client calls in UI componenten** voor data fetching of mutaties (Storage kan een uitzondering zijn, maar bij voorkeur via een hook/API).
- [ ] **Loading, Error, Success States:** Correct afgehandeld en weergegeven (via `ConditionalRender`, `AlertMessage`, of `useNotification`).
- [ ] **Cache Invalidation:** Mutation hooks invalideren relevante queries correct via `queryClient.invalidateQueries()` of werken de cache bij met `queryClient.setQueryData()`.
- [ ] **API Routes:**
    - Input validatie aanwezig.
    - Error handling is consistent en gebruikt `formatApiError` / `handleSupabaseError`.
    - Gebruikersrechten (authenticatie/autorisatie) worden gecontroleerd.
    - Responses hebben correcte HTTP status codes en data types.

## UI & Toegankelijkheid (Accessibility)

- [ ] **ARIA Attributen:** Correcte ARIA attributen zijn aanwezig voor dynamische content, custom controls, etc. (gebruik `utils/accessibility.ts#ariaProps` waar mogelijk).
- [ ] **Loading States:** Gebruiken `SkeletonLoader` of andere duidelijke, consistente loading indicators.
- [ ] **Error Handling:** Gebruiken `AlertMessage` voor inline fouten of `useNotification` voor globale notificaties. Foutmeldingen zijn gebruiksvriendelijk.
- [ ] **Kleurencontrast:** Voldoet aan WCAG AA richtlijnen.
- [ ] **Keyboard Navigatie:** Alle interactieve elementen zijn volledig toetsenbord-bedienbaar.
- [ ] **Focus Management:** Focus wordt logisch beheerd, vooral na modale acties of form submissions (gebruik `useFocusManagement` waar nodig).
- [ ] **Semantische HTML:** Correct gebruik van HTML5 elementen.
- [ ] **Koppenstructuur:** Logische en hiërarchische heading structuur (H1-H6).

## Forms

- [ ] **Validatie:** Client-side validatie aanwezig (overweeg Zod voor complexe formulieren). Server-side validatie in API routes.
- [ ] **TypeScript Types:** Duidelijke types voor form data (bv. `ReflectieFormData`).
- [ ] **Disabled State:** Knoppen zijn disabled tijdens submit (`isPending` van mutation hook).
- [ ] **Feedback:** Duidelijke feedback voor validatiefouten, succes, en serverfouten.

## Performance (Algemeen)

- [ ] Geen onnodige, dure berekeningen in de render-fase.
- [ ] Efficiënte lijst rendering (keys, `React.memo` op list items).
- [ ] Correcte React Query caching strategie per resource.
- [ ] Lazy loading voor afbeeldingen en off-screen componenten overwogen.

## Tests
- [ ] Unit tests voor complexe logica, hooks, en utility functies.
- [ ] Integratie tests voor belangrijke user flows.
- [ ] End-to-end tests voor kritieke paden.
- [ ] Test coverage is acceptabel.
