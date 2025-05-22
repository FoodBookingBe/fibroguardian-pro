
// Fix voor ontbrekende property 'addNotification' op Element type
declare module "react" {
  interface Element {
    addNotification?: unknown;
  }
}
'use client';

import React, { useState, useCallback } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import AIRecommendationCard from '@/components/ai/AIRecommendationCard';
import { _useAuth as useAuth } from '@/components/auth/AuthProvider';
import { AlertMessage } from '@/components/common/AlertMessage';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { useNotification } from '@/context/NotificationContext';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';
import { AIRecommendation } from '@/types/ai';

interface AIRecommendationsContainerProps {
  limit?: number;
  contextType?: 'task_suggestion' | 'symptom_alert' | 'pattern_insight';
  className?: string;
  title?: string;
}

export default function AIRecommendationsContainer({
  limit = 3,
  contextType,
  className = '',
  title = 'AI Aanbevelingen'
}: AIRecommendationsContainerProps): JSX.Element {
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // Fetch AI recommendations
  const {
    data: recommendations,
    isLoading,
    isError,
    error: queryError
  } = useQuery({
    queryKey: ['ai_recommendations', user?.id, contextType, limit],
    queryFn: async () => {
      if (!user?.id) throw new Error('Gebruiker niet ingelogd');
      
      const supabase = getSupabaseBrowserClient();
      
      let query = supabase
        .from('ai_recommendations')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      // Add context type filter if provided
      if (contextType) {
        query = query.eq('context_type', contextType);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return data as AIRecommendation[];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutation to dismiss a recommendation
  const dismissMutation = useMutation({
    mutationFn: async (recommendationId: string) => {
      if (!user?.id) throw new Error('Gebruiker niet ingelogd');
      
      const supabase = getSupabaseBrowserClient();
      
      const { error } = await supabase
        .from('ai_recommendations')
        .update({ is_dismissed: true })
        .eq('id', recommendationId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      return recommendationId;
    },
    onSuccess: (recommendationId: unknown) => {
      // Update the cache to remove the dismissed recommendation
      queryClient.setQueryData(
        ['ai_recommendations', user?.id, contextType, limit],
        (oldData: AIRecommendation[] | undefined) => {
          if (!oldData) return [];
          return oldData.filter(rec => rec.id !== recommendationId);
        }
      );
      
      addNotification({
        type: 'success',
        message: 'Aanbeveling verwijderd',
        duration: 3000
      });
    },
    onError: (error: unknown) => {
      console.error('Error dismissing recommendation:', error);
      setError('Kon de aanbeveling niet verwijderen. Probeer het later opnieuw.');
      
      addNotification({
        type: 'error',
        message: 'Kon de aanbeveling niet verwijderen',
        duration: 5000
      });
    }
  });

  // Handle dismiss recommendation
  const handleDismiss = useCallback((id: string) => {
    dismissMutation.mutate(id);
  }, [dismissMutation]);

  // Show loading state
  if (isLoading) {
    return (
      <div className={`${className} rounded-lg bg-white p-6 shadow-md`}>
        <h2 className="mb-4 text-lg font-semibold">{title}</h2>
        <SkeletonLoader count={limit} type="card" />
      </div>
    );
  }

  // Show error state
  if (isError || error) {
    const errorMessage = error || (queryError instanceof Error ? queryError.message : 'Er is een fout opgetreden');
    
    return (
      <div className={`${className} rounded-lg bg-white p-6 shadow-md`}>
        <h2 className="mb-4 text-lg font-semibold">{title}</h2>
        <AlertMessage
          type="error"
          title="Fout bij laden aanbevelingen"
          message={errorMessage}
        />
      </div>
    );
  }

  // Show empty state
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className={`${className} rounded-lg bg-white p-6 shadow-md`}>
        <h2 className="mb-4 text-lg font-semibold">{title}</h2>
        <div className="rounded-lg border-2 border-dashed border-gray-200 p-4 text-center">
          <p className="text-gray-500">Geen aanbevelingen beschikbaar</p>
        </div>
      </div>
    );
  }

  // Show recommendations
  return (
    <div className={`${className} rounded-lg bg-white p-6 shadow-md`}>
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      <div className="space-y-4">
        {recommendations.map(recommendation => (
          <AIRecommendationCard
            key={recommendation.id}
            recommendation={recommendation}
            onDismiss={handleDismiss}
          />
        ))}
      </div>
    </div>
  );
}
