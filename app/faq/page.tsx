import { buildMetadata, faqJsonLd } from '@/lib/site';
import { PageHero } from '@/components/page-hero';
import { Section, Button } from '@/components/ui';
import { FaqList } from '@/components/faq-list';
import { StructuredData } from '@/components/structured-data';
import { faqs } from '@/lib/content';

export const metadata = buildMetadata({
  title: 'FAQ: Requirements, Services & Our Home | Beyon Vital, LLC',
  path: '/faq',
  description: 'Answers about Beyon Vital, LLC: who we serve, group home requirements, the home, Community Engagement hours, and how to contact us.'
});

export default function FaqPage() {
  return (
    <>
      <StructuredData data={faqJsonLd(faqs)} />
      <PageHero
        title="Frequently asked questions"
        description="Common questions about our services, requirements, and home."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'FAQ', href: '/faq' }]}
      />
      <Section title="Questions and answers" description="Need more detail? Call or send us a message.">
        <FaqList items={faqs} />
        <div className="mt-6 flex flex-wrap gap-3">
          <Button href="/contact">Contact Us</Button>
          <Button href="/placement-inquiry" variant="ghost" trackCta="placement-inquiry">Start an Inquiry</Button>
        </div>
      </Section>
    </>
  );
}
