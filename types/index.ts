export interface Profile {
  id: string;
  voornaam: string;
  achternaam: string;
  avatar_url?: string;
  type: 'patient' | 'specialist';
  postcode?: string;
  gemeente?: string;
  geboortedatum?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Task {
  id: string;
  user_id: string;
  type: 'taak' | 'opdracht';
  titel: string;
  beschrijving?: string;
  duur?: number;
  hartslag_doel?: number;
  herhaal_patroon: 'eenmalig' | 'dagelijks' | 'wekelijks' | 'maandelijks' | 'aangepast';
  dagen_van_week?: string[];
  metingen?: string[];
  notities?: string;
  labels?: string[];
  specialist_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface TaskLog {
  id: string;
  task_id: string;
  user_id: string;
  start_tijd: string; // Changed from Date to string (ISO string)
  eind_tijd?: string; // Changed from Date to string (ISO string)
  energie_voor?: number;
  energie_na?: number;
  pijn_score?: number;
  vermoeidheid_score?: number;
  stemming?: string;
  hartslag?: number;
  notitie?: string;
  ai_validatie?: string;
  created_at: Date;
}

export interface Planning {
  id: string;
  user_id: string;
  datum: Date;
  task_ids: string[];
  created_at: Date;
  updated_at: Date;
}

export interface Reflectie {
  id: string;
  user_id: string;
  datum: Date; // Stored as Date in the main type
  stemming?: string;
  notitie?: string;
  ai_validatie?: string;
  created_at: Date;
}

// Specific type for form data where date is a string
export interface ReflectieFormData {
  datum: string; // ISO string format (YYYY-MM-DD)
  stemming?: string; // Optional as per Omit in hook
  notitie?: string;  // Optional as per Omit in hook
  // user_id is added by API, id/created_at/ai_validatie are not part of form input
}


export interface SpecialistPatient {
  id: string;
  specialist_id: string;
  patient_id: string;
  toegangsrechten: string[];
  created_at: Date;
}

export interface Inzicht {
  id: string;
  user_id: string;
  periode: 'dag' | 'week' | 'maand';
  trend_type?: string;
  beschrijving: string;
  gegenereerd_door_ai: boolean;
  created_at: Date;
}

export interface Abonnement {
  id: string;
  user_id: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  plan_type?: 'basis' | 'premium' | 'enterprise';
  max_patienten?: number;
  verloopt_op?: Date;
  created_at: Date;
  updated_at: Date;
}
