import { buildMetadata } from '@/lib/site';
import { PageHero } from '@/components/page-hero';
import { Section, Card, Button } from '@/components/ui';
import { Reveal } from '@/components/reveal';
import { IllustrativeImage } from '@/components/illustrative-image';
import { servicePages, serviceSlugs } from '@/lib/content';

export const metadata = buildMetadata({
  title: 'Services: Residential Group Home & Community Engagement | Beyon Vital, LLC',
  path: '/services',
  description:
    'Beyon Vital, LLC offers a residential group home with therapeutic, behavioral, and psycho-educational support for mature and young adults, and Community Engagement from 9am–3pm.'
});

export default function ServicesPage() {
  return (
    <>
      <PageHero
        title="Our services"
        description="Our mission at Beyon Vital, LLC is to provide remarkable therapeutic, behavioral, psycho-educational, and other services."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Services', href: '/services' }]}
        actions={
          <>
            <Button href="/placement-inquiry" trackCta="placement-inquiry">Start an Inquiry</Button>
            <Button href="/services/community-engagement/inquiry" variant="ghost" trackCta="community-engagement-inquiry">Community Engagement Inquiry</Button>
          </>
        }
      />
      <Section title="Two ways we help" description="Choose a service to see what it includes and how to reach out.">
        <div className="grid gap-5 md:grid-cols-2">
          {serviceSlugs.map((slug, index) => {
            const page = servicePages[slug];
            return (
              <Reveal key={slug} delayMs={index * 70}>
                <Card className="flex h-full flex-col">
                  <IllustrativeImage src={page.image.src} alt={page.image.alt} sizes="(max-width: 768px) 100vw, 50vw" />
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary">{page.eyebrow}</p>
                  <h2 className="mt-1 text-3xl font-bold text-brand-ink">{page.title}</h2>
                  <ul className="mt-3 space-y-1.5 text-sm text-brand-muted">
                    {page.bullets.map((bullet) => <li key={bullet}>• {bullet}</li>)}
                  </ul>
                  <div className="mt-auto flex flex-wrap gap-3 pt-5">
                    <Button href={`/services/${slug}`} variant="ghost">Read More</Button>
                    <Button href={page.inquiryHref} trackCta={page.trackCta}>{page.inquiryCta}</Button>
                  </div>
                </Card>
              </Reveal>
            );
          })}
        </div>
      </Section>
    </>
  );
}
