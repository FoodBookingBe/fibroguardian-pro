import { Metadata } from 'next';
// import { Container } from '@/components/ds/layout/Container'; // Placeholder
// import { PricingTables } from '@/components/subscription/PricingTables'; // Placeholder
// import { FeatureComparison } from '@/components/subscription/FeatureComparison'; // Placeholder
// import { Testimonials } from '@/components/marketing/Testimonials'; // Placeholder
// import { FAQ } from '@/components/marketing/FAQ'; // Placeholder
import DashboardLayout from '@/components/layout/DashboardLayout'; // Gebruik bestaande layout

export const metadata: Metadata = {
  title: 'Abonnementen - FibroGuardian Pro',
  description: 'Kies het abonnement dat bij u past. Beheer uw fibromyalgie effectiever met onze flexibele abonnementenopties.',
};

// Placeholder componenten voor nu
const Container = ({ children, className = '', size = 'xl' }: { children: React.ReactNode, className?: string, size?: string }) => (
  <div className={`max-w-screen-${size} mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
    {children}
  </div>
);

const PricingTables = () => (
  <div className="bg-gray-100 p-8 rounded-lg text-center">
    <h2 className="text-2xl font-semibold mb-4">Prijstabellen komen hier</h2>
    <p>Dit component zal de verschillende abonnementsplannen tonen.</p>
    <p className="mt-2 text-sm text-gray-600">(components/subscription/PricingTables.tsx)</p>
  </div>
);

const FeatureComparison = ({ className = '' }: { className?: string }) => (
  <div className={`bg-gray-100 p-8 rounded-lg text-center ${className}`}>
    <h2 className="text-2xl font-semibold mb-4">Feature Vergelijking komt hier</h2>
    <p>Dit component zal een gedetailleerde vergelijking van features per plan tonen.</p>
    <p className="mt-2 text-sm text-gray-600">(components/subscription/FeatureComparison.tsx)</p>
  </div>
);

const Testimonials = ({ className = '' }: { className?: string }) => (
  <div className={`bg-gray-100 p-8 rounded-lg text-center ${className}`}>
    <h2 className="text-2xl font-semibold mb-4">Testimonials komen hier</h2>
    <p>Dit component zal gebruikerservaringen tonen.</p>
    <p className="mt-2 text-sm text-gray-600">(components/marketing/Testimonials.tsx)</p>
  </div>
);

const FAQ = ({ className = '' }: { className?: string }) => (
  <div className={`bg-gray-100 p-8 rounded-lg text-center ${className}`}>
    <h2 className="text-2xl font-semibold mb-4">Veelgestelde Vragen (FAQ) komen hier</h2>
    <p>Dit component zal antwoorden op veelgestelde vragen tonen.</p>
    <p className="mt-2 text-sm text-gray-600">(components/marketing/FAQ.tsx)</p>
  </div>
);


export default function PricingPage() {
  return (
    <DashboardLayout> {/* Of een meer generieke 'AppLayout' als die bestaat */}
      <main>
        <Container size="xl" className="py-12 md:py-16 lg:py-20">
          <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 mb-4">
              Abonnementen voor elke behoefte
            </h1>
            <p className="text-lg md:text-xl text-gray-600">
              Of u nu een patiënt bent die uw symptomen wilt bijhouden of een specialist die patiënten beheert, 
              we hebben een plan dat bij u past.
            </p>
          </div>
          
          <PricingTables />
          
          <FeatureComparison className="mt-16 md:mt-24" />
          
          <Testimonials className="mt-16 md:mt-24" />
          
          <FAQ className="mt-16 md:mt-24" />
        </Container>
      </main>
    </DashboardLayout>
  );
}
