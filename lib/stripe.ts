import { loadStripe, Stripe } from '@stripe/stripe-js';
import { SubscriptionPlan } from '@/types/subscription'; // Correct pad

let stripePromise: Promise<Stripe | null>;

// Laad de Stripe client een keer
export const getStripe = (): Promise<Stripe | null> => {
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    console.error('Stripe publishable key is not set in environment variables.');
    return Promise.resolve(null); // Of gooi een error
  }
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

/**
 * Maakt een Stripe Checkout sessie voor een gegeven abonnement
 * @param plan Het abonnementsplan
 * @param userId De gebruikers-ID
 * @param billingCycle 'monthly' of 'yearly'
 * @param userEmail Optioneel, voor prefill in Stripe checkout
 */
export async function createCheckoutSession(
  plan: SubscriptionPlan,
  userId: string,
  billingCycle: 'monthly' | 'yearly',
  userEmail?: string
): Promise<void> { // Return void, as it redirects
  const stripe = await getStripe();
  
  if (!stripe) {
    throw new Error('Stripe kon niet worden geladen. Controleer de publishable key.');
  }
  
  // Vraag aan de server om een Checkout Sessie te maken
  const response = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      planId: plan.id, // Dit is de tier ID (free, basic, premium, professional)
      userType: plan.userType, // Stuur userType mee voor prijsbepaling
      userId,
      billingCycle,
      userEmail, // Stuur email mee voor Stripe customer creatie
    }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Kon geen checkout sessie aanmaken.');
  }
  
  const { sessionId } = await response.json();
  
  if (!sessionId) {
    throw new Error('Checkout Sessie ID niet ontvangen van server.');
  }
  
  // Redirect naar Stripe Checkout
  const { error } = await stripe.redirectToCheckout({ sessionId });
  
  if (error) {
    // Deze error wordt meestal getoond aan de gebruiker door Stripe zelf,
    // maar loggen kan nuttig zijn.
    console.error('Stripe redirectToCheckout error:', error);
    throw new Error(error.message || 'Fout bij redirect naar Stripe Checkout.');
  }
  // Geen return value nodig, de redirect gebeurt of er wordt een error gegooid.
}
