import { getCLS, getFID, getLCP, getFCP, getTTFB } from 'web-vitals';

interface MetricReport {
  name: string;
  value: number;
  id: string;
  delta: number;
  navigationType?: string;
}

type ReportCallback = (metric: MetricReport) => void;

/**
 * Available metric types for monitoring
 */
export enum MetricType {
  CLS = 'CLS', // Cumulative Layout Shift
  FID = 'FID', // First Input Delay
  LCP = 'LCP', // Largest Contentful Paint
  FCP = 'FCP', // First Contentful Paint
  TTFB = 'TTFB' // Time to First Byte
}

/**
 * Configuration options for performance monitoring
 */
export interface PerformanceMonitoringOptions {
  /** Which metrics to monitor */
  metrics?: MetricType[];
  /** Custom reporting function */
  reportHandler?: ReportCallback;
  /** Whether to log metrics to console */
  logToConsole?: boolean;
  /** Whether to send metrics to analytics */
  sendToAnalytics?: boolean;
  /** Custom analytics event name */
  analyticsEventName?: string;
}

/**
 * Default options for performance monitoring
 */
const defaultOptions: PerformanceMonitoringOptions = {
  metrics: [
    MetricType.CLS,
    MetricType.FID,
    MetricType.LCP,
    MetricType.FCP,
    MetricType.TTFB
  ],
  logToConsole: process.env.NODE_ENV === 'development',
  sendToAnalytics: process.env.NODE_ENV === 'production',
  analyticsEventName: 'web_vitals'
};

/**
 * Initialize performance monitoring
 * 
 * @param options Configuration options
 */
export function initPerformanceMonitoring(
  options: PerformanceMonitoringOptions = {}
): void {
  const config = { ...defaultOptions, ...options} // Type assertion fixed
const _typedOptions = options as Record<string, unknown> ;;
  
  // Create the metric handler
  const reportMetric = createMetricHandler(config);
  
  // Initialize the metrics to monitor
  if (config.metrics?.includes(MetricType.CLS)) {
    getCLS(reportMetric);
  }
  
  if (config.metrics?.includes(MetricType.FID)) {
    getFID(reportMetric);
  }
  
  if (config.metrics?.includes(MetricType.LCP)) {
    getLCP(reportMetric);
  }
  
  if (config.metrics?.includes(MetricType.FCP)) {
    getFCP(reportMetric);
  }
  
  if (config.metrics?.includes(MetricType.TTFB)) {
    getTTFB(reportMetric);
  }
}

/**
 * Create a metric handler based on configuration
 * 
 * @param config Configuration options
 * @returns Metric handler function
 */
function createMetricHandler(
  config: PerformanceMonitoringOptions
): ReportCallback {
  return (metric: MetricReport) => {
    // Use custom handler if provided
    if (config.reportHandler) {
      config.reportHandler(metric);
      return;
    }
    
    // Log to console if enabled
    if (config.logToConsole) {
      console.log(`[Performance] ${metric.name}: ${metric.value}`);
    }
    
    // Send to analytics if enabled
    if (config.sendToAnalytics) {
      sendToAnalytics(metric, config.analyticsEventName || 'web_vitals');
    }
  };
}

/**
 * Send metric to analytics
 * 
 * @param metric The metric to send
 * @param eventName The analytics event name
 */
function sendToAnalytics(metric: MetricReport, eventName: string): void {
  try {
    // Check if window and analytics are available
    if (typeof window === 'undefined' || !window.gtag) {
      return;
    }
    
    // Send to Google Analytics if available
    window.gtag('event', eventName, {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      non_interaction: true,
      metric_name: metric.name,
      metric_value: metric.value,
      metric_delta: metric.delta
    });
  } catch (error) {
    console.error('[Performance] Failed to send metrics to analytics:', error);
  }
}

/**
 * Get performance marks and measures
 * 
 * @returns Object containing performance marks and measures
 */
export function getPerformanceMarks(): {
  marks: PerformanceMark[];
  measures: PerformanceMeasure[];
} {
  if (typeof window === 'undefined' || !window.performance) {
    return { marks: [], measures: [] };
  }
  
  return {
    marks: window.performance.getEntriesByType('mark') as PerformanceMark[],
    measures: window.performance.getEntriesByType('measure') as PerformanceMeasure[]
  };
}

/**
 * Create a performance mark
 * 
 * @param name Mark name
 */
export function markPerformance(name: string): void {
  if (typeof window === 'undefined' || !window.performance) {
    return;
  }
  
  try {
    window.performance.mark(name);
  } catch (error) {
    console.error(`[Performance] Failed to create mark "${name}":`, error);
  }
}

/**
 * Measure time between two marks
 * 
 * @param name Measure name
 * @param startMark Start mark name
 * @param endMark End mark name (optional, defaults to now)
 * @returns Duration in milliseconds
 */
export function measurePerformance(
  name: string,
  startMark: string,
  endMark?: string
): number {
  if (typeof window === 'undefined' || !window.performance) {
    return 0;
  }
  
  try {
    window.performance.measure(name, startMark, endMark);
    const measure = window.performance.getEntriesByName(name, 'measure')[0];
    return measure.duration;
  } catch (error) {
    console.error(`[Performance] Failed to measure "${name}":`, error);
    return 0;
  }
}

/**
 * Clear all performance marks and measures
 */
export function clearPerformanceMarks(): void {
  if (typeof window === 'undefined' || !window.performance) {
    return;
  }
  
  try {
    window.performance.clearMarks();
    window.performance.clearMeasures();
  } catch (error) {
    console.error('[Performance] Failed to clear marks and measures:', error);
  }
}

// Add gtag to window type
declare global {
  interface Window {
    gtag: (
      command: string,
      action: string,
      params: Record<string, any>
    ) => void;
  }
}
