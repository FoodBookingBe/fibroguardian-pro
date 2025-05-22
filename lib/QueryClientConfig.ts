// lib/QueryClientConfig.ts
import { QueryClient } from '@tanstack/react-query';

// Resource-specifieke cache tijden (in milliseconden)
// StaleTime: hoe lang data als "vers" wordt beschouwd en geen netwerk request triggert.
// CacheTime: hoe lang inactieve data in de cache blijft (default 5 min).
export const _STALE_TIME = {
  PROFILES: 5 * 60 * 1000,    // 5 minuten
  TASKS: 2 * 60 * 1000,       // 2 minuten
  TASK_LOGS: 1 * 60 * 1000,   // 1 minuut
  REFLECTIES: 5 * 60 * 1000,  // 5 minuten
  INSIGHTS: 10 * 60 * 1000,   // 10 minuten
  SPECIALIST_PATIENT_RELATIONS: 5 * 60 * 1000, // 5 minuten
};

export const _queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // Default 1 minuut stale time voor queries zonder specifieke config
      gcTime: 5 * 60 * 1000, // Default 5 minuten cache time (gcTime is de nieuwe naam voor cacheTime in v5)
      refetchOnWindowFocus: false, // Kan per query worden overschreven indien nodig
      retry: 1, // Probeer een gefaalde query 1 keer opnieuw
      retryDelay: (attemptIndex: unknown) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponentiële backoff
    },
    mutations: {
      onError: (error: unknown) => {
        // Globale error logging voor mutaties, kan uitgebreid worden
        // Specifieke error handling gebeurt in de componenten via de error state van useMutation
        if (error instanceof Error) {
          console.error('Global Mutation Error:', (error as any).message);
        } else {
          console.error('Global Mutation Error (unknown type):', error);
        }
      }
    }
  }
});
