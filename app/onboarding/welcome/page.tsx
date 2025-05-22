'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';


import { useAuth } from '@/components/auth/AuthProvider';
import ProgressIndicator from '@/components/onboarding/ProgressIndicator';
import StepNavigation from '@/components/onboarding/StepNavigation';
import { useOnboarding } from '@/context/OnboardingContext';

export default function WelcomePage(): JSX.Element {
  const { profile } = useAuth();
  const { startOnboarding } = useOnboarding();
  
  // Start onboarding when the page loads
  useEffect(() => {
    startOnboarding();
  }, [startOnboarding]);
  
  const isSpecialist = profile?.type === 'specialist';
  
  return (
    <div className="max-w-3xl mx-auto">
      <ProgressIndicator />
      
      <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
        <div className="flex justify-center mb-6">
          <Image 
            src="/logo.png" 
            alt="FibroGuardian Pro Logo" 
            width={180} 
            height={180} 
            className="rounded-lg"
          />
        </div>
        
        <h1 className="text-3xl font-bold text-center text-purple-800 mb-6">
          Welkom bij FibroGuardian Pro
        </h1>
        
        <p className="text-lg text-gray-700 mb-6">
          {isSpecialist 
            ? 'Bedankt dat u heeft gekozen voor FibroGuardian Pro om uw patiënten te begeleiden. Deze korte introductie helpt u om snel aan de slag te gaan met het platform.'
            : 'Bedankt dat u heeft gekozen voor FibroGuardian Pro om uw fibromyalgie te beheren. Deze korte introductie helpt u om snel aan de slag te gaan met de app.'}
        </p>
        
        <div className="bg-purple-50 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-purple-800 mb-3">
            Wat kunt u verwachten?
          </h2>
          
          <ul className="space-y-3">
            {isSpecialist ? (
              <>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">✓</span>
                  <span>Beheer uw patiënten en hun behandelplannen</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">✓</span>
                  <span>Krijg inzicht in de gezondheid van uw patiënten met AI-analyses</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">✓</span>
                  <span>Deel kennis en aanbevelingen via de kennisbank</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">✓</span>
                  <span>Communiceer efficiënt met uw patiënten</span>
                </li>
              </>
            ) : (
              <>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">✓</span>
                  <span>Houd uw symptomen bij met dagelijkse reflecties</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">✓</span>
                  <span>Beheer uw taken en activiteiten</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">✓</span>
                  <span>Krijg persoonlijke inzichten en aanbevelingen</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">✓</span>
                  <span>Verbind met uw zorgverleners</span>
                </li>
              </>
            )}
          </ul>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-800 mb-3">
            Hoe werkt deze introductie?
          </h2>
          
          <p className="text-gray-700 mb-4">
            We leiden u stap voor stap door de belangrijkste functies van FibroGuardian Pro. 
            U kunt op elk moment:
          </p>
          
          <ul className="space-y-2">
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>Navigeren tussen stappen met de knoppen onderaan</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>Optionele stappen overslaan als u dat wenst</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>Terugkeren naar eerdere stappen om informatie te herlezen</span>
            </li>
          </ul>
        </div>
      </div>
      
      <StepNavigation />
    </div>
  );
}
