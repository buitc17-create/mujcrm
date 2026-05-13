import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyAdminToken } from '@/lib/adminAuth';
import AdminPanel from '@/app/dashboard/admin/AdminPanel';

export default async function AdminPanelPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  if (!token || !verifyAdminToken(token)) redirect('/admin');
  return <AdminPanel onLogout />;
}
