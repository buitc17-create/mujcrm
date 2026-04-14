import { requireAdmin } from '@/lib/requireAdmin';

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <>{children}</>;
}
