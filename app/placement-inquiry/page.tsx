import Link from 'next/link';
import { buildMetadata } from '@/lib/site';
import { PageHero } from '@/components/page-hero';
import { LeadForm } from '@/components/lead-form';
import { Section, Card } from '@/components/ui';
import { communityEngagement, requirements } from '@/lib/content';
import { NO_MEDICAL_NOTICE, inquiryExtraFields, inquirySummaryFields } from '@/lib/inquiry-fields';

export const metadata = buildMetadata({
  title: 'Inquire About Our Services | Beyon Vital, LLC',
  path: '/placement-inquiry',
  description: 'Send an inquiry about the Beyon Vital residential group home or Community Engagement. Contact details only; please do not include medical information.'
});

const linkClass = 'font-semibold text-brand-primary hover:text-brand-primary-dark';

export default function PlacementInquiryPage() {
  return (
    <>
      <PageHero
        title="Start an inquiry"
        description="Tell us how to reach you and which service you are interested in. Please do not include medical details."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Inquiry', href: '/placement-inquiry' }]}
      />
      <Section title="Inquiry form" description="We will follow up at the time you prefer.">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <LeadForm
            leadType="placement"
            title="Inquiry Form"
            description={NO_MEDICAL_NOTICE}
            successRedirect="/placement-inquiry/success"
            noteWarning={NO_MEDICAL_NOTICE}
            extraFields={inquiryExtraFields}
            summaryLeadLabel="Inquiry"
            summaryFields={inquirySummaryFields}
          />
          <div className="space-y-4">
            <Card interactive={false}>
              <h2 className="text-2xl font-bold text-brand-ink">What we ask for</h2>
              <ul className="mt-3 space-y-2 text-sm text-brand-muted">
                <li>• Your name, email, and phone</li>
                <li>• Who the inquiry is for</li>
                <li>• The service you are interested in</li>
                <li>• A good time to contact you</li>
                <li>• An optional note (no medical details)</li>
              </ul>
            </Card>
            <Card interactive={false}>
              <h2 className="text-2xl font-bold text-brand-ink">Group home requirements</h2>
              <ul className="mt-3 space-y-2 text-sm text-brand-muted">
                {requirements.map((item) => <li key={item.label}>• {item.text}</li>)}
              </ul>
              <Link href="/requirements" className={`mt-3 inline-flex text-sm ${linkClass}`}>Review requirements</Link>
            </Card>
            <Card interactive={false}>
              <h2 className="text-2xl font-bold text-brand-ink">Community Engagement</h2>
              <p className="mt-2 text-sm leading-7 text-brand-muted">{communityEngagement.description} Hours: {communityEngagement.hours}.</p>
              <Link href="/services/community-engagement/inquiry" data-track-cta="community-engagement-inquiry" className={`mt-3 inline-flex text-sm ${linkClass}`}>Community Engagement inquiry</Link>
            </Card>
          </div>
        </div>
      </Section>
    </>
  );
}
