import React from 'react';

import DashboardLayout from '@/components/layout/DashboardLayout';

export default function OverzichtLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
