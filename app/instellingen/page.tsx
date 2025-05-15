import DashboardLayout from '@/components/layout/DashboardLayout';
import ProfileForm from '@/components/settings/ProfileForm';

export default function InstellingenPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl md:text-3xl font-bold text-purple-800 mb-6">Instellingen</h1>
        <ProfileForm />
      </div>
    </DashboardLayout>
  );
}