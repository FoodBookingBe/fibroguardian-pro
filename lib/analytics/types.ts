// lib/analytics/types.ts

export interface EventProperties {
  [key: string]: any; // Flexibele properties
}

export interface AnalyticsEvent {
  name: string; // Naam van het event, bv. 'page_view', 'feature_interaction'
  properties: EventProperties;
  userId: string | null; // Optionele user ID
  userProperties: Record<string, any>; // Eigenschappen van de gebruiker
  timestamp: string; // ISO 8601 timestamp
  sessionId: string | null; // Kan null zijn als niet beschikbaar
}

export type EventCallback = (event: AnalyticsEvent) => void;

export interface EventSchema {
  required: string[]; // Lijst van verplichte property namen
  optional?: string[]; // Lijst van optionele property namen
}
