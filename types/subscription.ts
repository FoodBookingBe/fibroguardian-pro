// types/subscription.ts
export type SubscriptionTier = 'free' | 'basic' | 'premium' | 'professional';

export interface SubscriptionFeature {
  id: string;
  name: string;
  description: string;
  tiers: SubscriptionTier[]; // Tiers die deze feature bevatten
  highlight?: boolean; // Of deze feature uitgelicht moet worden
}

export interface SubscriptionPlan {
  id: SubscriptionTier; // Unieke ID voor het plan (bv. 'patient_basic', 'specialist_premium')
  name: string; // Weergavenaam (bv. "Basis", "Professioneel")
  description: string;
  price: {
    monthly: number; // Prijs per maand
    yearly: number;  // Prijs per jaar
  };
  features: string[]; // Array van feature IDs die in dit plan zijn inbegrepen
  userType: 'patient' | 'specialist' | 'both'; // Voor wie is dit plan bedoeld
  ctaText: string; // Call to action tekst voor de knop
  popular?: boolean; // Of dit een populair plan is
  stripePriceIds?: { // Optioneel, voor directe mapping naar Stripe Price IDs
    monthly?: string;
    yearly?: string;
  };
}

// Functionaliteiten voor patiënten en specialisten
export const subscriptionFeatures: SubscriptionFeature[] = [
  // Patiënt features
  {
    id: 'symptoms-tracking',
    name: 'Symptomen Bijhouden',
    description: 'Dagelijks bijhouden van pijn, vermoeidheid en andere symptomen',
    tiers: ['free', 'basic', 'premium'],
    highlight: true,
  },
  {
    id: 'basic-reports',
    name: 'Basis Rapportages',
    description: 'Wekelijkse samenvattingen van symptomen en activiteiten',
    tiers: ['free', 'basic', 'premium'],
  },
  {
    id: 'medication-tracking',
    name: 'Medicatie Tracking',
    description: 'Bijhouden van medicatie en inname',
    tiers: ['free', 'basic', 'premium'],
  },
  {
    id: 'activity-planning',
    name: 'Activiteitenplanning',
    description: 'Simpele dagelijkse activiteitenplanning',
    tiers: ['free', 'basic', 'premium'],
  },
  {
    id: 'specialist-sharing-limited', // Aangepast ID voor duidelijkheid
    name: 'Delen met 1 Specialist',
    description: 'Gegevens delen met één behandelaar',
    tiers: ['free', 'basic', 'premium'], // Free tier kan ook delen met 1 specialist
  },
  {
    id: 'advanced-analytics',
    name: 'Geavanceerde Analytics & Inzichten',
    description: 'Patroonherkenning en AI-gedreven inzichten in uw gezondheidsdata',
    tiers: ['basic', 'premium'],
    highlight: true,
  },
  {
    id: 'unlimited-specialists',
    name: 'Onbeperkt Specialisten Delen',
    description: 'Gegevens delen met een onbeperkt aantal behandelaars',
    tiers: ['basic', 'premium'], // Basic kan al onbeperkt zijn, of maak een onderscheid
  },
  {
    id: 'export-data',
    name: 'Data Export (PDF/CSV)',
    description: 'Exporteer uw gezondheidsgegevens in PDF of CSV formaat',
    tiers: ['basic', 'premium'],
  },
  {
    id: 'custom-metrics',
    name: 'Aangepaste Metrics & Symptomen',
    description: 'Definieer en volg uw eigen unieke symptomen en metrics',
    tiers: ['premium'],
    highlight: true,
  },
  {
    id: 'priority-support',
    name: 'Prioriteit Klantenservice',
    description: 'Versnelde responstijd voor ondersteuningsvragen via chat of e-mail',
    tiers: ['premium'],
  },
  
  // Specialist features
  {
    id: 'patient-management-dashboard', // Duidelijker ID
    name: 'Patiëntbeheer Dashboard',
    description: 'Centraal dashboard voor het beheren van uw patiënten en hun gedeelde gegevens',
    tiers: ['basic', 'premium', 'professional'], // Aangepast, basis is voor specialisten
  },
  {
    id: 'limited-patients',
    name: 'Tot 10 Patiënten',
    description: 'Beheer en volg de voortgang van maximaal 10 patiënten',
    tiers: ['basic'], // Was 'professional_basic'
  },
  {
    id: 'expanded-patients',
    name: 'Tot 50 Patiënten',
    description: 'Beheer en volg de voortgang van maximaal 50 patiënten',
    tiers: ['premium'], // Was 'professional_premium'
  },
  {
    id: 'unlimited-patients',
    name: 'Onbeperkt Aantal Patiënten',
    description: 'Beheer een onbeperkt aantal patiënten in uw praktijk',
    tiers: ['professional'],
    highlight: true,
  },
  {
    id: 'treatment-tracking-tools', // Duidelijker ID
    name: 'Behandelingsvoortgang Tools',
    description: 'Tools voor het volgen van de voortgang van behandelingen en interventies per patiënt',
    tiers: ['premium', 'professional'],
  },
  {
    id: 'advanced-reporting-specialist', // Duidelijker ID
    name: 'Geavanceerde Praktijk Rapportages',
    description: 'Uitgebreide rapportages en analyses over uw patiëntenpopulatie en praktijkprestaties',
    tiers: ['premium', 'professional'],
    highlight: true,
  },
  {
    id: 'clinical-integration-api', // Duidelijker ID
    name: 'Klinische Systeemintegratie (API)',
    description: 'API toegang voor integratie met bestaande klinische systemen en EPDs',
    tiers: ['professional'],
  },
  {
    id: 'team-access-management', // Duidelijker ID
    name: 'Team Toegang & Rollenbeheer',
    description: 'Nodig meerdere teamleden uit en beheer hun toegangsrechten binnen uw praktijkaccount',
    tiers: ['professional'],
  },
];

