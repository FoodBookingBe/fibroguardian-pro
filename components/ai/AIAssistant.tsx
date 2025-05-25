'use client';

// Fix voor ontbrekende property 'addNotification' op Element type
declare module "react" {
  interface Element {
    addNotification?: unknown;
  }
}

import { useCallback, useEffect, useState } from 'react';

import { Reflectie, TaskLog } from '@/types';

import { _useAuth as useAuth } from '@/components/auth/AuthProvider';
import { AlertMessage } from '@/components/common/AlertMessage';
import { useNotification } from '@/context/NotificationContext';

// Types for the AI Assistant
export type AssistantMode = 'adaptive' | 'minimal' | 'detailed' | 'motivational' | 'clinical';
export type PersonalityMode = 'motivational' | 'gentle' | 'clinical';

export interface UserContext {
  energyLevel?: number;
  painLevel?: number;
  mood?: string;
  recentTasks?: TaskLog[];
  recentReflections?: Reflectie[];
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: number;
  completedTasksToday: number;
  pendingTasksToday: number;
}

export interface Nudge {
  id: string;
  type: 'reminder' | 'encouragement' | 'insight' | 'suggestion';
  message: string;
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export interface UserBehaviorPattern {
  preferredTimeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  preferredTaskTypes?: string[];
  completionRate: number;
  responseToMotivation: 'positive' | 'neutral' | 'negative';
  painTriggers?: string[];
  energyPatterns?: {
    highEnergyDays: number[];
    lowEnergyDays: number[];
    highEnergyHours?: number[];
    lowEnergyHours?: number[];
  };
}

interface AIAssistantProps {
  userId?: string;
  currentContext?: Partial<UserContext>;
  adaptToEnergyLevel?: boolean;
  personalityMode?: PersonalityMode;
  className?: string;
}

/**
 * AI Assistant component that provides personalized guidance and nudges
 * based on user behavior, energy levels, and context
 */
export default function AIAssistant({
  userId,
  currentContext,
  adaptToEnergyLevel = true,
  personalityMode = 'gentle',
  className = ''
}: AIAssistantProps): JSX.Element {
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [_assistantMode, _setAssistantMode] = useState<AssistantMode>('adaptive');
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [_userContext, _setUserContext] = useState<UserContext | null>(null);
  const [_behaviorPatterns, _setBehaviorPatterns] = useState<UserBehaviorPattern | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Determine current time context if not provided
  const determineTimeContext = useCallback((): Pick<UserContext, 'timeOfDay' | 'dayOfWeek'> => {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday

    let timeOfDay: UserContext['timeOfDay'] = 'afternoon';
    if (hour >= 5 && hour < 12) {
      timeOfDay = 'morning';
    } else if (hour >= 12 && hour < 18) {
      timeOfDay = 'afternoon';
    } else if (hour >= 18 && hour < 22) {
      timeOfDay = 'evening';
    } else {
      timeOfDay = 'night';
    }

    return { timeOfDay, dayOfWeek: day };
  }, []);

  // Fetch user context data
  const fetchUserContext = useCallback(async () => {
    if (!user?.id && !userId) return null;

    try {
      setIsLoading(true);

      // If context is provided, use it, otherwise fetch from API
      if (currentContext && Object.keys(currentContext).length > 0) {
        const timeContext = determineTimeContext();
        return {
          ...timeContext,
          completedTasksToday: 0,
          pendingTasksToday: 0,
          ...currentContext
        } as UserContext;
      }

      // Fetch tasks for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // This would be replaced with actual API calls in a real implementation
      // For now, we'll simulate the data
      const simulatedContext: UserContext = {
        ...determineTimeContext(),
        energyLevel: Math.floor(Math.random() * 10) + 1,
        painLevel: Math.floor(Math.random() * 10) + 1,
        mood: ['neutral', 'good', 'tired', 'motivated'][Math.floor(Math.random() * 4)],
        completedTasksToday: Math.floor(Math.random() * 5),
        pendingTasksToday: Math.floor(Math.random() * 3) + 1
      };

      return simulatedContext;
    } catch (err) {
      console.error('Error fetching user context:', err);
      setError('Kon gebruikerscontext niet laden');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, userId, currentContext, determineTimeContext]);

  // Analyze user behavior patterns
  const analyzeUserBehavior = useCallback(async (_targetUserId: string): Promise<UserBehaviorPattern | null> => {
    try {
      // This would be an actual API call in a real implementation
      // For now, we'll simulate the behavior pattern

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Simulated behavior pattern
      return {
        preferredTimeOfDay: ['morning', 'afternoon', 'evening', 'night'][Math.floor(Math.random() * 4)] as 'morning' | 'afternoon' | 'evening' | 'night',
        preferredTaskTypes: ['beweging', 'meditatie', 'huishouden', 'sociaal'],
        completionRate: 0.65 + (Math.random() * 0.3),
        responseToMotivation: ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)] as 'positive' | 'neutral' | 'negative',
        energyPatterns: {
          highEnergyDays: [1, 4], // Monday and Thursday
          lowEnergyDays: [3, 6],  // Wednesday and Saturday
          highEnergyHours: [9, 10, 11, 16, 17],
          lowEnergyHours: [13, 14, 21, 22]
        }
      };
    } catch (err) {
      console.error('Error analyzing user behavior:', err);
      return null;
    }
  }, []);

