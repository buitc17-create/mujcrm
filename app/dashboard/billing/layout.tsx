import { requireAdmin } from '@/lib/requireAdmin';

export default async function BillingLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <>{children}</>;
}
