import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { buildMetadata } from '@/lib/site';
import { PageHero } from '@/components/page-hero';
import { LeadForm } from '@/components/lead-form';
import { Section, Card } from '@/components/ui';
import { business, communityEngagement, servicePages } from '@/lib/content';
import { NO_MEDICAL_NOTICE, inquiryExtraFields, inquirySummaryFields } from '@/lib/inquiry-fields';

// Only Community Engagement has a dedicated inquiry URL (its flyer links here).
// Residential inquiries use /placement-inquiry.
const INQUIRY_SLUGS = ['community-engagement'] as const;
export const dynamicParams = false;

export function generateStaticParams() {
  return INQUIRY_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (slug !== 'community-engagement') return {};
  return buildMetadata({
    title: 'Community Engagement Inquiry | Beyon Vital, LLC',
    description: `Ask Beyon Vital, LLC about Community Engagement (${communityEngagement.hours}): community outings, volunteer work, and life coaching. Or call ${business.phone}.`,
    path: `/services/${slug}/inquiry`
  });
}

export default async function ServiceInquiryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug !== 'community-engagement') notFound();
  const page = servicePages[slug];

  return (
    <>
      <PageHero
        title="Community Engagement inquiry"
        description={`Interested in Community Engagement, ${communityEngagement.hours}? Share your contact details and we will reach out.`}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Services', href: '/services' },
          { label: page.title, href: `/services/${slug}` },
          { label: 'Inquiry', href: `/services/${slug}/inquiry` }
        ]}
      />
      <Section title="Tell us how to reach you" description="Contact details only. We will follow up at the time you prefer.">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <LeadForm
            leadType="community_engagement"
            title="Community Engagement Inquiry"
            description={NO_MEDICAL_NOTICE}
            successRedirect={`/services/${slug}/inquiry/success`}
            noteWarning={NO_MEDICAL_NOTICE}
            defaultValues={{ service_interest: 'Community Engagement' }}
            extraFields={inquiryExtraFields}
            summaryLeadLabel="Community Engagement Inquiry"
            summaryFields={inquirySummaryFields}
          />
          <div className="space-y-4">
            <Card>
              <h2 className="text-lg font-semibold text-brand-ink">About Community Engagement</h2>
              <p className="mt-2 text-sm leading-7 text-brand-muted">{communityEngagement.description}</p>
              <ul className="mt-3 space-y-1.5 text-sm text-brand-muted">
                {communityEngagement.activities.map((item) => <li key={item}>• {item}</li>)}
              </ul>
            </Card>
            <Card>
              <h2 className="text-lg font-semibold text-brand-ink">Prefer to call?</h2>
              <p className="mt-2 text-sm leading-7 text-brand-muted">
                <a href={business.phoneHref} data-track-cta="call" className="font-semibold text-brand-primary hover:text-brand-primary-dark">{business.phone}</a>
                {' · '}
                <a href={`mailto:${business.email}`} className="font-semibold text-brand-primary hover:text-brand-primary-dark">{business.email}</a>
              </p>
            </Card>
          </div>
        </div>
      </Section>
    </>
  );
}
