import Link from 'next/link';
import { buildMetadata } from '@/lib/site';
import { PageHero } from '@/components/page-hero';
import { Section, Card } from '@/components/ui';
import { business, communityEngagement, requirements } from '@/lib/content';
import { NO_MEDICAL_NOTICE } from '@/lib/inquiry-fields';
import { GuideLinksSection } from '@/components/guide-links';

export const metadata = buildMetadata({
  title: 'Resources: Getting Started | Beyon Vital, Chesterfield VA',
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
                <li>• <Link href="/dd-waiver-group-home-richmond-va" className={linkClass}>ID/DD Waiver Group Home</Link></li>
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
      <GuideLinksSection path="/resources" />
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
      <Section title="Other providers we know" description="If our home is not the right fit, your family is looking in another state, or someone needs help with alcohol or drug use, these providers may be worth a call.">
        <div className="grid gap-4 md:grid-cols-3">
          <Card interactive={false} className="h-full">
            <h3 className="font-semibold text-brand-ink">At Home Family Services</h3>
            <p className="mt-3 text-sm leading-7 text-brand-muted">
              An adult group home in North Chesterfield, Virginia, offering supportive living for adults 18 and over with intellectual and developmental disabilities. It serves families across Chesterfield County, Richmond, Midlothian, and Colonial Heights.
            </p>
            <a href="https://athomefamilyservices.com/services/supportive-living-id-dd" className={`mt-3 inline-flex text-sm ${linkClass}`}>Supportive living for adults with disabilities at At Home Family Services, North Chesterfield</a>
          </Card>
          <Card interactive={false} className="h-full">
            <h3 className="font-semibold text-brand-ink">Unity Care</h3>
            <p className="mt-3 text-sm leading-7 text-brand-muted">
              Supported living, community participation, and employment supports for people with intellectual and developmental disabilities in Knoxville, Tennessee. Tennessee&rsquo;s provider directory lists it as serving Anderson, Blount, Knox, Loudon, and Sevier counties.
            </p>
            <a href="https://unitycaretn.com/services" className={`mt-3 inline-flex text-sm ${linkClass}`}>Unity Care&rsquo;s I/DD services in Knoxville, Tennessee</a>
          </Card>
          <Card interactive={false} className="h-full">
            <h3 className="font-semibold text-brand-ink">Lighthouse Rehabilitation Center</h3>
            <p className="mt-3 text-sm leading-7 text-brand-muted">
              A drug and alcohol rehab in Midlothian, Virginia, with a partial hospitalization program for adults. Its guide for families covers looking after yourself, learning the options, and staying in patient contact.
            </p>
            <a href="https://www.lighthouserhc.com/faq/how-to-help-a-family-member-with-addiction" className={`mt-3 inline-flex text-sm ${linkClass}`}>How to help a family member with addiction, from Lighthouse in Midlothian, VA</a>
          </Card>
        </div>
      </Section>
    </>
  );
}
