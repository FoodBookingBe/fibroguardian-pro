import React from 'react';

import DashboardLayout from '@/components/layout/DashboardLayout';

export default function MijnSpecialistenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
