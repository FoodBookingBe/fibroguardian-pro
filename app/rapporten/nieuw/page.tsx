import DashboardLayout from '@/components/layout/DashboardLayout';
import RapportGeneratorContainer from '@/containers/rapporten/RapportGeneratorContainer';

export default function NieuwRapportPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl md:text-3xl font-bold text-purple-800 mb-6">Nieuw Rapport Genereren</h1>
        <RapportGeneratorContainer />
      </div>
    </DashboardLayout>
  );
}