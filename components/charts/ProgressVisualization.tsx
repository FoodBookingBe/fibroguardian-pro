'use client';

import React, { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';


import { _useAuth as useAuth } from '@/components/auth/AuthProvider';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';

type ChartType = 'line' | 'area' | 'bar';
type TimeRange = 'week' | 'month' | 'quarter' | 'year';
type MetricType = 'pain' | 'fatigue' | 'mood' | 'tasks';

interface ProgressVisualizationProps {
  className?: string;
  defaultMetric?: MetricType;
  defaultTimeRange?: TimeRange;
  defaultChartType?: ChartType;
  showControls?: boolean;
  height?: number;
}

export const ProgressVisualization: React.FC<ProgressVisualizationProps> = ({
  className = '',
  defaultMetric = 'pain',
  defaultTimeRange = 'month',
  defaultChartType = 'line',
  showControls = true,
  height = 300
}) => {
  const { user } = useAuth();
  const [chartType, setChartType] = useState<ChartType>(defaultChartType);
  const [timeRange, setTimeRange] = useState<TimeRange>(defaultTimeRange);
  const [metric, setMetric] = useState<MetricType>(defaultMetric);
  const [data, setData] = useState<Array<{
    date: string;
    value: number;
    timestamp: number;
    mood?: string;
    completed?: number;
    total?: number;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trend, setTrend] = useState<'improving' | 'worsening' | 'stable' | null>(null);
  const [averageValue, setAverageValue] = useState<number | null>(null);
  
  // Fetch data based on selected metric and time range
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const supabase = getSupabaseBrowserClient();
        const now = new Date();
        const startDate = new Date();
        
        // Calculate start date based on time range
        switch (timeRange) {
          case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
          case 'quarter':
            startDate.setMonth(now.getMonth() - 3);
            break;
          case 'year':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        }
        
        let result;
        
        // Fetch data based on metric type
        if (metric === 'pain' || metric === 'fatigue') {
          const scoreField = metric === 'pain' ? 'pijn_score' : 'vermoeidheid_score';
          
          // Fetch from reflecties table
          const { data: reflectieData, error: reflectieError } = await supabase
            .from('reflecties')
            .select(`datum, ${scoreField}`)
            .eq('user_id', user.id)
            .gte('datum', startDate.toISOString())
            .lte('datum', now.toISOString())
            .order('datum', { ascending: true });
          
          if (reflectieError) {
            throw reflectieError;
          }
          
          // Transform data for chart
          result = reflectieData
            .filter(item => item[scoreField as keyof typeof item] !== null)
            .map(item => ({
              date: new Date(item.datum).toLocaleDateString(),
              value: item[scoreField as keyof typeof item] as number,
              timestamp: new Date(item.datum).getTime()
            }));
          
          // Calculate trend
          if (result.length >= 2) {
            const firstValues = result.slice(0, Math.ceil(result.length / 3)).map(item => item.value);
            const lastValues = result.slice(-Math.ceil(result.length / 3)).map(item => item.value);
            
            const firstAvg = firstValues.reduce((sum, val) => sum + val, 0) / firstValues.length;
            const lastAvg = lastValues.reduce((sum, val) => sum + val, 0) / lastValues.length;
            
            const diff = lastAvg - firstAvg;
            const threshold = 1.5; // Threshold for determining significant change
            
            if (Math.abs(diff) < threshold) {
              setTrend('stable');
            } else if ((metric === 'pain' || metric === 'fatigue') && diff > 0) {
              setTrend('worsening');
            } else if ((metric === 'pain' || metric === 'fatigue') && diff < 0) {
              setTrend('improving');
            }
            
            // Calculate average
            const allValues = result.map(item => item.value);
            setAverageValue(allValues.reduce((sum, val) => sum + val, 0) / allValues.length);
          }
        } else if (metric === 'mood') {
          // Fetch mood data from reflecties
          const { data: moodData, error: moodError } = await supabase
            .from('reflecties')
            .select('datum, stemming')
            .eq('user_id', user.id)
            .gte('datum', startDate.toISOString())
            .lte('datum', now.toISOString())
            .order('datum', { ascending: true });
          
          if (moodError) {
            throw moodError;
          }
          
          // Map mood strings to numeric values for visualization
          const moodMap: Record<string, number> = {
            'zeer slecht': 1,
            'slecht': 2,
            'matig': 3,
            'redelijk': 4,
            'goed': 5,
            'zeer goed': 6
          };
          
          // Transform data for chart
          result = moodData
            .filter(item => item.stemming && moodMap[item.stemming.toLowerCase()])
            .map(item => ({
              date: new Date(item.datum).toLocaleDateString(),
              value: moodMap[item.stemming.toLowerCase()] || 3,
              mood: item.stemming,
              timestamp: new Date(item.datum).getTime()
            }));
          
          // Calculate trend for mood (higher is better)
          if (result.length >= 2) {
            const firstValues = result.slice(0, Math.ceil(result.length / 3)).map(item => item.value);
            const lastValues = result.slice(-Math.ceil(result.length / 3)).map(item => item.value);
            
            const firstAvg = firstValues.reduce((sum, val) => sum + val, 0) / firstValues.length;
            const lastAvg = lastValues.reduce((sum, val) => sum + val, 0) / lastValues.length;
            
            const diff = lastAvg - firstAvg;
            const threshold = 0.5; // Threshold for determining significant change
            
            if (Math.abs(diff) < threshold) {
              setTrend('stable');
            } else if (diff > 0) {
              setTrend('improving');
            } else {
              setTrend('worsening');
            }
            
            // Calculate average
            const allValues = result.map(item => item.value);
            setAverageValue(allValues.reduce((sum, val) => sum + val, 0) / allValues.length);
          }
        } else if (metric === 'tasks') {
          // Fetch task completion data
          const { data: taskData, error: taskError } = await supabase
            .from('task_logs')
            .select('created_at, status')
            .eq('user_id', user.id)
            .gte('created_at', startDate.toISOString())
            .lte('created_at', now.toISOString())
            .order('created_at', { ascending: true });
          
          if (taskError) {
            throw taskError;
          }
          
          // Group tasks by date and calculate completion rate
          const tasksByDate: Record<string, { completed: number, total: number }> = {};
          
          taskData.forEach(task => {
            const date = new Date(task.created_at).toLocaleDateString();
            
            if (!tasksByDate[date]) {
              tasksByDate[date] = { completed: 0, total: 0 };
            }
            
            tasksByDate[date].total++;
            
            if (task.status === 'completed') {
              tasksByDate[date].completed++;
            }
          });
          
          // Transform data for chart
          result = Object.entries(tasksByDate).map(([date, stats]) => ({
            date,
            value: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0,
            completed: stats.completed,
            total: stats.total,
            timestamp: new Date(date).getTime()
          }));
          
          // Calculate trend for task completion (higher is better)
          if (result.length >= 2) {
            const firstValues = result.slice(0, Math.ceil(result.length / 3)).map(item => item.value);
            const lastValues = result.slice(-Math.ceil(result.length / 3)).map(item => item.value);
            
            const firstAvg = firstValues.reduce((sum, val) => sum + val, 0) / firstValues.length;
            const lastAvg = lastValues.reduce((sum, val) => sum + val, 0) / lastValues.length;
            
            const diff = lastAvg - firstAvg;
            const threshold = 5; // Threshold for determining significant change in percentage
            
            if (Math.abs(diff) < threshold) {
              setTrend('stable');
            } else if (diff > 0) {
              setTrend('improving');
            } else {
              setTrend('worsening');
            }
            
            // Calculate average
            const allValues = result.map(item => item.value);
            setAverageValue(allValues.reduce((sum, val) => sum + val, 0) / allValues.length);
          }
        }
        
        // Sort data by timestamp
        if (result && result.length > 0) {
          result.sort((a, b) => a.timestamp - b.timestamp);
          setData(result);
        } else {
          setData([]);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Er is een fout opgetreden bij het ophalen van de gegevens.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user, metric, timeRange]);
  
  // Get chart color based on metric
  const getChartColor = () => {
    switch (metric) {
      case 'pain':
        return '#ef4444'; // Red
      case 'fatigue':
        return '#f97316'; // Orange
      case 'mood':
        return '#3b82f6'; // Blue
      case 'tasks':
        return '#10b981'; // Green
      default:
        return '#8b5cf6'; // Purple
    }
  };
  
  // Get chart label based on metric
  const getChartLabel = () => {
    switch (metric) {
      case 'pain':
        return 'Pijnscore';
      case 'fatigue':
        return 'Vermoeidheid';
      case 'mood':
        return 'Stemming';
      case 'tasks':
        return 'Taakvoltooing (%)';
      default:
        return 'Waarde';
    }
  };
  
  // Get trend message based on trend and metric
  const getTrendMessage = () => {
    if (!trend) return <></>; // Empty fragment instead of null
    
    switch (metric) {
      case 'pain':
        return trend === 'improving' 
          ? 'Uw pijnscores vertonen een dalende trend. Goed bezig!' 
          : trend === 'worsening' 
            ? 'Uw pijnscores vertonen een stijgende trend. Bespreek dit met uw zorgverlener.' 
            : 'Uw pijnscores zijn stabiel.';
      case 'fatigue':
        return trend === 'improving' 
          ? 'Uw vermoeidheidsscores vertonen een dalende trend. Goed bezig!' 
          : trend === 'worsening' 
            ? 'Uw vermoeidheidsscores vertonen een stijgende trend. Bespreek dit met uw zorgverlener.' 
            : 'Uw vermoeidheidsscores zijn stabiel.';
      case 'mood':
        return trend === 'improving' 
          ? 'Uw stemming vertoont een positieve trend. Goed bezig!' 
          : trend === 'worsening' 
            ? 'Uw stemming vertoont een negatieve trend. Bespreek dit met uw zorgverlener.' 
            : 'Uw stemming is stabiel.';
      case 'tasks':
        return trend === 'improving' 
          ? 'Uw taakvoltooing vertoont een stijgende trend. Goed bezig!' 
          : trend === 'worsening' 
            ? 'Uw taakvoltooing vertoont een dalende trend. Probeer kleinere taken te plannen.' 
            : 'Uw taakvoltooing is stabiel.';
      default:
        return <></>; // Empty fragment instead of null
    }
  };
  
  // Render chart based on chart type
  const renderChart = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 bg-purple-200 rounded-full mb-2"></div>
            <div className="h-4 w-24 bg-purple-200 rounded mb-2"></div>
            <div className="h-3 w-16 bg-purple-100 rounded"></div>
          </div>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-red-500 text-center">
            <p className="mb-2">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Probeer opnieuw
            </button>
          </div>
        </div>
      );
    }
    
    if (data.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500 text-center">
            <p className="mb-2">Geen gegevens beschikbaar voor deze periode.</p>
            <p className="text-sm">Probeer een andere periode of metriek.</p>
          </div>
        </div>
      );
    }
    
    const color = getChartColor();
    const label = getChartLabel();
    
    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ backgroundColor: 'white', borderRadius: '0.375rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                formatter={(value: unknown) => [value, label]}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="value" 
                name={label} 
                stroke={color} 
                strokeWidth={2} 
                dot={{ r: 4, strokeWidth: 1 }} 
                activeDot={{ r: 6 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'area':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ backgroundColor: 'white', borderRadius: '0.375rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                formatter={(value: unknown) => [value, label]}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="value" 
                name={label} 
                stroke={color} 
                fill={`${color}33`} // Add transparency to fill color
                strokeWidth={2} 
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ backgroundColor: 'white', borderRadius: '0.375rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                formatter={(value: unknown) => [value, label]}
              />
              <Legend />
              <Bar dataKey="value" name={label} fill={color} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      
      default:
        return <></>; // Empty fragment instead of null
    }
  };
  
  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-2 md:mb-0">
          {metric === 'pain' && 'Pijnverloop'}
          {metric === 'fatigue' && 'Vermoeidheidsverloop'}
          {metric === 'mood' && 'Stemmingsverloop'}
          {metric === 'tasks' && 'Taakvoltooing'}
        </h2>
        
        {showControls && (
          <div className="flex flex-wrap gap-2">
            <select
              value={metric}
              onChange={(e: unknown) => setMetric(e.target.value as MetricType)}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm focus:ring-purple-500 focus:border-purple-500"
              aria-label="Selecteer metriek"
            >
              <option value="pain">Pijn</option>
              <option value="fatigue">Vermoeidheid</option>
              <option value="mood">Stemming</option>
              <option value="tasks">Taken</option>
            </select>
            
            <select
              value={timeRange}
              onChange={(e: unknown) => setTimeRange(e.target.value as TimeRange)}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm focus:ring-purple-500 focus:border-purple-500"
              aria-label="Selecteer tijdsperiode"
            >
              <option value="week">Week</option>
              <option value="month">Maand</option>
              <option value="quarter">Kwartaal</option>
              <option value="year">Jaar</option>
            </select>
            
            <select
              value={chartType}
              onChange={(e: unknown) => setChartType(e.target.value as ChartType)}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm focus:ring-purple-500 focus:border-purple-500"
              aria-label="Selecteer grafiektype"
            >
              <option value="line">Lijn</option>
              <option value="area">Gebied</option>
              <option value="bar">Staaf</option>
            </select>
          </div>
        )}
      </div>
      
      <div style={{ height: `${height}px` }} className="mb-4">
        {renderChart()}
      </div>
      
      {trend && averageValue !== null && (
        <div className={`mt-4 p-3 rounded-lg ${
          trend === 'improving' ? 'bg-green-50 text-green-700' :
          trend === 'worsening' ? 'bg-red-50 text-red-700' :
          'bg-blue-50 text-blue-700'
        }`}>
          <div className="flex items-center">
            {trend === 'improving' && (
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
              </svg>
            )}
            {trend === 'worsening' && (
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
              </svg>
            )}
            {trend === 'stable' && (
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14"></path>
              </svg>
            )}
            <p>{getTrendMessage()}</p>
          </div>
          <p className="mt-1 text-sm">
            Gemiddelde {getChartLabel().toLowerCase()}: {metric === 'tasks' ? `${averageValue.toFixed(1)}%` : averageValue.toFixed(1)}
          </p>
        </div>
      )}
    </div>
  );
};

export default ProgressVisualization;