  // Adjust assistant behavior based on user patterns
  const adjustAssistantBehavior = useCallback((patterns: UserBehaviorPattern | null, context: UserContext | null) => {
    if (!patterns || !context) return;

    // Determine the best assistant mode based on patterns and context
    let newMode: AssistantMode = 'adaptive';

    // Adjust based on energy level if enabled
    if (adaptToEnergyLevel && context.energyLevel !== undefined) {
      if (context.energyLevel <= 3) {
        // Low energy - be minimal and gentle
        newMode = 'minimal';
      } else if (context.energyLevel >= 8) {
        // High energy - can be more detailed
        newMode = 'detailed';
      }
    }

    // Adjust based on personality preference
    if (personalityMode === 'motivational') {
      if (patterns.responseToMotivation === 'positive') {
        newMode = 'motivational';
      }
    } else if (personalityMode === 'clinical') {
      newMode = 'clinical';
    }

    // Set the new mode
    _setAssistantMode(newMode);

    // Generate appropriate nudges based on context and patterns
    generateNudges(patterns, context, newMode);
  }, [adaptToEnergyLevel, personalityMode]);

  // Generate nudges based on context, patterns, and mode
  const generateNudges = useCallback((
    patterns: UserBehaviorPattern,
    context: UserContext,
    mode: AssistantMode
  ) => {
    const newNudges: Nudge[] = [];

    // Limit number of nudges based on mode
    const maxNudges = mode === 'minimal' ? 1 : mode === 'detailed' ? 3 : 2;

    // Check if it's a preferred time for tasks
    const isPreferredTime = patterns.preferredTimeOfDay === context.timeOfDay;
    const isHighEnergyDay = patterns.energyPatterns?.highEnergyDays.includes(context.dayOfWeek) || false;

    // Add task-related nudges
    if (context.pendingTasksToday > 0) {
      if (isPreferredTime || isHighEnergyDay) {
        newNudges.push({
          id: `task-${Date.now()}`,
          type: 'reminder',
          message: mode === 'motivational'
            ? 'Dit is een goed moment om een taak af te ronden! Je hebt al eerder laten zien dat je dit kunt.'
            : 'Je hebt nog openstaande taken voor vandaag.',
          priority: 'medium',
          actionable: true,
          action: {
            label: 'Bekijk taken',
            href: '/taken'
          }
        });
      }
    }

    // Add energy management nudge if energy is low
    if (context.energyLevel !== undefined && context.energyLevel < 5) {
      newNudges.push({
        id: `energy-${Date.now()}`,
        type: 'suggestion',
        message: mode === 'clinical'
          ? 'Uw energieniveau is laag. Overweeg een korte rustperiode in te plannen.'
          : 'Je energieniveau lijkt wat laag. Misschien tijd voor een korte pauze?',
        priority: 'high',
        actionable: false
      });
    }

    // Add encouragement if tasks were completed
    if (context.completedTasksToday > 0) {
      newNudges.push({
        id: `encourage-${Date.now()}`,
        type: 'encouragement',
        message: mode === 'motivational'
          ? `Geweldig! Je hebt vandaag al ${context.completedTasksToday} ${context.completedTasksToday === 1 ? 'taak' : 'taken'} afgerond. Blijf zo doorgaan!`
          : `Je hebt vandaag ${context.completedTasksToday} ${context.completedTasksToday === 1 ? 'taak' : 'taken'} afgerond.`,
        priority: 'low',
        actionable: false
      });
    }

    // Add insight based on patterns
    if (patterns.completionRate > 0.7) {
      newNudges.push({
        id: `insight-${Date.now()}`,
        type: 'insight',
        message: 'Je rondt meer dan 70% van je taken succesvol af. Dat is beter dan gemiddeld!',
        priority: 'low',
        actionable: false
      });
    }

    // Limit to max nudges and sort by priority
    const priorityValues = { high: 3, medium: 2, low: 1 };
    const sortedNudges = newNudges.sort((a, b) =>
      priorityValues[b.priority] - priorityValues[a.priority]
    ).slice(0, maxNudges);

    setNudges(sortedNudges);
  }, []);

