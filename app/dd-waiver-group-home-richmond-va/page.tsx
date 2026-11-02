import Link from 'next/link';
import { PageHero } from '@/components/page-hero';
import { Section, Card, Button } from '@/components/ui';
import { FaqList } from '@/components/faq-list';
import { PhotoGrid } from '@/components/photo-grid';
import { StructuredData } from '@/components/structured-data';
import { business, communityEngagement, homeFeatures, homePhotos, requirements, requirementsIntro, type Faq } from '@/lib/content';
import { GUIDE_SOURCES, guidePath, getGuide } from '@/lib/guides';
import { chesterfieldCsb, chesterfieldDdServices, henricoMhds, richmondRbha } from '@/lib/local-resources';
import { buildMetadata, faqJsonLd } from '@/lib/site';

const WAIVER_PAGE_PATH = '/dd-waiver-group-home-richmond-va';

export const metadata = buildMetadata({
  title: 'DD Waiver Group Home Near Richmond, VA | Beyon Vital',
  path: WAIVER_PAGE_PATH,
  description:
    'Beyon Vital accepts ID/DD Waivers at its residential group home in North Chesterfield, near Richmond, VA. Who the home is for and how to use a waiver.'
});

const faqs: Faq[] = [
  {
    q: 'Does Beyon Vital accept ID/DD Waivers?',
    a: 'Yes. Beyon Vital, LLC accepts ID/DD Waivers at our residential group home in North Chesterfield, near Richmond, VA. Residents must also be at least 18 years of age, have acceptable insurance, and be willing to live with other residents.'
  },
  {
    q: 'Which Virginia DD waiver covers group home living?',
    a: 'Group home residential service is covered in the Community Living (CL) waiver (12VAC30-122-250 and 12VAC30-122-390). The Family and Individual Supports and Building Independence waivers do not list it, though all three cover day options such as Community Engagement.'
  },
  {
    q: 'How do I get a DD waiver in Richmond or Chesterfield?',
    a: 'Apply through your local Community Services Board (CSB). City of Richmond residents contact the Richmond Behavioral Health Authority at (804) 819-4000. Chesterfield County residents call Developmental Disability Services at 804-717-6642. Virginia keeps a waiting list, and slots are assigned by urgency of need.'
  },
  {
    q: 'Can I see the home before deciding?',
    a: 'You can request a tour of the home online. Share a few days and times that work for you, and we will follow up to schedule.'
  }
];

const guideSlugs = [
  'what-does-id-dd-waiver-mean-in-virginia',
  'how-to-apply-for-the-dd-waiver-in-chesterfield-county',
  'group-home-vs-sponsored-residential-in-virginia',
  'group-home-vs-assisted-living-in-virginia'
];

const sources = [GUIDE_SOURCES.dmasDd, GUIDE_SOURCES.r250, GUIDE_SOURCES.r390, GUIDE_SOURCES.r30, GUIDE_SOURCES.dbhdsSsg, GUIDE_SOURCES.vacsb, GUIDE_SOURCES.chesterfieldDd];

