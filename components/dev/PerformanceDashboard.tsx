'use client';
import { useState, useEffect, useCallback } from 'react';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Colors, // Import Colors plugin
} from 'chart.js';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Colors // Register Colors plugin
);

interface PerformanceMetrics {
  FCP: number;
  LCP: number;
  FID: number;
  CLS: number;
  TTI: number;
  TBT: number;
  resourceLoading: Array<{ name: string; startTime: number; duration: number; size: number; category: string }>;
  jsExecution: Array<{ name: string; duration: number; size: number }>;
  renderBlocking: Array<{ name: string; duration: number; size: number }>;
  longTasks: Array<{ name: string; startTime: number; duration: number }>;
}

// Functie om performance metrics te verzamelen
function capturePerformanceMetrics(): PerformanceMetrics | null {
  if (typeof window === 'undefined' || typeof performance === 'undefined') return null;
  
  const metrics: PerformanceMetrics = {
    FCP: 0, LCP: 0, FID: 0, CLS: 0, TTI: 0, TBT: 0,
    resourceLoading: [], jsExecution: [], renderBlocking: [], longTasks: [],
  };
  
  const navigationEntries = performance.getEntriesByType('navigation');
  if (navigationEntries.length > 0) {
    const navEntry = navigationEntries[0] as PerformanceNavigationTiming;
    metrics.TTI = navEntry.domInteractive;
    // TBT is complex, often derived from Long Tasks. Placeholder for now.
  }
  
  performance.getEntriesByType('paint').forEach((entry) => {
    if (entry.name === 'first-contentful-paint') metrics.FCP = entry.startTime;
  });

  performance.getEntriesByType('largest-contentful-paint').forEach((entry) => {
    // LCP is more complex, this is a simplification. Use web-vitals for accurate LCP.
    metrics.LCP = entry.startTime; 
  });
  
  performance.getEntriesByType('resource').forEach((entry) => {
    const resourceEntry = entry as PerformanceResourceTiming;
    let category = 'other';
    if (resourceEntry.name.includes('.js')) category = 'js';
    else if (resourceEntry.name.includes('.css')) category = 'css';
    else if (/\.(jpe?g|png|gif|svg|webp)$/i.test(resourceEntry.name)) category = 'image';
    else if (resourceEntry.name.includes('/api/')) category = 'api';
    
    metrics.resourceLoading.push({
      name: new URL(resourceEntry.name, window.location.origin).pathname,
      startTime: resourceEntry.startTime,
      duration: resourceEntry.duration,
      size: resourceEntry.transferSize || resourceEntry.decodedBodySize || 0,
      category,
    });

    if (category === 'js') {
      metrics.jsExecution.push({
        name: new URL(resourceEntry.name, window.location.origin).pathname,
        duration: resourceEntry.duration,
        size: resourceEntry.transferSize || resourceEntry.decodedBodySize || 0,
      });
    }
    // Check for render-blocking resources (simplified: CSS and fonts are often render-blocking)
    // 'renderBlockingStatus' is experimental and might not be available on all PerformanceResourceTiming entries.
    const isRenderBlocking = (entry: PerformanceResourceTiming): boolean => {
      if ('renderBlockingStatus' in entry) {
        return (entry as any).renderBlockingStatus === 'blocking';
      }
      // Fallback for browsers not supporting renderBlockingStatus:
      // Assume CSS and fonts are render-blocking by default if not loaded async/deferred.
      return entry.initiatorType === 'css' || entry.initiatorType === 'font';
    };

    if (isRenderBlocking(resourceEntry)) {
       metrics.renderBlocking.push({
        name: new URL(resourceEntry.name, window.location.origin).pathname,
        duration: resourceEntry.duration,
        size: resourceEntry.transferSize || resourceEntry.decodedBodySize || 0,
      });
    }
  });

  if (typeof PerformanceObserver !== 'undefined' && 'observe' in PerformanceObserver.prototype) {
    const longTaskObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        metrics.longTasks.push({
          name: entry.name,
          startTime: entry.startTime,
          duration: entry.duration,
        });
        // Update TBT based on long tasks over 50ms
        if (entry.duration > 50) {
            metrics.TBT += (entry.duration - 50);
        }
      }
    });
    try {
      longTaskObserver.observe({ type: 'longtask', buffered: true });
    } catch (e) {
      console.warn('Longtask observer not supported or failed.', e);
    }
  }
  
  return metrics;
}

