import Link from 'next/link';
import { buildMetadata } from '@/lib/site';
import { PageHero } from '@/components/page-hero';
import { Section, Card } from '@/components/ui';
import { business, communityEngagement, requirements } from '@/lib/content';
import { NO_MEDICAL_NOTICE } from '@/lib/inquiry-fields';

export const metadata = buildMetadata({
  title: 'Resources: Getting Started | Beyon Vital, LLC',
  path: '/resources',
  description: 'How to get started with Beyon Vital, LLC: check the group home requirements, choose a service, and reach out without sharing medical details online.'
});

const linkClass = 'font-semibold text-brand-primary hover:text-brand-primary-dark';

export default function ResourcesPage() {
  return (
    <>
      <PageHero
        title="Getting started"
        description="A short guide to reaching out to Beyon Vital, LLC."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Resources', href: '/resources' }]}
      />
      <Section title="Before you reach out">
        <ol className="grid gap-4 lg:grid-cols-3">
          <li>
            <Card className="h-full">
              <h3 className="font-semibold text-brand-ink">1. Check the requirements</h3>
              <ul className="mt-3 space-y-2 text-sm text-brand-muted">
                {requirements.map((item) => <li key={item.label}>• {item.text}</li>)}
              </ul>
              <Link href="/requirements" className={`mt-3 inline-flex text-sm ${linkClass}`}>Review requirements</Link>
            </Card>
          </li>
          <li>
            <Card className="h-full">
              <h3 className="font-semibold text-brand-ink">2. Choose a service</h3>
              <ul className="mt-3 space-y-2 text-sm text-brand-muted">
                <li>• <Link href="/services/residential-group-home" className={linkClass}>Residential Group Home</Link></li>
                <li>• <Link href="/services/community-engagement" className={linkClass}>Community Engagement</Link> ({communityEngagement.hours})</li>
              </ul>
            </Card>
          </li>
          <li>
            <Card className="h-full">
              <h3 className="font-semibold text-brand-ink">3. Keep medical details offline</h3>
              <p className="mt-3 text-sm leading-7 text-brand-muted">{NO_MEDICAL_NOTICE}</p>
            </Card>
          </li>
        </ol>
      </Section>
      <Section title="Ways to reach us">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <h3 className="font-semibold text-brand-ink">Phone</h3>
            <a href={business.phoneHref} data-track-cta="call" className={`mt-2 inline-flex text-sm ${linkClass}`}>{business.phone}</a>
          </Card>
          <Card>
            <h3 className="font-semibold text-brand-ink">Email</h3>
            <a href={`mailto:${business.email}`} className={`mt-2 inline-flex break-all text-sm ${linkClass}`}>{business.email}</a>
          </Card>
          <Card>
            <h3 className="font-semibold text-brand-ink">Address</h3>
            <p className="mt-2 text-sm text-brand-muted">{business.address}</p>
          </Card>
          <Card>
            <h3 className="font-semibold text-brand-ink">Online forms</h3>
            <ul className="mt-2 space-y-1 text-sm">
              <li><Link href="/placement-inquiry" className={linkClass}>Inquiry</Link></li>
              <li><Link href="/services/community-engagement/inquiry" className={linkClass}>Community Engagement inquiry</Link></li>
              <li><Link href="/tour" className={linkClass}>Tour request</Link></li>
              <li><Link href="/contact" className={linkClass}>Contact form</Link></li>
            </ul>
          </Card>
        </div>
      </Section>
    </>
  );
}
