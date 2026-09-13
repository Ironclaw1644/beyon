import Link from 'next/link';
import { buildMetadata } from '@/lib/site';
import { PageHero } from '@/components/page-hero';
import { LeadForm } from '@/components/lead-form';
import { Section, Card } from '@/components/ui';
import { homeFeatures, homeIntro } from '@/lib/content';
import { CONTACT_TIME_OPTIONS, NO_MEDICAL_NOTICE, WHO_FOR_OPTIONS, contactSummaryFields, noteField, subscribeField } from '@/lib/inquiry-fields';

export const metadata = buildMetadata({
  title: 'Request a Tour of Our Home | Beyon Vital, LLC',
  path: '/tour',
  description: 'Request a tour of the Beyon Vital group home in North Chesterfield, VA. Share a few days and times that work for you.'
});

export default function TourPage() {
  return (
    <>
      <PageHero
        title="Request a tour"
        description="Share a few days and times that work for you, and we will follow up to schedule."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Request a Tour', href: '/tour' }]}
      />
      <Section title="Tour request form">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <LeadForm
            leadType="tour"
            title="Tour Request"
            description={NO_MEDICAL_NOTICE}
            noteWarning={NO_MEDICAL_NOTICE}
            extraFields={[
              { name: 'who_for', label: 'Who is this tour for?', type: 'select', required: true, options: WHO_FOR_OPTIONS },
              { name: 'preferred_dates_times', label: 'Preferred days and times', type: 'textarea', required: true, minLength: 5, placeholder: 'Example: weekday afternoons' },
              { name: 'preferred_contact_time', label: 'Preferred contact time', type: 'select', required: true, options: CONTACT_TIME_OPTIONS },
              subscribeField,
              noteField()
            ]}
            summaryLeadLabel="Tour Request"
            summaryFields={[
              ...contactSummaryFields,
              { name: 'who_for', label: 'Inquiry For' },
              { name: 'preferred_dates_times', label: 'Preferred Dates/Times' },
              { name: 'preferred_contact_time', label: 'Preferred Contact Time' }
            ]}
          />
          <Card interactive={false} className="h-fit">
            <h2 className="text-2xl font-bold text-brand-ink">About the home</h2>
            <p className="mt-2 text-sm leading-7 text-brand-muted">{homeIntro}.</p>
            <ul className="mt-3 grid grid-cols-2 gap-2 text-sm text-brand-muted">
              {homeFeatures.map((feature) => <li key={feature}>• {feature}</li>)}
            </ul>
            <Link href="/our-home" data-track-cta="view-our-home" className="mt-4 inline-flex text-sm font-semibold text-brand-primary hover:text-brand-primary-dark">See photos of the home</Link>
          </Card>
        </div>
      </Section>
    </>
  );
}
