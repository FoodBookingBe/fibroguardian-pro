import DashboardLayout from '@/components/layout/DashboardLayout';
import ReflectieForm from '@/components/reflecties/ReflectieForm';

export default function NieuweReflectiePage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl md:text-3xl font-bold text-purple-800 mb-6">Nieuwe Reflectie Toevoegen</h1>
        <ReflectieForm />
      </div>
    </DashboardLayout>
  );
}