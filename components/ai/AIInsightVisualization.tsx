'use client';
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Inzicht, TaskLog } from '@/types';

interface AIInsightVisualizationProps {
  insight: Inzicht;
  logs: TaskLog[]; // Expect logs to be passed, relevant to the insight's period
}

const AIInsightVisualization: React.FC<AIInsightVisualizationProps> = ({ insight, logs }) => {
  const [chartData, setChartData] = useState<any[]>([]);
  // Default metric can be more dynamic based on insight, or a fixed default
  const [metric, setMetric] = useState<keyof Pick<TaskLog, 'pijn_score' | 'vermoeidheid_score' | 'energie_na' | 'stemming'>>('pijn_score');

  useEffect(() => {
    if (!logs || logs.length === 0) {
      setChartData([]);
      return;
    }

    // Determine relevant metrics from the insight description or type
    let initialMetric: typeof metric = 'pijn_score'; // Default
    const descriptionLower = insight.beschrijving.toLowerCase();
    if (descriptionLower.includes('pijn')) initialMetric = 'pijn_score';
    else if (descriptionLower.includes('vermoeidheid')) initialMetric = 'vermoeidheid_score';
    else if (descriptionLower.includes('energie')) initialMetric = 'energie_na'; // Assuming 'energie_na' is most relevant for energy trends
    else if (descriptionLower.includes('stemming')) initialMetric = 'stemming';
    setMetric(initialMetric);

    const processedData = logs.map(log => {
      const date = new Date(log.start_tijd);
      return {
        originalDate: date, // For sorting
        name: date.toLocaleDateString('nl-BE', { day: '2-digit', month: 'short' }),
        pijn_score: log.pijn_score,
        vermoeidheid_score: log.vermoeidheid_score,
        energie_na: log.energie_na,
        // Convert stemming string to a numerical value if you want to plot it
        stemming: log.stemming ? stringToSentimentScore(log.stemming) : null, 
      };
    }).sort((a, b) => a.originalDate.getTime() - b.originalDate.getTime());
    
    setChartData(processedData);
  }, [insight, logs]);

  const stringToSentimentScore = (sentiment?: string): number | null => {
    if (!sentiment) return <></>; // Empty fragment instead of null
    const sentimentMap: Record<string, number> = {
      'zeer goed': 18, 'goed': 15, 'neutraal': 10, 'redelijk': 12, // Added redelijk
      'matig': 8, 'slecht': 5, 'zeer slecht': 2,
    };
    const lowerSentiment = sentiment.toLowerCase();
    for (const [key, value] of Object.entries(sentimentMap)) {
      if (lowerSentiment.includes(key)) return value;
    }
    return 10; // Default to neutral if no specific match
  };

  const metricsInfo: Record<string, { label: string, color: string, domain?: [number, number | 'auto'] }> = {
    'pijn_score': { label: 'Pijn', color: '#ef4444', domain: [0, 20] },
    'vermoeidheid_score': { label: 'Vermoeidheid', color: '#f97316', domain: [0, 20] },
    'energie_na': { label: 'Energie (na)', color: '#10b981', domain: [0, 20] },
    'stemming': { label: 'Stemming (score)', color: '#6366f1', domain: [0, 20] } // Assuming stemming is converted to 0-20 scale
  };
  
  const currentMetricInfo = metricsInfo[metric] || metricsInfo['pijn_score'];

  const renderTrendIcon = () => {
    if (!insight.trend_type) return <></>; // Empty fragment instead of null
    const trend = insight.trend_type.toLowerCase();
    let icon = null;
    let text = '';
    let color = 'text-gray-600';

    if (trend.includes('positief')) {
      icon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" /></svg>;
      text = 'Positieve Trend'; color = 'text-green-600';
    } else if (trend.includes('negatief')) {
      icon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1v-5a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586l-4.293-4.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z" clipRule="evenodd" /></svg>;
      text = 'Negatieve Trend'; color = 'text-red-600';
    } else if (trend.includes('stabiel')) {
      icon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a1 1 0 01-1 1H3a1 1 0 110-2h14a1 1 0 011 1z" clipRule="evenodd" /></svg>;
      text = 'Stabiele Trend'; color = 'text-blue-600';
    }
    return icon ? <div className={`flex items-center text-sm font-medium ${color}`}>{icon}<span>{text}</span></div> : null;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
        <div>
          <h3 className="text-md md:text-lg font-semibold text-gray-800">
            {insight.periode.charAt(0).toUpperCase() + insight.periode.slice(1)}elijks Inzicht
            <span className="text-xs text-gray-500 ml-2">({new Date(insight.created_at).toLocaleDateString('nl-BE')})</span>
          </h3>
          {renderTrendIcon()}
        </div>
        <div className="mt-2 sm:mt-0 flex items-center text-xs text-purple-600 font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
          <span>AI Gegenereerd</span>
        </div>
      </div>
      
      <p className="text-sm text-gray-700 mb-4 leading-relaxed">{insight.beschrijving}</p>
      
      {chartData.length > 0 ? (
        <div className="mt-2">
          <div className="mb-2 flex items-center justify-end space-x-1">
            {(Object.keys(metricsInfo) as Array<keyof Pick<TaskLog, 'pijn_score' | 'vermoeidheid_score' | 'energie_na' | 'stemming'>>).map(mKey => (
              <button
                key={mKey}
                onClick={() => setMetric(mKey as keyof Pick<TaskLog, 'pijn_score' | 'vermoeidheid_score' | 'energie_na' | 'stemming'>)}
                className={`px-2 py-0.5 text-xs rounded-md transition-colors ${metric === mKey ? `${metricsInfo[mKey].color.replace('stroke-', 'bg-').replace('text-', 'bg-')} text-white` : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {metricsInfo[mKey].label}
              </button>
            ))}
          </div>
          
          <div className="h-56 md:h-64"> {/* Adjusted height */}
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis domain={currentMetricInfo.domain} tick={{ fontSize: 9 }} />
                <Tooltip formatter={(value: number) => [`${value} /20`, currentMetricInfo.label]} labelFormatter={(label: string) => `Datum: ${label}`} />
                <Legend verticalAlign="top" height={25} wrapperStyle={{fontSize: "10px"}}/>
                <Line type="monotone" dataKey={metric} stroke={currentMetricInfo.color} strokeWidth={1.5} activeDot={{ r: 4 }} name={currentMetricInfo.label} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center text-sm text-gray-500">
          Geen loggegevens beschikbaar om een visualisatie voor dit inzicht te tonen.
        </div>
      )}
    </div>
  );
};

export default React.memo(AIInsightVisualization);