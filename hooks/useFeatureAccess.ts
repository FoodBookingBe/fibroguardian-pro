import { useAuth } from '@/components/auth/AuthProvider'; // Aangepast pad
// import { useSubscription } from '@/hooks/useSubscription'; // Placeholder, zie hieronder
import { subscriptionFeatures, SubscriptionFeature, SubscriptionTier, patientPlans, specialistPlans } from '@/types/subscription';
import { useCallback, useState, useEffect } from 'react';
// import { useNotification } from '@/context/NotificationContext'; // Voor feedback - Unused

// Placeholder voor useSubscription hook data (zelfde als in SubscriptionManagement)
interface MockSubscription {
  id: string;
  planId: SubscriptionTier; // Gebruik SubscriptionTier
  planName: string;
  status: 'active' | 'cancelled' | 'past_due' | 'incomplete';
  billingCycle: 'monthly' | 'yearly';
  amount: number;
  renewalDate: string | null;
  patientCount?: number; 
}

// Placeholder voor useSubscription hook (zelfde als in SubscriptionManagement)
// In een echte app zou dit een echte hook zijn die data van de backend haalt.
const useSubscription = (userId: string | undefined) => {
  const [subscription, setSubscription] = useState<MockSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start als loading
  // const [error, setError] = useState<Error | null>(null); // Error state was unused in this hook

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      setSubscription(null);
      return;
    }
    setIsLoading(true);
    // Simuleer API call
    setTimeout(() => {
      // Voorbeeld: actieve gebruiker met een 'basic' plan
      // Pas dit aan om verschillende scenario's te testen
      const userType = localStorage.getItem('debugUserType') || 'patient'; // Debug flag
      const currentPlanId = localStorage.getItem('debugPlanId') as SubscriptionTier || (userType === 'patient' ? 'free' : 'basic');
      
      const plans = userType === 'patient' ? patientPlans : specialistPlans;
      const currentPlan = plans.find(p => p.id === currentPlanId);

      if (currentPlan && currentPlanId !== 'free') {
        setSubscription({
          id: `sub_mock_${userId}`,
          planId: currentPlanId,
          planName: currentPlan.name,
          status: 'active',
          billingCycle: 'monthly',
          amount: currentPlan.price.monthly,
          renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          patientCount: userType === 'specialist' ? 5 : undefined, // Voorbeeld
        });
      } else {
         setSubscription(null); // Geen actief betaald plan, of free plan
      }
      setIsLoading(false);
    }, 500);
  }, [userId]);

  return { subscription, isLoading }; // Error was unused
};


/**
 * Hook voor het controleren van toegang tot premium functies
 * gebaseerd op het abonnement van de gebruiker
 */
export function useFeatureAccess() {
  const { user, profile } = useAuth(); // useAuth zou profile moeten bevatten
  const { subscription, isLoading: isLoadingSubscription } = useSubscription(user?.id);
  
  const hasAccess = useCallback((featureId: string): boolean => {
    if (!user || !profile) return false; // Geen gebruiker, geen toegang
    
    const feature = subscriptionFeatures.find(f => f.id === featureId);
    if (!feature) {
      console.warn(`Feature met ID '${featureId}' niet gevonden in subscriptionFeatures.`);
      return false; // Feature niet gedefinieerd, dus geen toegang
    }
    
    const currentTier = subscription?.status === 'active' ? subscription.planId : 'free';
    
    return feature.tiers.includes(currentTier);
  }, [user, profile, subscription]);
  
  const accessibleFeatures = useCallback((): SubscriptionFeature[] => {
    if (!user || !profile) return [];
    
    const currentTier = subscription?.status === 'active' ? subscription.planId : 'free';
    
    return subscriptionFeatures.filter(feature => {
      const isFeatureInTier = feature.tiers.includes(currentTier);
      // Filter ook op basis van userType als de feature specifiek is
      // (Dit is al deels ingebakken in hoe features zijn gedefinieerd, maar kan explicieter)
      // Voorbeeld: als een feature alleen voor 'specialist' is en user is 'patient', dan geen toegang.
      // De huidige `subscriptionFeatures` structuur koppelt features niet direct aan userType,
      // maar de plannen wel. De `tiers` in `SubscriptionFeature` zijn generiek.
      return isFeatureInTier;
    });
  }, [user, profile, subscription]);
  
  const isAtPatientLimit = useCallback((): boolean => {
    if (!profile || profile.type !== 'specialist') return false;
    
    const currentTier = subscription?.status === 'active' ? subscription.planId : 'free';
    const patientCount = subscription?.patientCount || 0; // Haal dit uit de subscription data

    // Specialisten op 'free' tier hebben geen patiëntbeheer (volgens huidige plan structuur)
    if (currentTier === 'free' && profile.type === 'specialist') return true; // Of een limiet van 0

    const currentPlan = specialistPlans.find(p => p.id === currentTier);
    if (!currentPlan) return true; // Geen geldig plan

    if (currentPlan.features.includes('limited-patients')) { // ID van feature 'Tot 10 Patiënten'
      return patientCount >= 10;
    }
    if (currentPlan.features.includes('expanded-patients')) { // ID van feature 'Tot 50 Patiënten'
      return patientCount >= 50;
    }
    if (currentPlan.features.includes('unlimited-patients')) {
      return false; // Onbeperkt
    }
    
    return true; // Default naar limiet bereikt als plan onbekend is of geen patiëntlimiet feature heeft
  }, [profile, subscription]);
  
  return {
    hasAccess,
    accessibleFeatures,
    isAtPatientLimit,
    subscription,
    isLoadingSubscription,
    userType: profile?.type,
  };
}
