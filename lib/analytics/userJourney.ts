// import React, { useEffect, useState, ComponentType, FC } from 'react'; // Import React en types - All unused
import { trackEvent } from './eventTracking'; // Gebruik de bestaande analytics instance, analytics was unused

// Types voor verschillende journey stappen
export type OnboardingStepName = // Hernoemd voor duidelijkheid
  | 'signup_started'
  | 'account_created' // Na succesvolle Supabase user creatie
  | 'profile_details_submitted' // Na invullen basis profielinfo
  | 'first_task_created'
  | 'first_symptom_logged'
  | 'specialist_invited' // Door patiënt
  | 'patient_invite_accepted' // Door specialist
  | 'onboarding_completed'; // Expliciete stap of na X dagen/acties

export type SubscriptionJourneyStepName = // Hernoemd voor duidelijkheid
  | 'pricing_page_viewed'
  | 'plan_selected_for_checkout' // Klik op "Kies dit plan"
  | 'checkout_session_initiated' // Na succesvolle API call naar /api/create-checkout-session
  | 'checkout_payment_successful' // Via Stripe webhook
  | 'checkout_payment_failed' // Via Stripe webhook of error bij redirect
  | 'first_premium_feature_used' // Na succesvolle upgrade, eerste gebruik van een betaalde feature
  | 'subscription_renewal_success' // Via Stripe webhook
  | 'subscription_cancellation_requested' // Gebruiker klikt op annuleren
  | 'subscription_cancelled_at_period_end'; // Via Stripe webhook

/**
 * Track onboarding voortgang
 */
export function trackOnboardingStep(step: OnboardingStepName, extraProperties: Record<string, any> = {}) {
  trackEvent('onboarding_step', {
    step_name: step, // Gebruik step_name voor consistentie met andere analytics events
    ...extraProperties
  });

  if (typeof window !== 'undefined' && localStorage) {
    try {
      const onboardingProgress = JSON.parse(localStorage.getItem('fibro_onboarding_progress') || '{}');
      onboardingProgress[step] = new Date().toISOString();
      localStorage.setItem('fibro_onboarding_progress', JSON.stringify(onboardingProgress));
    } catch (e) {
      console.error("Error updating onboarding progress in localStorage", e);
    }
  }
}

/**
 * Krijg de huidige onboarding stap van de gebruiker (meest recent voltooide)
 */
export function getLatestCompletedOnboardingStep(): OnboardingStepName | null {
  if (typeof window === 'undefined' || !localStorage) return null;

  try {
    const onboardingProgress = JSON.parse(localStorage.getItem('fibro_onboarding_progress') || '{}');
    const completedSteps = Object.keys(onboardingProgress) as OnboardingStepName[];

    // Bepaal de "hoogste" voltooide stap gebaseerd op een logische volgorde
    const order: OnboardingStepName[] = [
      'signup_started', 'account_created', 'profile_details_submitted',
      'first_task_created', 'first_symptom_logged', 'specialist_invited',
      'patient_invite_accepted', 'onboarding_completed'
    ];

    for (let i = order.length - 1; i >= 0; i--) {
      if (completedSteps.includes(order[i])) {
        return order[i];
      }
    }
  } catch (e) {
    console.error("Error reading onboarding progress from localStorage", e);
  }
  return null;
}

/**
 * Track abonnement journey
 */
export function trackSubscriptionJourneyStep(step: SubscriptionJourneyStepName, extraProperties: Record<string, any> = {}) {
  trackEvent('subscription_journey_step', {
    step_name: step,
    ...extraProperties
  });
}

/**
 * Track feature gebruik
 */
export function trackFeatureUsage(
  featureId: string,
  action: 'view' | 'interaction' | 'completion', // Duidelijkere acties
  properties: Record<string, any> = {}
) {
  trackEvent('feature_usage', {
    feature_id: featureId, // Gebruik snake_case
    action,
    ...properties
  });

  if (typeof window !== 'undefined' && localStorage) {
    try {
      const featureUsageKey = `fibro_feature_usage_${featureId}`;
      const usageDataStr = localStorage.getItem(featureUsageKey);
      const usageData = usageDataStr ? JSON.parse(usageDataStr) : { firstUsed: null, useCount: 0, lastUsed: null };

      if (!usageData.firstUsed) {
        usageData.firstUsed = new Date().toISOString();
        trackEvent('feature_first_use', { feature_id: featureId });
      }
      usageData.useCount = (usageData.useCount || 0) + 1;
      usageData.lastUsed = new Date().toISOString();

      localStorage.setItem(featureUsageKey, JSON.stringify(usageData));
    } catch (e) {
      console.error(`Error updating feature usage for ${featureId} in localStorage`, e);
    }
  }
}

/**
 * HOC voor het tracken van component/feature views.
 * TIJDELIJK UITGECOMMENTARIEERD WEGENS PERSISTENTE TYPE ERRORS - TEAM MOET DIT DEBUGGEN
 */
// export function withFeatureViewTracking<P extends object>(
//   WrappedComponent: ComponentType<P>,
//   featureId: string,
//   featureName: string
// ): ComponentType<P> {
//   const TrackingComponent = (props: P): JSX.Element => {
//     useEffect(() => {
//       trackEvent('feature_view', { featureId, featureName });
//     }, [featureId, featureName]);

//     return <WrappedComponent {...props} />;
//   };

//   TrackingComponent.displayName = `withFeatureViewTracking(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

//   return TrackingComponent;
// }
