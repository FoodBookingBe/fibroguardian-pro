'use client';

import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
// import { Button } from '@/components/ds/atoms/Button'; // Placeholder
// import { Card } from '@/components/ds/atoms/Card'; // Placeholder
import { useFeatureAccess } from '@/hooks/useFeatureAccess'; // Correct pad
import { patientPlans, specialistPlans, subscriptionFeatures } from '@/types/subscription'; // SubscriptionPlan was unused
import { ArrowRight, X } from 'lucide-react'; // Gebruik lucide-react voor iconen

interface UpgradePromptProps {
  featureId: string;
  title?: string;
  description?: string;
  className?: string;
  variant?: 'inline' | 'banner' | 'modal';
  onClose?: () => void; // Callback als de prompt wordt gesloten (bv. bij modal)
  showDismissButton?: boolean; // Of een 'Later' / 'Sluiten' knop getoond moet worden
}

export function UpgradePrompt({
  featureId,
  title,
  description,
  className = '',
  variant = 'inline',
  onClose,
  showDismissButton = true,
}: UpgradePromptProps) {
  const { hasAccess, userType, isLoadingSubscription } = useFeatureAccess();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true); // Beheer zichtbaarheid lokaal

  // Als gebruiker al toegang heeft, of subscription nog laadt, of prompt is gesloten, toon niets
  if (isLoadingSubscription || hasAccess(featureId) || !isVisible) {
    return <></>; // Empty fragment instead of null
  }

  const feature = subscriptionFeatures.find(f => f.id === featureId);
  if (!feature) {
    console.warn(`UpgradePrompt: Feature met ID '${featureId}' niet gevonden.`);
    return <></>; // Empty fragment instead of null // Feature niet gedefinieerd, toon geen prompt
  }

  const plans = userType === 'specialist' ? specialistPlans : patientPlans;
  // Vind het laagste betaalde plan dat deze feature bevat
  const lowestPlanWithFeature = plans.find(
    plan => plan.id !== 'free' && feature.tiers.includes(plan.id)
  );

  const defaultTitle = `Upgrade voor ${feature.name}`;
  const defaultDescription = `Deze premium functie is beschikbaar in het ${lowestPlanWithFeature?.name || 'betaalde'} abonnement en hoger. Ontgrendel meer waarde!`;

  const handleUpgradeClick = () => {
    router.push('/pricing'); // Stuur naar prijzenpagina
  };

  const handleDismiss = () => {
    setIsVisible(false);
    if (onClose) {
      onClose();
    }
  };

  // Basis Button component als ds/atoms/Button niet bestaat
  const Button = ({
    onClick,
    children,
    variant = 'primary',
    className: btnClassName = '',
    icon,
    iconPosition = 'left',
    ...props
  }: {
    onClick?: () => void;
    children: React.ReactNode;
    variant?: 'primary' | 'secondary';
    className?: string;
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
    [key: string]: any;
  }) => (
    <button
      onClick={onClick}
      className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${btnClassName} ${variant === 'primary' ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
      {...props}
    >
      {icon && iconPosition === 'left' && <span className="mr-2">{icon}</span>}
      {children}
      {icon && iconPosition === 'right' && <span className="ml-2">{icon}</span>}
    </button>
  );
  // Basis Card component
  const Card = ({
    children,
    className: cardClassName = '',
    ...props
  }: {
    children: React.ReactNode;
    className?: string;
    [key: string]: any;
  }) => (
    <div className={`bg-white rounded-lg shadow-md ${cardClassName}`} {...props}>
      {children}
    </div>
  );


  if (variant === 'modal') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[999]"> {/* Hogere z-index */}
        <Card className={`max-w-md w-full p-6 relative ${className}`}>
          {showDismissButton && (
            <button onClick={handleDismiss} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
              <X size={20} />
              <span className="sr-only">Sluiten</span>
            </button>
          )}
          <h3 className="text-xl font-semibold mb-3 text-gray-800">
            {title || defaultTitle}
          </h3>
          <p className="text-gray-600 mb-6 text-sm">
            {description || defaultDescription}
          </p>

          <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3">
            {showDismissButton && (
              <Button variant="secondary" onClick={handleDismiss} className="w-full sm:w-auto border border-gray-300">
                Later
              </Button>
            )}
            <Button onClick={handleUpgradeClick} className="w-full sm:w-auto">
              Bekijk Abonnementen
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div className={`bg-gradient-to-r from-purple-600 to-indigo-700 text-white p-4 rounded-lg shadow-lg ${className}`}>
        <div className="flex flex-col sm:flex-row items-center justify-between">
          <div className="mb-4 sm:mb-0 sm:mr-4 flex-grow">
            <h3 className="font-semibold text-lg">
              {title || defaultTitle}
            </h3>
            <p className="text-purple-100 text-sm mt-1">
              {description || defaultDescription}
            </p>
          </div>
          <div className="flex-shrink-0 flex space-x-3">
            {showDismissButton && (
              <Button
                variant="secondary"
                className="text-white border border-purple-300 hover:bg-white hover:bg-opacity-10"
                onClick={handleDismiss}
              >
                Later
              </Button>
            )}
            <Button
              className="bg-white text-purple-700 hover:bg-purple-50 shadow"
              onClick={handleUpgradeClick}
            >
              Upgraden <ArrowRight className="w-4 h-4 ml-2 inline" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Default: inline variant
  return (
    <Card className={`p-4 border border-purple-200 bg-purple-50 ${className}`}>
      <h3 className="font-medium text-purple-800 text-md">
        {title || defaultTitle}
      </h3>
      <p className="text-purple-700 text-sm mt-1 mb-3">
        {description || defaultDescription}
      </p>
      <Button
        size="sm"
        onClick={handleUpgradeClick}
        className="bg-purple-600 text-white hover:bg-purple-700"
      >
        Upgraden naar {lowestPlanWithFeature?.name || 'Premium'} <ArrowRight className="w-4 h-4 ml-1.5 inline" />
      </Button>
    </Card>
  );
}
