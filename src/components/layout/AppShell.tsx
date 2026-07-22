'use client';

import { ToastProvider } from '@/components/ui/Toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </ToastProvider>
  );
}
