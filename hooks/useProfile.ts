'use client';

import { UseQueryOptions, QueryKey } from '@tanstack/react-query';
import useSupabaseQuery from './useSupabaseQuery'; // Importeer de generieke useSupabaseQuery
import { ErrorMessage } from '@/types'; // Zorg dat ErrorMessage beschikbaar is

// Aangepaste hook voor het ophalen van een gebruikersprofiel
export function useProfile(userId: string | undefined, options?: UseQueryOptions<any, ErrorMessage, any, QueryKey>) {
  return useSupabaseQuery<any, ErrorMessage>(
    ['profile', userId],
    async (supabase: unknown) => {
      if (!userId) {
        throw new Error('User ID is required to fetch profile.');
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        throw error;
      }
      return data;
    },
    {
      enabled: !!userId,
      queryKey: ["profile", userId], // Query alleen uitvoeren als userId aanwezig is
      ...options,
    }
  );
}
