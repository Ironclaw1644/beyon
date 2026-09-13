import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/admin';
import { dbGet } from '@/lib/storage';
import { AdminDashboard } from '@/components/admin-dashboard';
import { buildMetadata } from '@/lib/site';

export const metadata = { ...buildMetadata({ title: 'Admin Dashboard | Beyon Vital, LLC', path: '/admin', description: 'Manage leads, announcements, subscribers, and activity reports.' }), robots: { index: false, follow: false } };

export default async function AdminPage() {
  const session = await requireAdmin();

  try {
    const [announcements, subscribers] = await Promise.all([
      dbGet('announcements'),
      dbGet('subscribers')
    ]);

    return <AdminDashboard adminEmail={session.email} initial={{ announcements, subscribers }} />;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load admin CMS data';
    if (message.toLowerCase().includes('unauthorized')) {
      redirect('/admin/login?error=unauthorized');
    }

    return (
      <AdminDashboard
        adminEmail={session.email}
        initial={{ announcements: [], subscribers: [] }}
        initialLoadError={message}
      />
    );
  }
}
