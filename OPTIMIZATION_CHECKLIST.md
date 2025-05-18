# Frontend Optimization & Update Checklist

This checklist tracks recent updates and optimizations to ensure they are correctly implemented and visible in the frontend.

## Optimizations Implemented

- [x] **Authentication Method Update**:
  - **Description**: Replaced all instances of the deprecated `supabase.auth.getSession()` with the recommended `supabase.auth.getUser()` method. This enhances security and aligns with Supabase best practices.
  - **Files Affected**:
    - `middleware.ts`
    - `lib/analytics/eventTracking.ts`
    - `components/auth/AuthProvider.tsx`
    - `app/auth-test/page.tsx`
    - `app/api/tasks/route.ts`
    - `app/api/task-logs/route.ts`
    - `app/api/reflecties/route.ts`
  - **Verification**:
    - [ ] Console warnings related to `getSession()` are no longer present.
    - [ ] Authentication flows (login, logout, session handling) work as expected.
    - [ ] Protected routes are correctly guarded.

- [x] **Data Fetching for `useMySpecialists` Hook**:
  - **Description**: The `useMySpecialists` hook in `hooks/useSupabaseQuery.ts` was making two separate database calls. It has been updated to use a single, joined Supabase query.
  - **Files Affected**:
    - `hooks/useSupabaseQuery.ts`
  - **Verification**:
    - [ ] Analyze current performance of this hook (e.g., using browser network tools).
    - [ ] Compare performance with the previous version if possible.
    - [ ] Ensure data integrity and correctness remain after changes (i.e., the correct specialists and their relation IDs are fetched).
    - [ ] Test with RLS to ensure patients can still fetch their specialists' profiles as intended with the new query structure.

- [x] **Query Invalidation Strategy for Mutations**:
  - **Description**: Reviewed `onSuccess` handlers in `hooks/useMutations.ts` against query keys in `hooks/useSupabaseQuery.ts`.
  - **Files Affected**: `hooks/useMutations.ts`, `hooks/useSupabaseQuery.ts`
  - **Findings**:
    - Most invalidations use keys that should work effectively with React Query's partial matching (e.g., `['tasks', userId]` invalidates `['tasks', userId, filters]`).
    - Some list invalidations are broad (e.g., `['tasks']` in `useDeleteTask` or `['recentLogs']` in `useAddTaskLog`) but serve as a safe fallback.
    - `useDeleteTask`: The more specific invalidation `['tasks', userId]` is commented out; `userId` would need to be passed to the mutation or obtained differently for this to work.
    - `setQueryData` calls for single items (e.g., `['task', data.id]`) are generally correct, assuming corresponding `useQuery` hooks use these exact keys for individual item fetching.
  - **Status**: Generally functional. The main area for potential refinement is providing `userId` to `useDeleteTask` for more precise invalidation if the broad `['tasks']` invalidation proves insufficient or inefficient. No immediate code changes made, but noted for future improvement if needed.
  - **Verification**:
    - [ ] Confirm that after each mutation (create, update, delete), relevant parts of the UI update correctly with fresh data.
    - [ ] Test edge cases to ensure no stale data is displayed, particularly around task deletion and user-specific task lists.

- [x] **Client-Side AI Insight Generation Performance (`app/overzicht/overzicht-client.tsx`)**:
  - **Description**: The `generateAiInsights` logic was refactored from a `useEffect` hook that calls `setAiInsights` to a `useMemo` hook that directly computes `aiInsights`. This ensures calculations only occur when dependencies change. Date handling for `reflectie.datum` was also corrected to treat it as a `Date` object.
  - **Files Affected**:
    - `app/overzicht/overzicht-client.tsx`
  - **Verification**:
    - [ ] Measure UI responsiveness when switching to the overview page or changing tabs, especially with more data, to confirm `useMemo` provides performance benefits.
    - [ ] Verify that AI insights are still generated correctly.
    - [ ] Further consideration could be given to moving this logic to a backend API if client-side performance is still an issue with very large datasets.