// Abonnementsplannen voor patiënten
export const patientPlans: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Gratis',
    description: 'Start met het bijhouden van uw symptomen en deel met één specialist.',
    price: { monthly: 0, yearly: 0 },
    features: [
      'symptoms-tracking',
      'basic-reports',
      'medication-tracking',
      'activity-planning',
      'specialist-sharing-limited',
    ],
    userType: 'patient',
    ctaText: 'Start Gratis',
  },
  {
    id: 'basic',
    name: 'Basis',
    description: 'Krijg diepere inzichten en deel onbeperkt met uw zorgteam.',
    price: { monthly: 4.99, yearly: 49.99 }, // ~16% korting
    features: [
      'symptoms-tracking',
      'basic-reports',
      'medication-tracking',
      'activity-planning',
      'unlimited-specialists', // Aangepast van specialist-sharing-limited
      'advanced-analytics',
      'export-data',
    ],
    userType: 'patient',
    ctaText: 'Start Proefperiode', // 14 dagen gratis proefperiode
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'De meest complete ervaring met personalisatie en prioriteitssupport.',
    price: { monthly: 9.99, yearly: 99.99 }, // ~16% korting
    features: [
      'symptoms-tracking',
      'basic-reports',
      'medication-tracking',
      'activity-planning',
      'unlimited-specialists',
      'advanced-analytics',
      'export-data',
      'custom-metrics',
      'priority-support',
    ],
    userType: 'patient',
    ctaText: 'Start Proefperiode',
  },
];

// Abonnementsplannen voor specialisten
export const specialistPlans: SubscriptionPlan[] = [
  {
    id: 'basic', // Was 'professional_basic'
    name: 'Starter',
    description: 'Ideaal voor solo-beoefenaars om patiëntenzorg te optimaliseren.',
    price: { monthly: 19.99, yearly: 199.99 },
    features: [
      'patient-management-dashboard',
      'limited-patients', // Tot 10 patiënten
    ],
    userType: 'specialist',
    ctaText: 'Start Proefperiode',
  },
  {
    id: 'premium', // Was 'professional_premium'
    name: 'Praktijk', // Duidelijkere naam
    description: 'Voor groeiende praktijken die geavanceerde tools en meer patiëntcapaciteit nodig hebben.',
    price: { monthly: 49.99, yearly: 499.99 },
    features: [
      'patient-management-dashboard',
      'expanded-patients', // Tot 50 patiënten
      'treatment-tracking-tools',
      'advanced-reporting-specialist',
    ],
    userType: 'specialist',
    ctaText: 'Start Proefperiode',
    popular: true,
  },
  {
    id: 'professional', // Was 'professional_enterprise'
    name: 'Kliniek', // Duidelijkere naam
    description: 'De complete oplossing voor grote praktijken, klinieken en medische instellingen.',
    price: { monthly: 99.99, yearly: 999.99 }, // Of "Neem contact op"
    features: [
      'patient-management-dashboard',
      'unlimited-patients',
      'treatment-tracking-tools',
      'advanced-reporting-specialist',
      'clinical-integration-api',
      'team-access-management',
      'priority-support', // Ook voor specialisten
    ],
    userType: 'specialist',
    ctaText: 'Neem Contact Op', // Voor enterprise kan dit beter zijn
  },
];
