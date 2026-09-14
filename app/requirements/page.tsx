import { buildMetadata } from '@/lib/site';
import { PageHero } from '@/components/page-hero';
import { Section, Card, Button } from '@/components/ui';
import { Reveal } from '@/components/reveal';
import { business, requirements, requirementsIntro } from '@/lib/content';

export const metadata = buildMetadata({
  title: 'Group Home Requirements | Beyon Vital, LLC',
  path: '/requirements',
  description: 'To live at the Beyon Vital group home, clients must be at least 18 years of age, have acceptable insurance, and be willing to live with other residents.'
});

export default function RequirementsPage() {
  return (
    <>
      <PageHero
        title="Requirements"
        description={requirementsIntro}
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Requirements', href: '/requirements' }]}
        actions={<Button href="/placement-inquiry" trackCta="placement-inquiry">Start an Inquiry</Button>}
      />
      <Section title="Criteria for residents" description="These criteria apply to our residential group home in North Chesterfield, VA.">
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {requirements.map((item, index) => (
            <li key={item.label}>
              <Reveal delayMs={index * 60}>
                <Card className="h-full">
                  <p className="font-display text-4xl font-bold text-brand-primary" aria-hidden="true">{index + 1}</p>
                  <h3 className="mt-1 font-semibold text-brand-ink">{item.label}</h3>
                  <p className="mt-2 text-sm leading-7 text-brand-muted">{item.text}</p>
                </Card>
              </Reveal>
            </li>
          ))}
        </ol>
      </Section>
      <Section title="Questions about insurance?" description={`Clients must have acceptable insurance. Call ${business.phone} to ask about your coverage.`}>
        <div className="flex flex-wrap gap-3">
          <Button href={business.phoneHref} trackCta="call">Call {business.phone}</Button>
          <Button href="/faq" variant="ghost">Read the FAQ</Button>
        </div>
      </Section>
    </>
  );
}
