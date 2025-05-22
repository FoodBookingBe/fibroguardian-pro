'use client';

import React, { useState, useEffect } from 'react';

import { _useAuth as useAuth } from '@/components/auth/AuthProvider';
import AIAssistant, { UserContext } from '@/components/ai/AIAssistant';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';
import { TaskLog, Reflectie } from '@/types';

interface AIAssistantContainerProps {
  className?: string;
}

/**
 * Container component for the AI Assistant
 * Fetches real user data and passes it to the AI Assistant component
 */
export default function AIAssistantContainer({ className = '' }: AIAssistantContainerProps): JSX.Element {
  const { user } = useAuth();
  const [userContext, setUserContext] = useState<Partial<UserContext> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch user data for the AI Assistant
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        const supabase = getSupabaseBrowserClient();
        
        // Get current date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString();
        
        // Fetch completed tasks for today
        const { data: completedTasks, error: completedError } = await supabase
          .from('task_logs')
          .select('*')
          .eq('user_id', user.id)
          .gte('start_tijd', todayStr)
          .not('eind_tijd', 'is', null)
          .order('start_tijd', { ascending: false });
        
        // Fetch pending tasks for today
        const { data: pendingTasks, error: pendingError } = await supabase
          .from('tasks')
          .select(`
            id,
            titel,
            beschrijving,
            type,
            duur,
            herhaal_patroon,
            dagen_van_week
          `)
          .eq('user_id', user.id)
          .not('task_logs', 'cs', `{"user_id":"${user.id}","start_tijd":"${todayStr.substring(0, 10)}"}`);
        
        // Fetch recent reflections
        const { data: reflections, error: reflectionsError } = await supabase
          .from('reflecties')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (completedError || pendingError || reflectionsError) {
          console.error('Error fetching user data:', { completedError, pendingError, reflectionsError });
          return;
        }
        
        // Extract energy and pain levels from most recent reflection
        let energyLevel: number | undefined;
        let painLevel: number | undefined;
        let mood: string | undefined;
        
        if (reflections && reflections.length > 0) {
          const latestReflection = reflections[0];
          energyLevel = latestReflection.energie_niveau || undefined;
          painLevel = latestReflection.pijn_score || undefined;
          mood = latestReflection.stemming || undefined;
        }
        
        // Build user context
        const context: Partial<UserContext> = {
          energyLevel,
          painLevel,
          mood,
          completedTasksToday: completedTasks?.length || 0,
          pendingTasksToday: pendingTasks?.length || 0,
          recentTasks: completedTasks as TaskLog[],
          recentReflections: reflections as Reflectie[]
        };
        
        setUserContext(context);
      } catch (error) {
        console.error('Error in AIAssistantContainer:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, [user?.id]);

  // Don't render anything if no user or still loading initial data
  if (!user || (isLoading && !userContext)) {
    return <></>;
  }

  return (
    <AIAssistant
      userId={user.id}
      currentContext={userContext || undefined}
      className={className}
    />
  );
}
