import { buildMetadata } from '@/lib/site';
import { PageHero } from '@/components/page-hero';
import { Section, Card } from '@/components/ui';
import { AnnouncementList } from '@/components/announcement-list';
import { getAnnouncements } from '@/lib/announcements';

export const metadata = buildMetadata({
  title: 'Announcements | Beyon Vital Group Home, North Chesterfield',
  path: '/announcements',
  description: 'News and public notices from Beyon Vital, LLC, a residential group home with Community Engagement (9am–3pm) in North Chesterfield, VA, serving the Richmond area.'
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
