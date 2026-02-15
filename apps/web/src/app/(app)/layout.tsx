import { Suspense } from 'react';
import { AppShellMinimal } from '@/components/AppShellMinimal';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <AppShellMinimal>{children}</AppShellMinimal>
    </Suspense>
  );
}
