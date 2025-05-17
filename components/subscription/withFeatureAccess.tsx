import React, { ComponentType, useState } from 'react'; // Import React
import { useFeatureAccess } from '@/hooks/useFeatureAccess'; // Correct pad
import { UpgradePrompt } from './UpgradePrompt'; // Importeer de UpgradePrompt component

interface WithFeatureAccessOptions { // Hernoemd van WithFeatureAccessProps voor duidelijkheid
  featureId: string;
  // Opties voor de UpgradePrompt component
  upgradePromptVariant?: 'inline' | 'banner' | 'modal';
  upgradePromptTitle?: string;
  upgradePromptDescription?: string;
  // Fallback UI als de gebruiker geen toegang heeft en de prompt niet getoond wordt (bv. na dismiss)
  // of als er geen prompt getoond moet worden maar de content wel verborgen moet zijn.
  fallbackUI?: React.ReactNode; 
  // Bepaalt of de prompt getoond moet worden, of alleen de fallbackUI / niets
  showPromptIfNoAccess?: boolean; 
}

/**
 * Higher-Order Component dat een component wikkelt.
 * Als de gebruiker geen toegang heeft tot de gespecificeerde feature:
 * - Toont een UpgradePrompt (indien showPromptIfNoAccess true is).
 * - Of toont de fallbackUI.
 * - Of rendert niets als geen van beide is opgegeven.
 */
export function withFeatureAccess<P extends object>( // P extends object is een goede constraint
  WrappedComponent: ComponentType<P>,
  options: WithFeatureAccessOptions
): ComponentType<P> { // De geretourneerde component accepteert dezelfde props P
  
  const { 
    featureId, 
    upgradePromptVariant = 'inline', 
    upgradePromptTitle, 
    upgradePromptDescription,
    fallbackUI = null, // Default naar niets renderen als geen fallback is gespecificeerd
    showPromptIfNoAccess = true, // Default naar het tonen van de prompt
  } = options;

  const ComponentWithFeatureAccess = (props: P) => {
    const { hasAccess, isLoadingSubscription } = useFeatureAccess();
    // Lokale state voor de prompt is nu binnen UpgradePrompt zelf, maar we kunnen hier controleren of we het überhaupt willen tonen.
    // const [promptVisible, setPromptVisible] = useState(true); // Om de prompt te kunnen sluiten

    // const handleClosePrompt = () => {
    //   setPromptVisible(false);
    // };

    if (isLoadingSubscription) {
      // Optioneel: toon een loader terwijl abonnementsstatus wordt geladen
      // Dit voorkomt een flits van de UpgradePrompt of de WrappedComponent.
      // Afhankelijk van de UX wensen.
      // Voor nu, render niets of een minimale loader.
      return <div aria-live="polite" aria-busy="true">Checking feature access...</div>; // Of een Skeleton
    }
    
    const canAccessFeature = hasAccess(featureId);
    
    if (canAccessFeature) {
      return <WrappedComponent {...props} />;
    }

    // Gebruiker heeft geen toegang
    if (showPromptIfNoAccess) {
      return (
        <UpgradePrompt
          featureId={featureId}
          variant={upgradePromptVariant}
          title={upgradePromptTitle}
          description={upgradePromptDescription}
          // onClose={handleClosePrompt} // onClose wordt nu intern afgehandeld door UpgradePrompt
          // De UpgradePrompt heeft zijn eigen dismiss logica.
          // Als de HOC de prompt moet verbergen na dismiss, dan moet de state hier beheerd worden.
          // Voor nu, laat UpgradePrompt zijn eigen zichtbaarheid beheren.
        />
      );
    }
    
    return fallbackUI; // Toon fallback UI of null (niets)
  };
  
  // Kopieer displayName van de gewikkelde component voor betere debugging
  ComponentWithFeatureAccess.displayName = `withFeatureAccess(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;
  
  return ComponentWithFeatureAccess;
}

// Voorbeeld gebruik:
// interface MyProtectedComponentProps { myProp: string; }
// const MyProtectedComponent = ({ myProp }: MyProtectedComponentProps) => <div>Protected Content: {myProp}</div>;
//
// const SecuredComponent = withFeatureAccess(MyProtectedComponent, {
//   featureId: 'advanced-analytics',
//   upgradePromptVariant: 'banner',
//   fallbackUI: <p>U heeft geen toegang tot deze geavanceerde analytics.</p>
// });
//
// // In een andere component:
// // <SecuredComponent myProp="voorbeeld" />
