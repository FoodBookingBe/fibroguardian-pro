import dynamic from 'next/dynamic';
import DashboardLayout from '@/components/layout/DashboardLayout'; // Assuming a layout

// Dynamisch importeren om het bundel gewicht niet te verhogen
// voor productiepagina's, en alleen client-side te renderen.
const PerformanceDashboard = dynamic(
  () => import('@/components/dev/PerformanceDashboard'),
  { 
    ssr: false,
    loading: () => <div className="p-8 text-center">Performance Dashboard laden...</div> 
  }
);

export default function PerformanceMonitoringPage() { // Renamed for clarity
  // Voeg hier eventueel authenticatie of autorisatie toe als dit een beschermde pagina moet zijn
  // Voor nu, openbaar toegankelijk onder /dev/performance

  return (
    <DashboardLayout> {/* Of een andere geschikte layout */}
      <div className="container mx-auto px-4 py-8">
        <PerformanceDashboard />
      </div>
    </DashboardLayout>
  );
}