- [x] **PWA Metadata and Icon Management (`app/layout.tsx`)**:
  - **Description**: Updated `app/layout.tsx` to use the Next.js `metadata` object for PWA manifest, theme color, Apple Web App settings, and icons. Redundant manual tags in `<head>` were removed or commented out. `themeColor` is set globally in `metadata`.
  - **Files Affected**:
    - `app/layout.tsx`
    - `public/manifest.json` (Reviewed)
  - **Status**: `app/layout.tsx` now better aligns with Next.js metadata conventions. `themeColor` has been moved to `generateViewport` in `app/layout.tsx`, resolving previous Next.js warnings.
  - **Verification**:
    - [ ] Validate PWA configuration using browser developer tools (Lighthouse).
    - [ ] Confirm all icons (favicon, Apple touch icon, etc.) display correctly.
    - [x] Next.js warning regarding `themeColor` in metadata exports for child routes is now resolved.

## Pending Review / Further Investigation

- [x] **Viewport Meta Tag Accessibility (`app/layout.tsx`)**:
  - **Description**: The viewport meta tag included `user-scalable=no` and `maximum-scale=1`, which restricts zooming. This has been updated to `width=device-width, initial-scale=1` to allow user scaling.
  - **Files Affected**:
    - `app/layout.tsx`
  - **Verification**:
    - [ ] Confirm page zooming is possible on various devices.
    - [ ] Assess any design implications if zooming is enabled.

- [x] **Web Font Loading Optimization (`app/layout.tsx`, `globals.css`, `tailwind.config.js`)**:
  - **Description**: Investigated font loading strategy. The application appears to use Tailwind CSS's default system font stack.
  - **Files Affected**: `app/globals.css`, `tailwind.config.js`
  - **Findings**: No custom web fonts are explicitly imported or configured. System fonts are prioritized.
  - **Status**: This is generally optimal for performance as it avoids network requests for font files and associated FOUT/FOIT issues. No further action seems required unless a specific design decision is made to introduce web fonts.
  - **Verification**:
    - [x] Confirmed no web font imports in `globals.css`.
    - [x] Confirmed no custom `fontFamily` in `tailwind.config.js`.
    - [ ] (Optional) Double-check rendered pages in browser dev tools to ensure no unexpected fonts are being loaded from third-party scripts or CSS.

- [x] **Enable SWC Minification for Production (`next.config.js`)**:
  - **Description**: `swcMinify` was set to `false` and has now been changed to `true`. Enabling it for production builds can lead to smaller bundle sizes and faster build times.
  - **Files Affected**:
    - `next.config.js`
  - **Verification**:
    - [ ] Confirm production builds complete successfully with `swcMinify: true`. (To be done during a production build)
    - [ ] Compare bundle sizes before and after. (To be done during a production build)
    - [ ] Test critical application functionality to ensure minification didn't introduce issues. (To be done after deployment or local production build)
    - [x] Development server restarted successfully after the change.

- [ ] **PWA Caching and Offline Fallbacks (`next.config.js`)**:
  - **Description**: The `next-pwa` configuration has commented-out sections for `fallbacks` and `runtimeCaching`.
  - **Area to Investigate**: If enhanced offline capabilities or specific caching strategies for assets (like fonts, API calls) are required, these sections need to be configured and uncommented.
  - **Verification**:
    - [ ] Test offline behavior thoroughly.
    - [ ] Verify caching headers and service worker behavior for cached assets.

- [ ] **Run and Analyze Bundle Size (`next.config.js` & build process)**:
  - **Description**: `@next/bundle-analyzer` is configured but needs to be actively run (e.g., `ANALYZE=true npm run build`).
  - **Area to Investigate**: Regularly run the bundle analyzer to inspect JavaScript bundle composition. Identify large dependencies, opportunities for more granular code splitting, or unused code.
  - **Verification**:
    - [ ] Periodically review the bundle analysis report.
    - [ ] Track changes in bundle size over time.
    - [ ] Implement optimizations based on findings (e.g., dynamic imports, replacing heavy libraries).

*(Items will be added here as we identify other recent changes or areas for optimization review)*
