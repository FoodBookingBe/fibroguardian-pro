/**
 * Code Splitting Helpers
 * 
 * Dit bestand bevat nuttige helpers voor dynamische imports en code splitting.
 * Deze zorgen voor kleinere initiële JavaScript bundles en snellere laadtijden.
 */

import dynamic from 'next/dynamic';
import React, { lazy, Suspense } from 'react'; // Import React for JSX

// Standaard laadcomponent (kan uitgebreid worden)
const DefaultLoadingComponent = () => (
  <div className="flex items-center justify-center h-64">
    <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

// Laad componenten dynamisch met Next.js dynamic import
// De componentPath moet relatief zijn aan de root van het project of een alias gebruiken.
// Voorbeeld: '@/components/MyComponent' of '../components/MyComponent'
export const dynamicImport = (componentImportFn, options = {}) => {
  return dynamic(componentImportFn, {
    loading: () => options.loadingComponent || <DefaultLoadingComponent />,
    ssr: false, // Standaard SSR uitschakelen voor client-only componenten, kan per component overschreven worden
    ...options,
  });
};

// --- Voorbeelden van dynamisch geladen componenten/pagina's ---
// (Pas de paden aan naar de daadwerkelijke locatie van je componenten)

// Dynamisch laden van grotere pagina's (als ze niet al via Next.js routing code-split zijn)
// export const DashboardPage = dynamicImport(() => import('@/app/dashboard/page'));
// export const RapportenPage = dynamicImport(() => import('@/app/rapporten/page'));
// export const ReflectiesPage = dynamicImport(() => import('@/app/reflecties/page'));

// Dynamisch laden van zware UI componenten
export const HealthMetricsChart = dynamicImport(
  () => import('@/components/dashboard/HealthMetricsChart'), 
  { ssr: true } // Charts kunnen vaak op de server gerenderd worden
);

export const PDFViewer = dynamicImport(
  () => import('@/components/rapporten/PDFViewer'), // Stel dat dit component bestaat
  { ssr: false } // PDF viewer is typisch client-side
);

export const AIInsightVisualization = dynamicImport(
  () => import('@/components/ai/AIInsightVisualization'), 
  { ssr: false } // AI visualisaties vaak client-side
);

/**
 * Lazy load routes voor de applicatie met React.lazy en Suspense.
 * Dit is meer voor componenten binnen een pagina, Next.js's `dynamic` is beter voor pagina-level splitting.
 * @param factory Een functie die een Promise retourneert naar de module import, bv. () => import('./MyComponent')
 * @param fallback Optional fallback component while loading.
 */
export const lazyRouteImport = (factory, fallback = <DefaultLoadingComponent />) => {
  const Component = lazy(factory);
  // eslint-disable-next-line react/display-name
  return (props) => (
    <Suspense fallback={fallback}>
      <Component {...props} />
    </Suspense>
  );
};

// Voorbeeldgebruik voor een component binnen een pagina:
// const HeavyUserProfileSection = lazyRouteImport(() => import('@/components/profile/HeavyUserProfileSection'));
// In je component: <HeavyUserProfileSection userId={user.id} />

// Opmerking: Voor pagina-gebaseerde code splitting, is Next.js's file-system routing
// (pagina's in de `app` of `pages` directory) meestal voldoende en de aanbevolen methode.
// `next/dynamic` is nuttig voor componenten die niet direct een route zijn maar wel groot.
// `React.lazy` is meer voor componenten binnen een al geladen pagina/route.