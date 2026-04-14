import { requireAdmin } from '@/lib/requireAdmin';

export default async function TeamLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <>{children}</>;
}