  // Initialize the assistant
  useEffect(() => {
    const initializeAssistant = async () => {
      if (!user?.id && !userId) return;

      try {
        // Fetch user context
        const context = await fetchUserContext();
        _setUserContext(context as UserContext);

        if (context) {
          // Analyze user behavior
          const _targetUserId = userId || user?.id as string;
          const patterns = await analyzeUserBehavior(_targetUserId);
          _setBehaviorPatterns(patterns);

          // Adjust assistant behavior
          if (patterns) {
            adjustAssistantBehavior(patterns, context);
          }
        }
      } catch (err) {
        console.error('Error initializing AI assistant:', err);
        setError('Kon AI-assistent niet initialiseren');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAssistant();
  }, [user?.id, userId, fetchUserContext, analyzeUserBehavior, adjustAssistantBehavior]);

  // Handle nudge action
  const handleNudgeAction = useCallback((nudge: Nudge) => {
    if (nudge.action?.onClick) {
      nudge.action.onClick();
    }

    // Remove the nudge after action
    setNudges(prev => prev.filter(n => n.id !== nudge.id));

    // Add notification for feedback
    addNotification({
      type: 'success',
      message: 'Actie uitgevoerd',
      duration: 3000
    });
  }, [addNotification]);

  // Handle dismiss nudge
  const handleDismissNudge = useCallback((nudgeId: string) => {
    setNudges(prev => prev.filter(n => n.id !== nudgeId));
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className={`${className} rounded-lg bg-white p-4 shadow-md`}>
        <div className="mb-2 flex items-center">
          <div className="mr-2 h-8 w-8 animate-pulse rounded-full bg-purple-100"></div>
          <div className="h-6 w-40 animate-pulse rounded bg-purple-100"></div>
        </div>
        <div className="space-y-3">
          <div className="h-4 w-full animate-pulse rounded bg-gray-100"></div>
          <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`${className} rounded-lg bg-white p-4 shadow-md`}>
        <AlertMessage
          type="error"
          title="Fout bij laden AI-assistent"
          message={error}
        />
      </div>
    );
  }

  // Empty state - no nudges
  if (nudges.length === 0) {
    return (
      <div className={`${className} rounded-lg bg-white p-4 shadow-md`}>
        <div className="flex items-center">
          <div className="mr-2 rounded-full bg-purple-100 p-2">
            <svg className="size-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-800">AI-assistent</h3>
        </div>
        <p className="mt-2 text-gray-600">
          {personalityMode === 'clinical'
            ? 'Geen aanbevelingen op dit moment. Uw gegevens worden geanalyseerd.'
            : 'Geen suggesties op dit moment. Ik zal je laten weten wanneer ik iets voor je heb!'}
        </p>
      </div>
    );
  }

  // Render nudges
  return (
    <div className={`${className} rounded-lg bg-white p-4 shadow-md`}>
      <div className="mb-3 flex items-center">
        <div className="mr-2 rounded-full bg-purple-100 p-2">
          <svg className="size-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-800">AI-assistent</h3>
      </div>

      <div className="space-y-3">
        {nudges.map(nudge => (
          <div
            key={nudge.id}
            className={`relative rounded-lg border p-3 ${nudge.type === 'reminder' ? 'border-blue-200 bg-blue-50' :
              nudge.type === 'encouragement' ? 'border-green-200 bg-green-50' :
                nudge.type === 'insight' ? 'border-purple-200 bg-purple-50' :
                  'border-amber-200 bg-amber-50'
              }`}
          >
            <button
              onClick={() => handleDismissNudge(nudge.id)}
              className="absolute right-2 top-2 rounded-full p-1 text-gray-400 hover:bg-white hover:text-gray-600"
              aria-label="Verwijderen"
            >
              <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <p className="pr-6 text-gray-700">{nudge.message}</p>

            {nudge.actionable && nudge.action && (
              <div className="mt-2">
                {nudge.action.href ? (
                  <a
                    href={nudge.action.href}
                    className="inline-flex items-center rounded-md bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                  >
                    {nudge.action.label}
                  </a>
                ) : (
                  <button
                    onClick={() => handleNudgeAction(nudge)}
                    className="inline-flex items-center rounded-md bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                  >
                    {nudge.action.label}
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
