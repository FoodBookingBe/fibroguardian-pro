import React from 'react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import ReflectieFormContainer from '@/containers/reflecties/ReflectieFormContainer';

export default function NieuweReflectiePage(): JSX.Element {
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl md:text-3xl font-bold text-purple-800 mb-6">Nieuwe Reflectie Toevoegen</h1>
        <ReflectieFormContainer />
        {/* initialDatum prop can be passed here if needed, e.g., from searchParams for a specific date */}
      </div>
    </DashboardLayout>
  );
}