import { buildMetadata } from '@/lib/site';
import { PageHero } from '@/components/page-hero';
import { Section, Card } from '@/components/ui';
import { AnnouncementList } from '@/components/announcement-list';
import { getAnnouncements } from '@/lib/announcements';

export const metadata = buildMetadata({
  title: 'Announcements | Beyon Vital, LLC',
  path: '/announcements',
  description: 'Public updates and notices from Beyon Vital, LLC in North Chesterfield, VA.'
});
export const dynamic = 'force-dynamic';

export default async function AnnouncementsPage() {
  const announcements = await getAnnouncements();
  return (
    <>
      <PageHero
        title="Announcements"
        description="Public updates and timely notices."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Announcements', href: '/announcements' }]}
      />
      <Section title="Latest updates">
        {announcements.length ? (
          <AnnouncementList announcements={announcements} />
        ) : (
          <Card interactive={false}>
            <p className="text-sm text-brand-muted">There are no announcements right now.</p>
          </Card>
        )}
      </Section>
    </>
  );
}
