import React from 'react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import TaskFormContainer from '@/containers/tasks/TaskFormContainer';

export default function NieuweTaakPage(): JSX.Element {
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl md:text-3xl font-bold text-purple-800 mb-6">Nieuwe Taak Toevoegen</h1>
        <TaskFormContainer initialType="taak" isEditing={false} />
      </div>
    </DashboardLayout>
  );
}