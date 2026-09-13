import { buildMetadata } from '@/lib/site';
import { business } from '@/lib/content';
import { PageHero } from '@/components/page-hero';
import { LeadForm } from '@/components/lead-form';
import { Section, Card } from '@/components/ui';
import { CONTACT_TIME_OPTIONS, NO_MEDICAL_NOTICE, contactSummaryFields, noteField, subscribeField } from '@/lib/inquiry-fields';

export const metadata = buildMetadata({
  title: 'Contact Beyon Vital, LLC | (804) 366-3442 | North Chesterfield, VA',
  path: '/contact',
  description: 'Call (804) 366-3442, email beyonvitalllc@gmail.com, or send a message to Beyon Vital, LLC at 8120 Clovertree Ct, North Chesterfield, VA 23235.'
});

const linkClass = 'font-semibold text-brand-primary hover:text-brand-primary-dark';

export default function ContactPage() {
  return (
    <>
      <PageHero
        title="Contact us"
        description="Call, email, or send a message."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Contact', href: '/contact' }]}
      />
      <Section title="Get in touch" description="Asking about a specific service? The inquiry form routes it faster.">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <Card>
              <h3 className="font-semibold text-brand-ink">Business</h3>
              <p className="mt-2 text-sm text-brand-muted">{business.name}</p>
              <p className="text-sm text-brand-muted">{business.brandLine}</p>
            </Card>
            <Card>
              <h3 className="font-semibold text-brand-ink">Phone</h3>
              <p className="mt-2 text-sm"><a href={business.phoneHref} data-track-cta="call" className={linkClass}>{business.phone}</a></p>
            </Card>
            <Card>
              <h3 className="font-semibold text-brand-ink">Email</h3>
              <p className="mt-2 break-all text-sm"><a href={`mailto:${business.email}`} className={linkClass}>{business.email}</a></p>
            </Card>
            <Card>
              <h3 className="font-semibold text-brand-ink">Address</h3>
              <p className="mt-2 text-sm text-brand-muted">{business.address}</p>
              <p className="mt-2 text-sm">
                <a href={business.mapsUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>Open in Google Maps</a>
              </p>
            </Card>
          </div>
          <LeadForm
            leadType="general"
            title="Contact Form"
            description={NO_MEDICAL_NOTICE}
            noteWarning={NO_MEDICAL_NOTICE}
            extraFields={[
              { name: 'preferred_contact_time', label: 'Preferred contact time', type: 'select', options: CONTACT_TIME_OPTIONS },
              subscribeField,
              noteField('Message', true)
            ]}
            summaryLeadLabel="General Contact"
            summaryFields={[...contactSummaryFields, { name: 'preferred_contact_time', label: 'Preferred Contact Time', fallback: 'Not provided' }]}
          />
        </div>
      </Section>
    </>
  );
}
