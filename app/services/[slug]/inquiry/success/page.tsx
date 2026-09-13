import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { buildMetadata } from '@/lib/site';
import { business } from '@/lib/content';
import { PageHero } from '@/components/page-hero';
import { Section, Card, Button } from '@/components/ui';

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ slug: 'community-engagement' }];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return {
    ...buildMetadata({
      title: 'Community Engagement Inquiry Received | Beyon Vital, LLC',
      description: 'Thank you for your Community Engagement inquiry. Beyon Vital, LLC will follow up.',
      path: `/services/${slug}/inquiry/success`
    }),
    robots: { index: false, follow: true }
  };
}

export default async function ServiceInquirySuccessPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug !== 'community-engagement') notFound();

  return (
    <>
      <PageHero
        title="Thank you. Your inquiry was received."
        description="We will review your information and follow up at your preferred contact time."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Community Engagement', href: `/services/${slug}` },
          { label: 'Inquiry received', href: `/services/${slug}/inquiry/success` }
        ]}
      />
      <Section title="While you wait">
        <Card>
          <p className="text-sm leading-7 text-brand-muted">
            If you would like to talk sooner, call us at{' '}
            <a href={business.phoneHref} data-track-cta="call" className="font-semibold text-brand-primary hover:text-brand-primary-dark">{business.phone}</a>.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button href={`/services/${slug}`} variant="ghost">Back to Community Engagement</Button>
            <Button href="/" variant="secondary">Return Home</Button>
          </div>
        </Card>
      </Section>
    </>
  );
}
