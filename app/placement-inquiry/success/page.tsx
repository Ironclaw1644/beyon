import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/site';
import { business } from '@/lib/content';
import { PageHero } from '@/components/page-hero';
import { Section, Card, Button } from '@/components/ui';

export const metadata: Metadata = {
  ...buildMetadata({
    title: 'Inquiry Received | Beyon Vital, LLC',
    path: '/placement-inquiry/success',
    description: 'Your inquiry has been received. Beyon Vital, LLC will follow up.'
  }),
  robots: { index: false, follow: true }
};

export default function PlacementInquirySuccessPage() {
  return (
    <>
      <PageHero
        title="Thank you. Your inquiry was received."
        description="We will review your information and follow up at your preferred contact time."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Inquiry', href: '/placement-inquiry' },
          { label: 'Received', href: '/placement-inquiry/success' }
        ]}
      />
      <Section title="While you wait">
        <Card interactive={false}>
          <p className="text-sm leading-7 text-brand-muted">
            If you would like to talk sooner, call us at{' '}
            <a href={business.phoneHref} data-track-cta="call" className="font-semibold text-brand-primary hover:text-brand-primary-dark">{business.phone}</a>.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button href="/our-home" trackCta="view-our-home">See Our Home</Button>
            <Button href="/" variant="ghost">Return Home</Button>
          </div>
        </Card>
      </Section>
    </>
  );
}
