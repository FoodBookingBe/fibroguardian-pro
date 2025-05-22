'use client';

import React from 'react';

import { AIRecommendation } from '@/types/ai';
import { formatDate } from '@/utils/validation';

interface AIRecommendationCardProps {
  recommendation: AIRecommendation;
  onDismiss?: (id: string) => void;
  className?: string;
}

/**
 * A card component that displays an AI recommendation to the user
 * with options to dismiss or take action on the recommendation
 */
export default function AIRecommendationCard({ 
  recommendation, 
  onDismiss,
  className = ''
}: AIRecommendationCardProps): JSX.Element {
  const { id, context_type, recommendation_text, confidence_score, is_dismissed, created_at } = recommendation;
  
  // Determine icon and color based on context type
  const getContextTypeDetails = () => {
    switch (context_type) {
      case 'task_suggestion':
        return {
          icon: (
            <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          ),
          label: 'Taak suggestie',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-700',
          borderColor: 'border-blue-200'
        };
      case 'symptom_alert':
        return {
          icon: (
            <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ),
          label: 'Symptoom waarschuwing',
          bgColor: 'bg-amber-50',
          textColor: 'text-amber-700',
          borderColor: 'border-amber-200'
        };
      case 'pattern_insight':
        return {
          icon: (
            <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          ),
          label: 'Patroon inzicht',
          bgColor: 'bg-purple-50',
          textColor: 'text-purple-700',
          borderColor: 'border-purple-200'
        };
      default:
        return {
          icon: (
            <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          ),
          label: 'AI Inzicht',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-200'
        };
    }
  };
  
  const { icon, label, bgColor, textColor, borderColor } = getContextTypeDetails();
  
  // Format confidence score as percentage
  const confidencePercentage = confidence_score 
    ? `${Math.round(confidence_score * 100)}%` 
    : 'Onbekend';
  
  // Handle dismiss button click
  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss(id);
    }
  };
  
  if (is_dismissed) {
    return <></>;
  }
  
  return (
    <div className={`${className} rounded-lg border ${borderColor} ${bgColor} p-4 shadow-sm transition-all duration-200 hover:shadow-md`}>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center">
          <div className={`mr-2 rounded-full ${bgColor} p-1.5 ${textColor}`}>
            {icon}
          </div>
          <h3 className={`font-medium ${textColor}`}>{label}</h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">
            {formatDate(created_at)}
          </span>
          {onDismiss && (
            <button
              type="button"
              onClick={handleDismiss}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
              aria-label="Verwijder aanbeveling"
            >
              <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      <div className="mb-3 whitespace-pre-wrap text-gray-700">
        {recommendation_text}
      </div>
      
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center text-xs text-gray-500">
          <svg className="mr-1 size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>Betrouwbaarheid: {confidencePercentage}</span>
        </div>
        
        {context_type === 'task_suggestion' && (
          <button
            type="button"
            className="rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            Taak aanmaken
          </button>
        )}
      </div>
    </div>
  );
}
