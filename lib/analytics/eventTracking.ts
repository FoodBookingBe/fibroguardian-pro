import React, { useEffect } from 'react';
import { User, AuthError, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { AnalyticsEvent, EventCallback, EventProperties, EventSchema } from './types';
import { getSupabaseBrowserClient } from '@/lib/supabase-client'; // Voor user ID uit sessie

// Validatie schema's voor verschillende events
const eventSchemas: Record<string, EventSchema> = {
  page_view: {
    required: ['path'],
    optional: ['referrer', 'title', 'utm_source', 'utm_medium', 'utm_campaign']
  },
  feature_view: { // Wanneer een specifieke feature UI wordt getoond
    required: ['featureId', 'featureName'],
    optional: ['source', 'context'] // Waarvandaan kwam de gebruiker
  },
  feature_interaction: { // Actieve interactie met een feature
    required: ['featureId', 'action'], // bv. featureId: 'task_creation', action: 'submit_form'
    optional: ['result', 'value', 'duration_ms', 'context'] // bv. result: 'success', value: '123'
  },
  upgrade_prompt_shown: {
    required: ['featureId', 'promptType', 'planOffered'], // bv. promptType: 'modal', planOffered: 'premium'
    optional: ['context', 'triggerEvent'] // Welke actie triggerde de prompt
  },
  upgrade_prompt_action: { // Hernoemd van _click voor algemeenheid
    required: ['featureId', 'promptType', 'actionTaken'], // bv. actionTaken: 'upgrade_clicked', 'dismissed'
    optional: ['context']
  },
  subscription_flow_step: { // Algemener dan _started
    required: ['stepName', 'planId', 'billingCycle'], // bv. stepName: 'checkout_initiated', 'payment_success'
    optional: ['source', 'trialDays', 'errorMessage']
  },
  // Applicatie-specifieke events
  task_created: {
    required: ['taskId', 'taskType'], // bv. taskType: 'eenmalig', 'herhalend'
    optional: ['specialistCreated', 'patientId', 'labels_count']
  },
  task_completed: { // Loggen van een taak
    required: ['taskId', 'taskType'],
    optional: ['duration_minutes', 'pijn_score', 'vermoeidheid_score', 'symptom_count']
  },
  symptom_logged: { // Als symptomen los van taken gelogd kunnen worden
    required: ['symptomName', 'severity'],
    optional: ['context'] // bv. 'daily_checkin', 'task_log'
  },
  specialist_patient_connection: {
    required: ['connectionAction'], // 'invite_sent', 'invite_accepted', 'connection_removed'
    optional: ['initiatorType'] // 'patient' or 'specialist'
  },
  user_profile_updated: {
    required: ['updatedFields'], // Array van veldnamen, bv. ['voornaam', 'postcode']
    optional: []
  },
  app_error_client: { // Client-side errors
    required: ['errorMessage', 'componentStack'],
    optional: ['errorCode', 'errorType', 'path']
  }
};

class AnalyticsService {
  private initialized = false;
  private userId: string | null = null;
  private userProperties: Record<string, any> = {};
  private eventCallbacks: EventCallback[] = [];
  private debugMode = false;
  private sessionId: string | null = null;
  private supabase = getSupabaseBrowserClient(); // Gebruik voor user ID

  constructor() {
    if (typeof window !== 'undefined') {
      this.sessionId = this.getOrCreateSessionId();
      // Probeer user ID te halen als die al bestaat (bv. na page refresh)
      this.supabase.auth.getUser().then(({ data: { user } , error }: { data: { user: User | null }, error: AuthError | null }) => {
        if (error) {
          console.error('[Analytics] Error fetching user for session:', error.message);
          this.userId = null;
        } else {
          this.userId = user?.id || null;
        }
      });
       // Luister naar auth changes om userId bij te werken
      this.supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => { 
        this.userId = session?.user?.id || null;
        if (this.debugMode) {
            console.log('[Analytics] Auth state changed, new userId:', this.userId);
        }
      });
    }
  }

  private getOrCreateSessionId(): string {
    let sid = sessionStorage.getItem('fibro_analytics_sid');
    if (!sid) {
      sid = crypto.randomUUID();
      sessionStorage.setItem('fibro_analytics_sid', sid);
    }
    return sid;
  }
  
  public init(options: { 
    debug?: boolean;
  } = {}) {
    if (this.initialized && typeof window !== 'undefined') { // Kan meerdere keren worden aangeroepen, maar init maar 1x
      return;
    }
    
    this.debugMode = options.debug || process.env.NODE_ENV === 'development';
    
    if (typeof window !== 'undefined') {
      this.trackPageView(); // Track initiële page view
      // Next.js App Router gebruikt geen history.pushState op dezelfde manier.
      // Page views moeten worden getracked in `layout.tsx` of via `useEffect` in page componenten
      // met `usePathname` en `useSearchParams`.
      // Voor nu, de automatische page view tracking bij route changes is hier verwijderd.
    }
    
    this.initialized = true;
    if (this.debugMode) console.log('[Analytics] Initialized.', { userId: this.userId, sessionId: this.sessionId });
  }
  
  public identify(userId: string, properties: Record<string, any> = {}) {
    this.userId = userId;
    this.userProperties = { ...this.userProperties, ...properties} // Type assertion fixed
const typedProperties = properties as Record<string, unknown> ;; // Merge properties
    if (this.debugMode) console.log('[Analytics] Identify:', { userId, properties });
    // Stuur eventueel een 'identify' call naar je analytics backend
  }

  public setUserProperties(properties: Record<string, any>) {
    this.userProperties = { ...this.userProperties, ...properties} // Type assertion fixed
const typedProperties = properties as Record<string, unknown> ;;
    if (this.debugMode) console.log('[Analytics] Set User Properties:', { properties });
  }

  public trackPageView(pathOverride?: string, titleOverride?: string) {
    if (typeof window === 'undefined') return;
    const properties: EventProperties = {
      path: pathOverride || window.location.pathname + window.location.search, // Inclusief query params
      referrer: document.referrer || undefined,
      title: titleOverride || document.title,
    };
    // Voeg UTM parameters toe indien aanwezig
    const searchParams = new URLSearchParams(window.location.search);
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(param => {
        if (searchParams.has(param)) properties[param] = searchParams.get(param);
    });
    this.trackEvent('page_view', properties);
  }
  
  public trackEvent(eventName: string, properties: EventProperties = {}) {
    if (!this.initialized && typeof window !== 'undefined') {
      this.init(); // Zorg dat het geïnitialiseerd is
    }
    
    const schema = eventSchemas[eventName];
    if (schema) {
      for (const required of schema.required) {
        if (properties[required] === undefined || properties[required] === null) {
          if (this.debugMode) console.warn(`[Analytics] Missing required property '${required}' for event '${eventName}'`);
          return; // Stuur event niet als verplichte velden missen
        }
      }
      const validProperties: EventProperties = {};
      const validKeys = [...schema.required, ...(schema.optional || [])];
      for (const key of validKeys) {
        if (properties[key] !== undefined) validProperties[key] = properties[key];
      }
      properties = validProperties; // Gebruik alleen gevalideerde properties
    } else if (this.debugMode) {
        console.warn(`[Analytics] No schema found for event '${eventName}'. Sending all properties.`);
    }
    
    const event: AnalyticsEvent = {
      name: eventName,
      properties,
      userId: this.userId, // userId wordt nu intern beheerd
      userProperties: this.userProperties,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
    };
    
    this.eventCallbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('[Analytics] Error in event callback:', error);
      }
    });
    
    if (this.debugMode) console.log('[Analytics] Event:', event);
    this.sendToBackend(event);
  }
  
  public addEventCallback(callback: EventCallback) {
    this.eventCallbacks.push(callback);
  }
  
  private async sendToBackend(event: AnalyticsEvent) {
    // TODO: Implement actual backend sending in production
    if (this.debugMode) {
      console.log('[Analytics] Debug mode: Event would be sent to backend:', event);
    }
  }
  
  public flushQueue() {
    if (typeof window === 'undefined' || !localStorage) return;
    const queueStr = localStorage.getItem('fibro_analytics_queue');
    if (!queueStr) return;
    
    try {
      const queue: AnalyticsEvent[] = JSON.parse(queueStr);
      localStorage.removeItem('fibro_analytics_queue'); // Verwijder direct om dubbel sturen te voorkomen
      
      if (this.debugMode) console.log(`[Analytics] Flushing ${queue.length} events from queue.`);
      queue.forEach(event => this.sendToBackend(event));
    } catch (e) {
      if (this.debugMode) console.error('[Analytics] Error flushing queue:', e);
    }
  }
}

export const analytics = new AnalyticsService();

// Convenience function for components
export function trackEvent(eventName: string, properties: EventProperties = {}) {
  analytics.trackEvent(eventName, properties);
}

// Hook voor gebruik in functionele componenten
export function useAnalytics() {
  // Zorg dat analytics geïnitialiseerd is bij gebruik van de hook
  useEffect(() => {
    if (typeof window !== 'undefined' && !analytics['initialized']) { // Check private field via accessor
        analytics.init();
    }
  }, []);

  return {
    trackEvent,
    trackPageView: analytics.trackPageView.bind(analytics),
    identify: analytics.identify.bind(analytics),
    setUserProperties: analytics.setUserProperties.bind(analytics),
  };
}

// Flush queue on window focus (likely reconnecting)
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => analytics.flushQueue()); // Specifiek voor online event
  // Init on load if not already done by a component using the hook
  // analytics.init(); // Kan hier, of in een root component van de app
}
