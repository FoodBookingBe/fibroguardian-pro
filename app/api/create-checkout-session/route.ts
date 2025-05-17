import { NextResponse, NextRequest } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseRouteHandlerClient } from '@/lib/supabase'; // Gebruik de route handler client
import { patientPlans, specialistPlans, SubscriptionPlan } from '@/types/subscription'; // Importeer types, SubscriptionTier was unused

// Instantieer Stripe met de secret key
// Zorg dat STRIPE_SECRET_KEY is ingesteld in je environment variabelen
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16', // Gebruik een recente, stabiele API versie
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planId, userId, billingCycle, userEmail, userType } = body;

    // Valideer input
    if (!planId || !userId || !billingCycle || !userType) {
      return NextResponse.json(
        { error: 'Ontbrekende vereiste velden: planId, userId, userType en billingCycle zijn verplicht.' },
        { status: 400 }
      );
    }

    // Verkrijg gebruikersprofiel (als e-mail niet is meegegeven voor nieuwe klant)
    const supabase = getSupabaseRouteHandlerClient(); // Gebruik cookies van de request
    let emailToUse = userEmail;
    let userName = 'Nieuwe Gebruiker';

    if (!emailToUse) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email, voornaam, achternaam') // Selecteer email als die niet is meegegeven
        .eq('id', userId)
        .single();
      
      if (profileError || !profile) {
        console.error(`User profile not found for ID: ${userId}`, profileError);
        return NextResponse.json(
          { error: 'Gebruikersprofiel niet gevonden.' },
          { status: 404 }
        );
      }
      emailToUse = profile.email;
      userName = `${profile.voornaam || ''} ${profile.achternaam || ''}`.trim() || 'Nieuwe Gebruiker';
    }
    
    // Bepaal het juiste plan op basis van userType
    const plans: SubscriptionPlan[] = userType === 'specialist' ? specialistPlans : patientPlans;
    const plan = plans.find(p => p.id === planId);
    
    if (!plan) {
      return NextResponse.json(
        { error: 'Ongeldig abonnementsplan geselecteerd.' },
        { status: 400 }
      );
    }
    if (plan.price.monthly === 0 && plan.price.yearly === 0 && plan.id === 'free') {
        return NextResponse.json(
            { error: 'Gratis plannen vereisen geen checkout.'},
            { status: 400}
        );
    }

    // Haal of maak Stripe Customer
    let customerId: string;
    
    const { data: subscriptionRecord, error: fetchSubError } = await supabase
      .from('subscriptions') // Hernoemd naar 'subscriptions' ipv 'abonnementen' voor consistentie
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (fetchSubError && fetchSubError.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error fetching subscription record:', fetchSubError);
        throw fetchSubError;
    }

    if (subscriptionRecord?.stripe_customer_id) {
      customerId = subscriptionRecord.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: emailToUse,
        name: userName,
        metadata: { userId, userType },
      });
      customerId = customer.id;
      
      // Sla de nieuwe klant-ID op in je database (bv. in 'subscriptions' tabel)
      // Dit gebeurt idealiter via een webhook na succesvolle betaling,
      // maar voor nu direct om de customer ID te koppelen.
      // Of, als de 'subscriptions' tabel al bestaat, update die.
      // Voorbeeld:
      // await supabase.from('user_profiles_or_subscriptions_table').upsert({ user_id: userId, stripe_customer_id: customerId });
    }
    
    // Bepaal prijs-ID op basis van plan en factureringsperiode
    // De Price IDs moeten exact overeenkomen met die in je Stripe Dashboard
    // Voorbeeld: STRIPE_PRICE_PATIENT_BASIC_MONTHLY, STRIPE_PRICE_SPECIALIST_PREMIUM_YEARLY
    const priceIdEnvVar = `STRIPE_PRICE_${userType.toUpperCase()}_${plan.id.toUpperCase()}_${billingCycle.toUpperCase()}`;
    const priceId = process.env[priceIdEnvVar];
    
    if (!priceId) {
      console.error(`Stripe Price ID not found for env var: ${priceIdEnvVar}`);
      return NextResponse.json(
        { error: 'Prijsconfiguratie ontbreekt voor dit plan en factureringscyclus.' },
        { status: 500 }
      );
    }
    
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Maak Checkout sessie
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card', 'ideal'], // Voeg iDEAL toe
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      allow_promotion_codes: true, // Sta promotiecodes toe
      success_url: `${appUrl}/dashboard?subscription_success=true&session_id={CHECKOUT_SESSION_ID}&plan=${plan.id}`,
      cancel_url: `${appUrl}/pricing?subscription_cancelled=true`,
      metadata: { // Extra metadata voor de webhook
        userId,
        planId: plan.id,
        userType,
        billingCycle,
      },
      // subscription_data: { // Gebruik metadata in de session voor webhook afhandeling
      //   metadata: {
      //     userId,
      //     planId: plan.id,
      //   },
      // },
    });
    
    return NextResponse.json({ sessionId: session.id });

  } catch (error: any) {
    console.error('Stripe checkout session creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Interne serverfout bij het aanmaken van de checkout sessie.' },
      { status: 500 }
    );
  }
}
