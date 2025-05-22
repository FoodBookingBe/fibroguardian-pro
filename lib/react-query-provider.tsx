import React from 'react';

'use client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ReactNode } from 'react';
// Import the centrally configured queryClient instance
import { queryClient } from './QueryClientConfig'; 

export function ReactQueryProvider({ children }: { children: ReactNode }) {
  // Use the imported singleton queryClient
  // The useState approach is not needed if queryClient is a stable singleton.
  // The comment about preventing data leakage for SSR is important if the client
  // was created at the module scope on the server. Here, QueryClientConfig.ts
  // creates it at module scope, which is fine for client-side usage.
  // For SSR with App Router, data fetching in Server Components doesn't use this client directly.
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