export default function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [view, setView] = useState<'overview' | 'resources' | 'javascript' | 'rendering'>('overview');
  
  const loadMetrics = useCallback(() => {
    const initialMetrics = capturePerformanceMetrics();
    if (initialMetrics) {
      setMetrics(prev => ({...prev, ...initialMetrics})); // Merge, keeping web-vitals if already set
    }

    if (typeof window !== 'undefined') {
      import('web-vitals').then(({ onCLS, onFID, onLCP, onTBT }) => { // Added onTBT
        onCLS((result) => setMetrics(prev => ({ ...prev!, CLS: result.value })), { reportAllChanges: true });
        onFID((result) => setMetrics(prev => ({ ...prev!, FID: result.value })));
        onLCP((result) => setMetrics(prev => ({ ...prev!, LCP: result.value })));
        onTBT((result) => setMetrics(prev => ({ ...prev!, TBT: result.value }))); // Get TBT from web-vitals
      });
    }
  }, []);
  
  useEffect(() => {
    loadMetrics(); // Initial load
    const timeout = setTimeout(loadMetrics, 3000); // Load again after page is likely settled
    return () => clearTimeout(timeout);
  }, [loadMetrics]);
  
  if (!metrics) {
    return <div className="p-8 text-center text-gray-500">Verzamelen van performance metrics...</div>;
  }
  
  // Data for Resource Loading Chart
  const topSlowestResources = [...metrics.resourceLoading]
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 10);

  const resourceChartData = {
    labels: topSlowestResources.map(r => r.name.split('/').pop() || r.name),
    datasets: [{
      label: 'Laadtijd (ms)',
      data: topSlowestResources.map(r => r.duration),
      backgroundColor: topSlowestResources.map(r => {
        switch(r.category) {
          case 'js': return 'rgba(139, 92, 246, 0.7)'; // purple
          case 'css': return 'rgba(236, 72, 153, 0.7)'; // pink
          case 'image': return 'rgba(6, 182, 212, 0.7)'; // cyan
          case 'api': return 'rgba(245, 158, 11, 0.7)'; // amber
          default: return 'rgba(156, 163, 175, 0.7)'; // gray
        }
      }),
    }],
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-purple-700 mb-2">
          FibroGuardian Pro - Performance Dashboard
        </h1>
        <p className="text-gray-600">Real-time inzichten in de prestaties van de applicatie.</p>
      </header>
      
      <nav className="mb-6 flex space-x-2 border-b border-gray-300 pb-2">
        {(['overview', 'resources', 'javascript', 'rendering'] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-2 rounded-t-md text-sm font-medium transition-colors ${
              view === v 
                ? 'bg-purple-600 text-white border-b-2 border-purple-700' 
                : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'
            }`}
          >
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </nav>
        
      {view === 'overview' && (
        <section id="overview-metrics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <MetricCard title="First Contentful Paint (FCP)" value={metrics.FCP} unit="ms" goodThreshold={1800} poorThreshold={3000} />
          <MetricCard title="Largest Contentful Paint (LCP)" value={metrics.LCP} unit="ms" goodThreshold={2500} poorThreshold={4000} />
          <MetricCard title="First Input Delay (FID)" value={metrics.FID} unit="ms" goodThreshold={100} poorThreshold={300} />
          <MetricCard title="Cumulative Layout Shift (CLS)" value={metrics.CLS} unit="" goodThreshold={0.1} poorThreshold={0.25} precision={3} />
          <MetricCard title="Time to Interactive (TTI)" value={metrics.TTI} unit="ms" goodThreshold={3800} poorThreshold={7300} />
          <MetricCard title="Total Blocking Time (TBT)" value={metrics.TBT} unit="ms" goodThreshold={200} poorThreshold={600} />
        </section>
      )}
      
      {view === 'resources' && (
        <section id="resource-analysis" className="space-y-6 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Resource Analyse</h2>
          <div className="h-96"> {/* Increased height for better visibility */}
            <Bar data={resourceChartData} options={resourceChartOptions} />
          </div>
          <ResourceTable resources={metrics.resourceLoading} />
        </section>
      )}
      
      {/* TODO: Implement JavaScript and Rendering views */}
      {view === 'javascript' && <div className="bg-white p-6 rounded-lg shadow"><h2 className="text-xl font-semibold">JavaScript Execution</h2><p>Details over JS execution komen hier.</p></div>}
      {view === 'rendering' && <div className="bg-white p-6 rounded-lg shadow"><h2 className="text-xl font-semibold">Render-Blocking Resources</h2><p>Details over render-blocking resources komen hier.</p></div>}
      
      <footer className="mt-8 text-center">
        <button
          onClick={loadMetrics}
          className="px-6 py-2 bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-700 transition-colors shadow focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        >
          Metrics Verversen
        </button>
        <p className="text-xs text-gray-500 mt-2">
          Laatst bijgewerkt: {new Date().toLocaleTimeString()}
        </p>
      </footer>
    </div>
  );
}

// Helper component voor metrieken
function MetricCard({ title, value, unit, goodThreshold, poorThreshold, precision = 0 }: 
  { title: string; value?: number; unit: string; goodThreshold: number; poorThreshold: number; precision?: number }
) {
  let status = 'unknown';
  let bgColor = 'bg-gray-100';
  let textColor = 'text-gray-800';

  if (value !== undefined && value !== null) {
    if (title === 'Cumulative Layout Shift') { // Lower is better for CLS
        if (value <= goodThreshold) status = 'good';
        else if (value <= poorThreshold) status = 'warning';
        else status = 'poor';
    } else { // Higher is better for others (or rather, lower time is better)
        if (value <= goodThreshold) status = 'good';
        else if (value <= poorThreshold) status = 'warning';
        else status = 'poor';
    }
  }
  
  if (status === 'good') { bgColor = 'bg-green-100'; textColor = 'text-green-800'; }
  else if (status === 'warning') { bgColor = 'bg-yellow-100'; textColor = 'text-yellow-800'; }
  else if (status === 'poor') { bgColor = 'bg-red-100'; textColor = 'text-red-800'; }
  
  return (
    <div className={`${bgColor} p-4 rounded-lg shadow-md`}>
      <h3 className="text-sm font-medium text-gray-700 truncate">{title}</h3>
      <p className={`text-3xl font-bold ${textColor} mt-1`}>
        {value !== undefined && value !== null ? value.toFixed(precision) : '-'}
        <span className="text-sm font-normal ml-1">{unit}</span>
      </p>
      <p className={`text-xs mt-1 ${
        status === 'good' ? 'text-green-600' : 
        status === 'warning' ? 'text-yellow-600' : 
        status === 'poor' ? 'text-red-600' : 'text-gray-500'
      }`}>
        {status === 'good' ? 'Goed' : status === 'warning' ? 'Matig' : status === 'poor' ? 'Slecht' : 'N/A'}
      </p>
    </div>
  );
}

// Chart options for Resource Chart
const resourceChartOptions = {
  indexAxis: 'y' as const,
  responsive: true,
  maintainAspectRatio: false,
  scales: { x: { beginAtZero: true, title: { display: true, text: 'Laadtijd (ms)' } }, y: { ticks: { autoSkip: false } } },
  plugins: {
    legend: { display: false },
    title: { display: true, text: 'Top 10 Langzaamste Resources (ms)', font: { size: 16 } },
  },
};

// Table for Resources
function ResourceTable({ resources }: { resources: PerformanceMetrics['resourceLoading']}) {
  const sortedResources = [...resources].sort((a,b) => b.duration - a.duration).slice(0, 20);
  return (
    <div className="overflow-x-auto mt-6">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 text-left font-semibold text-gray-600">Resource</th>
            <th className="px-4 py-2 text-left font-semibold text-gray-600">Type</th>
            <th className="px-4 py-2 text-right font-semibold text-gray-600">Grootte (KB)</th>
            <th className="px-4 py-2 text-right font-semibold text-gray-600">Laadtijd (ms)</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedResources.map((resource, index) => (
            <tr key={index}>
              <td className="px-4 py-2 whitespace-nowrap truncate max-w-xs" title={resource.name}>
                {resource.name.split('/').pop() || resource.name}
              </td>
              <td className="px-4 py-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  resource.category === 'js' ? 'bg-purple-100 text-purple-700' :
                  resource.category === 'css' ? 'bg-pink-100 text-pink-700' :
                  resource.category === 'image' ? 'bg-cyan-100 text-cyan-700' :
                  resource.category === 'api' ? 'bg-amber-100 text-amber-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {resource.category}
                </span>
              </td>
              <td className="px-4 py-2 text-right">
                {(resource.size / 1024).toFixed(1)}
              </td>
              <td className={`px-4 py-2 text-right font-medium ${
                resource.duration > 500 ? 'text-red-500' : 
                resource.duration > 200 ? 'text-amber-500' : 
                'text-green-600'
              }`}>
                {resource.duration.toFixed(0)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
