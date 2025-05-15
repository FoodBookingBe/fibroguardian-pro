import DashboardLayout from '@/components/layout/DashboardLayout';
import TaskForm from '@/components/tasks/TaskForm';

export default function NieuweOpdrachtPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl md:text-3xl font-bold text-purple-800 mb-6">Nieuwe Opdracht Toevoegen</h1>
        <TaskForm initialType="opdracht" />
      </div>
    </DashboardLayout>
  );
}