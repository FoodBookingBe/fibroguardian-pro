
// Fix voor ontbrekende property 'addNotification' op Element type
declare module "react" {
  interface Element {
    addNotification?: unknown;
  }
}
import React from 'react';

'use client';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation'; // useRouter voor navigatie
// import { Button } from '@/components/ds/atoms/Button'; // Placeholder
// import { Card } from '@/components/ds/atoms/Card'; // Placeholder
// import { Grid } from '@/components/ds/layout/Grid'; // Placeholder
// import { Toggle } from '@/components/ds/atoms/Toggle'; // Placeholder
import { _useAuth as useAuth } from '@/components/auth/AuthProvider'; 
import { useFeatureAccess } from '@/hooks/useFeatureAccess'; 
import { patientPlans, specialistPlans, SubscriptionPlan, subscriptionFeatures } from '@/types/subscription';
import { createCheckoutSession } from '@/lib/stripe';
import { Check } from 'lucide-react'; // X is not used
import { useNotification } from '@/context/NotificationContext';

// Basis Button component als ds/atoms/Button niet bestaat
const Button = ({ onClick, children, variant = 'primary', className: btnClassName = '', loading, disabled, fullWidth, size = 'md', ...props} // Type assertion fixed
const typedProps = props as Record<string, unknown> ;: unknown) => (
  <button 
    onClick={onClick} 
    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${fullWidth ? 'w-full' : ''} ${size === 'sm' ? 'text-xs px-3 py-1.5' : ''} ${btnClassName} ${variant === 'primary' ? 'bg-purple-600 text-white hover:bg-purple-700' : variant === 'danger' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
    disabled={loading || disabled}
    {...props} // Type assertion fixed
const typedProps = props as Record<string, unknown>;
  >
    {loading ? (
      <span className="inline-block h-4 w-4 border-2 border-t-transparent border-current rounded-full animate-spin mr-2" />
    ) : null}
    {children}
  </button>
);
// Basis Card component
const Card = ({ children, className: cardClassName = '', ...props} // Type assertion fixed
const typedProps = props as Record<string, unknown> ;: unknown) => (
  <div className={`bg-white rounded-lg shadow-md ${cardClassName}`} {...props} // Type assertion fixed
const typedProps = props as Record<string, unknown>;>
    {children}
  </div>
);
// Basis Toggle component
const Toggle = ({ checked, onChange }: { checked: boolean, onChange: () => void, size?: string }) => ( // size prop was unused
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`${
        checked ? 'bg-purple-600' : 'bg-gray-200'
        } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2`}
    >
        <span className="sr-only">Use setting</span>
        <span
        aria-hidden="true"
        className={`${
            checked ? 'translate-x-5' : 'translate-x-0'
        } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
        />
    </button>
);


export function PricingTables(): JSX.Element {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userTypeParam = searchParams.get('userType');
  // const _upgradeParam = searchParams.get('upgrade'); // Unused variable
  
  const { user, profile, loading: loadingAuth } = useAuth();
  const { subscription, isLoadingSubscription } = useFeatureAccess(); // isLoadingSubscription van hier
  const { addNotification } = useNotification();
  
  const [activeTab, setActiveTab] = useState<'patient' | 'specialist'>('patient');
  const [yearlyBilling, setYearlyBilling] = useState(true);
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);

  useEffect(() => {
    if (!loadingAuth) { // Wacht tot auth geladen is
      const initialUserType = profile?.type === 'specialist' ? 'specialist' : 'patient';
      setActiveTab(userTypeParam === 'patient' || userTypeParam === 'specialist' ? userTypeParam : initialUserType);
    }
  }, [profile, userTypeParam, loadingAuth]);
  
  const plansToDisplay = activeTab === 'patient' ? patientPlans : specialistPlans;
  
  const handlePlanSelect = async (plan: SubscriptionPlan) => {
    if (!user || !profile) {
      addNotification({type: 'info', message: 'Log in of registreer om een abonnement te kiezen.'});
      router.push(`/auth/login?returnTo=/pricing?userType=${activeTab}&plan=${plan.id}`);
      return;
    }
    
    if (plan.id === 'free') {
        addNotification({type: 'info', message: 'U gebruikt al het gratis plan.'});
        return;
    }
    if (plan.ctaText === 'Neem Contact Op') {
        router.push('/contact?subject=Enterprise Plan'); // Voorbeeld
        return;
    }

    try {
      setProcessingPlanId(plan.id);
      await createCheckoutSession(
        plan,
        user.id,
        yearlyBilling ? 'yearly' : 'monthly',
        user.email // Gebruik user.email van useAuth()
      );
    } catch (error: unknown) {
      console.error('Error creating checkout session:', error);
      addNotification({type: 'error', message: (error as any).message || 'Kon checkout sessie niet starten.'});
    } finally {
      setProcessingPlanId(null);
    }
  };
  
  const isPlanDisabled = (plan: SubscriptionPlan) => {
    if (isLoadingSubscription || !subscription || subscription.status !== 'active') return false;
    return subscription.planId === plan.id && subscription.billingCycle === (yearlyBilling ? 'yearly' : 'monthly');
  };
  
  const getPlanCTA = (plan: SubscriptionPlan) => {
    if (isLoadingSubscription) return "Laden...";
    if (!subscription || subscription.status !== 'active') {
      return plan.ctaText;
    }
    if (subscription.planId === plan.id && subscription.billingCycle === (yearlyBilling ? 'yearly' : 'monthly')) {
      return 'Huidig abonnement';
    }
    if (plan.price.monthly === 0 && plan.price.yearly === 0) return "Start Gratis";
    
    // Check if current plan is lower than the selected plan
    const currentPlanIndex = plansToDisplay.findIndex(p => p.id === subscription.planId);
    const selectedPlanIndex = plansToDisplay.findIndex(p => p.id === plan.id);

    if (selectedPlanIndex > currentPlanIndex) return 'Upgraden';
    if (selectedPlanIndex < currentPlanIndex) return 'Downgraden';
    
    return 'Wijzig Facturering'; // If same plan, different billing cycle
  };
  
  if (loadingAuth) {
    return <div className="text-center p-8">Authenticatie laden...</div>;
  }

  return (
    <div className="py-8">
      <div className="flex justify-center mb-8">
        <div className="inline-flex rounded-md shadow-sm p-1 bg-gray-100">
          <button
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'patient'
                ? 'bg-white text-purple-700 shadow'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab('patient')}
            aria-pressed={activeTab === 'patient'}
          >
            Voor Patiënten
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'specialist'
                ? 'bg-white text-purple-700 shadow'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab('specialist')}
            aria-pressed={activeTab === 'specialist'}
          >
            Voor Specialisten
          </button>
        </div>
      </div>
      
      <div className="flex justify-center items-center space-x-3 mb-12">
        <span className={`text-sm font-medium ${!yearlyBilling ? 'text-purple-700' : 'text-gray-500'}`}>
          Maandelijks
        </span>
        <Toggle
          checked={yearlyBilling}
          onChange={() => setYearlyBilling(!yearlyBilling)}
        />
        <span className={`text-sm font-medium ${yearlyBilling ? 'text-purple-700' : 'text-gray-500'}`}>
          Jaarlijks <span className="text-green-600 font-semibold">(Bespaar ~16%)</span>
        </span>
      </div>
      
      <div className={`grid grid-cols-1 md:grid-cols-${Math.min(plansToDisplay.length, 3)} gap-6 lg:gap-8`}>
        {plansToDisplay.map((plan: unknown) => (
          <Card
            key={plan.id}
            className={`p-6 flex flex-col ${
              plan.popular
                ? 'border-2 border-purple-500 shadow-xl relative ring-2 ring-purple-300 ring-offset-2'
                : 'border border-gray-200'
            }`}
          >
            {plan.popular && (
              <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold bg-purple-500 text-white">
                  Meest Gekozen
                </span>
              </div>
            )}
            
            <div className="flex-grow">
              <h3 className="text-2xl font-bold text-gray-800 text-center">{plan.name}</h3>
              <p className="text-gray-500 mt-3 text-sm text-center min-h-[40px]">{plan.description}</p>
              
              <div className="mt-6 mb-8 text-center">
                <span className="text-4xl font-extrabold text-gray-900">
                  €{yearlyBilling ? (plan.price.yearly / 12).toFixed(2) : plan.price.monthly.toFixed(2)}
                </span>
                <span className="text-base font-medium text-gray-500">/maand</span>
                
                {yearlyBilling && plan.id !== 'free' && (
                  <div className="text-xs text-gray-500 mt-1">
                    Totaal €{plan.price.yearly.toFixed(2)} per jaar
                  </div>
                )}
              </div>
              
              <ul className="space-y-3 mb-8">
                {subscriptionFeatures
                  .filter(f => plan.features.includes(f.id) || (plan.id !== 'free' && f.tiers.includes(plan.id))) // Toon alle features van het plan
                  .sort((a,b) => (a.highlight === b.highlight)? 0 : a.highlight? -1 : 1) // Highlighted bovenaan
                  .map((feature: unknown) => (
                  <li key={feature.id} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{feature.name}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <Button
              fullWidth
              variant={plan.popular ? 'primary' : 'outline'}
              onClick={() => handlePlanSelect(plan)}
              loading={processingPlanId === plan.id}
              disabled={isPlanDisabled(plan) || (processingPlanId !== null && processingPlanId !== plan.id)}
              className={isPlanDisabled(plan) ? 'bg-gray-400 text-gray-700 cursor-not-allowed' : plan.popular ? 'bg-purple-600 hover:bg-purple-700' : 'border-purple-600 text-purple-600 hover:bg-purple-50'}
            >
              {getPlanCTA(plan)}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