export default function DdWaiverGroupHomePage() {
  return (
    <>
      <StructuredData data={faqJsonLd(faqs)} />
      <PageHero
        eyebrow="Accepting ID/DD Waivers"
        title="ID/DD Waiver Group Home Near Richmond, VA"
        description={`Beyon Vital, LLC is a residential group home in North Chesterfield, VA, near Richmond, and we accept ID/DD Waivers. The home is for mature and young adults, with therapeutic, behavioral, and psycho-educational support.`}
        image={homePhotos.livingRoom}
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Services', href: '/services' }, { label: 'ID/DD Waiver Group Home', href: WAIVER_PAGE_PATH }]}
        actions={
          <>
            <Button href="/placement-inquiry" trackCta="placement-inquiry">Inquire About the Home</Button>
            <Button href={business.phoneHref} variant="ghost" trackCta="call">Call {business.phone}</Button>
          </>
        }
      />

      <Section title="Who the home is for" description={requirementsIntro}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {requirements.map((item) => (
            <Card key={item.label}>
              <h3 className="font-semibold text-brand-ink">{item.label}</h3>
              <p className="mt-2 text-sm leading-7 text-brand-muted">{item.text}</p>
            </Card>
          ))}
        </div>
        <p className="mt-6 max-w-3xl text-sm leading-7 text-brand-muted">
          The home is at {business.address}. See the full <Link href="/requirements" className="font-semibold text-brand-primary underline">group home requirements</Link>.
        </p>
      </Section>

      <Section title="The home" description="A safe and comfortable environment in North Chesterfield, VA.">
        <PhotoGrid photos={[homePhotos.exterior, homePhotos.bedroomQueen, homePhotos.kitchenDining]} />
        <ul className="mt-6 flex flex-wrap gap-2" aria-label="Home features">
          {homeFeatures.map((feature) => (
            <li key={feature} className="rounded-full border border-brand-ink/10 bg-white px-3 py-1.5 text-sm font-medium text-brand-ink">{feature}</li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button href="/our-home" variant="ghost" trackCta="view-our-home">View Our Home</Button>
          <Button href="/tour" variant="ghost" trackCta="request-tour">Request a Tour</Button>
        </div>
      </Section>

      <Section
        title="How a DD waiver can pay for a group home in Virginia"
        description="Virginia’s rules, in plain language. Your support coordinator can tell you how they apply to your plan."
      >
        <ul className="max-w-3xl list-disc space-y-3 pl-5 text-base leading-7 text-brand-muted">
          <li>Virginia has three Developmental Disability (DD) waivers: Community Living, Family and Individual Supports, and Building Independence. Virginia Medicaid runs them jointly with DBHDS.</li>
          <li>Group home residential service is a Community Living waiver service. It is skill-building and support that helps a person live successfully in the community, and it is set out in the person’s plan for supports.</li>
          <li>It is paid by the day, at a tier based on the person’s assessed level of support and the home’s licensed bed capacity.</li>
          <li>Medicaid pays for group home residential service only in homes with no more than six licensed beds. Larger homes that became DD waiver providers before March 31, 2021 may keep operating under that rule.</li>
          <li>A person can be enrolled in only one waiver at a time. There is a waiting list, and slots are assigned by urgency of need.</li>
        </ul>
      </Section>

      <Section title="Steps to use your waiver with us">
        <ol className="grid max-w-4xl gap-4 md:grid-cols-2">
          <li>
            <Card className="h-full" interactive={false}>
              <h3 className="font-semibold text-brand-ink">1. Contact your Community Services Board</h3>
              <p className="mt-2 text-sm leading-7 text-brand-muted">DD waiver applications go through the CSB where the person lives:</p>
              <ul className="mt-2 space-y-2 text-sm leading-6 text-brand-muted">
                {[richmondRbha, chesterfieldDdServices, chesterfieldCsb, henricoMhds].map((agency) => (
                  <li key={agency.name}><span className="font-semibold text-brand-ink">{agency.name}:</span> {agency.detail}</li>
                ))}
              </ul>
            </Card>
          </li>
          <li>
            <Card className="h-full" interactive={false}>
              <h3 className="font-semibold text-brand-ink">2. Work with your support coordinator</h3>
              <p className="mt-2 text-sm leading-7 text-brand-muted">
                Once a waiver slot is assigned, your support coordinator can give you a list of local services and providers and help you choose. Ask them about Beyon Vital.
              </p>
            </Card>
          </li>
          <li>
            <Card className="h-full" interactive={false}>
              <h3 className="font-semibold text-brand-ink">3. Talk with us</h3>
              <p className="mt-2 text-sm leading-7 text-brand-muted">
                Call {business.phone} or send an inquiry with your contact details. Please do not include medical details in online forms; we can discuss specifics by phone.
              </p>
            </Card>
          </li>
          <li>
            <Card className="h-full" interactive={false}>
              <h3 className="font-semibold text-brand-ink">4. See the home</h3>
              <p className="mt-2 text-sm leading-7 text-brand-muted">
                <Link href="/tour" className="font-semibold text-brand-primary underline">Request a tour</Link> and we will follow up to schedule.
              </p>
            </Card>
          </li>
        </ol>
      </Section>

      <Section title="Community Engagement, too" description={`${communityEngagement.description} It runs ${communityEngagement.hours}, with community outings, volunteer work, and life coaching.`}>
        <Button href="/services/community-engagement" variant="ghost" trackCta="community-engagement">About Community Engagement</Button>
      </Section>

      <Section title="ID/DD waiver group home questions">
        <FaqList items={faqs} />
      </Section>

      <Section title="Questions families ask">
        <ul className="grid max-w-4xl gap-3 md:grid-cols-2">
          {guideSlugs.map((slug) => (
            <li key={slug}>
              <Link href={guidePath(slug)} className="font-semibold text-brand-primary underline hover:text-brand-primary-dark">{getGuide(slug)?.question}</Link>
            </li>
          ))}
          <li>
            <Link href="/locations/richmond-va" className="font-semibold text-brand-primary underline hover:text-brand-primary-dark">Adult group home serving the Richmond, VA area</Link>
          </li>
          <li>
            <Link href="/services/residential-group-home" className="font-semibold text-brand-primary underline hover:text-brand-primary-dark">Our residential group home</Link>
          </li>
        </ul>
      </Section>

      <Section title="Sources" description="Virginia rules and agency details above were checked against these sources on November 2, 2026.">
        <ol className="max-w-3xl list-decimal space-y-2 pl-5 text-sm leading-6 text-brand-muted">
          {sources.map((source) => (
            <li key={source.url}>
              <a href={source.url} className="underline hover:text-brand-ink" rel="noopener" target="_blank">{source.label}</a>
            </li>
          ))}
        </ol>
      </Section>
    </>
  );
}
