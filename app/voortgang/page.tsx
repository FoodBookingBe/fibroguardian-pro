'use client';

import React from 'react';

import { useAuth } from '@/components/auth/AuthProvider';
import ProgressVisualization from '@/components/charts/ProgressVisualization';

export default function ProgressPage(): JSX.Element {
  const { profile, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded mb-6"></div>
          <div className="h-64 bg-gray-200 rounded mb-6"></div>
        </div>
      </div>
    );
  }
  
  // Only patients should access this page
  if (profile?.type !== 'patient') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Deze pagina is alleen toegankelijk voor patiënten.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Mijn Voortgang</h1>
      
      <p className="text-gray-600 mb-8">
        Hier kunt u uw voortgang en trends bekijken. Deze visualisaties helpen u om patronen te herkennen en inzicht te krijgen in uw gezondheid.
      </p>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ProgressVisualization 
          defaultMetric="pain" 
          defaultTimeRange="month" 
          defaultChartType="line"
        />
        
        <ProgressVisualization 
          defaultMetric="fatigue" 
          defaultTimeRange="month" 
          defaultChartType="area"
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProgressVisualization 
          defaultMetric="mood" 
          defaultTimeRange="month" 
          defaultChartType="line"
        />
        
        <ProgressVisualization 
          defaultMetric="tasks" 
          defaultTimeRange="month" 
          defaultChartType="bar"
        />
      </div>
      
      <div className="mt-12 bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Tips voor het interpreteren van uw voortgang</h2>
        
        <ul className="space-y-3 text-gray-600">
          <li className="flex items-start">
            <span className="text-purple-600 mr-2">•</span>
            <span>
              <strong>Patronen herkennen:</strong> Zoek naar verbanden tussen verschillende metrieken. Bijvoorbeeld, hoe beïnvloedt uw pijnniveau uw stemming of taakvoltooing?
            </span>
          </li>
          <li className="flex items-start">
            <span className="text-purple-600 mr-2">•</span>
            <span>
              <strong>Tijdsperiodes vergelijken:</strong> Gebruik de tijdselectie om verschillende periodes te vergelijken en seizoensgebonden patronen te ontdekken.
            </span>
          </li>
          <li className="flex items-start">
            <span className="text-purple-600 mr-2">•</span>
            <span>
              <strong>Deel inzichten:</strong> Bespreek opvallende trends met uw zorgverlener om uw behandelplan te optimaliseren.
            </span>
          </li>
          <li className="flex items-start">
            <span className="text-purple-600 mr-2">•</span>
            <span>
              <strong>Kleine verbeteringen vieren:</strong> Focus op positieve trends, hoe klein ook. Elke verbetering is een stap vooruit.
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
