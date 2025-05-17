import DashboardLayout from '@/components/layout/DashboardLayout';
import ProfileFormContainer from '@/containers/settings/ProfileFormContainer';

export default function InstellingenPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl md:text-3xl font-bold text-purple-800 mb-6">Instellingen</h1>
        <ProfileFormContainer />
      </div>
    </DashboardLayout>
  );
}