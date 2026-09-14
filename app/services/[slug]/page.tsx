import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  business,
  communityEngagement,
  coreValues,
  homeFeatures,
  homeIntro,
  homePhotos,
  missionFocus,
  peopleImages,
  requirements,
  requirementsIntro,
  servicePages,
  serviceSlugs,
  type ServiceSlug
} from '@/lib/content';
import { buildMetadata, serviceJsonLd } from '@/lib/site';
import { PageHero } from '@/components/page-hero';
import { Section, Card, Button } from '@/components/ui';
import { FaqList } from '@/components/faq-list';
import { Reveal } from '@/components/reveal';
import { PhotoGrid } from '@/components/photo-grid';
import { IllustrativeImage } from '@/components/illustrative-image';
import { StructuredData } from '@/components/structured-data';

export const dynamicParams = false;

export function generateStaticParams() {
  return serviceSlugs.map((slug) => ({ slug }));
}

function isServiceSlug(slug: string): slug is ServiceSlug {
  return (serviceSlugs as readonly string[]).includes(slug);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (!isServiceSlug(slug)) return {};
  const page = servicePages[slug];
  return buildMetadata({ title: page.metaTitle, description: page.metaDescription, path: `/services/${slug}` });
}

export default async function ServiceLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isServiceSlug(slug)) notFound();
  const page = servicePages[slug];
  const path = `/services/${slug}`;

  return (
    <>
      <StructuredData data={serviceJsonLd(slug)} />
      <PageHero
        eyebrow={page.eyebrow}
        title={page.title}
        description={page.summary}
        image={page.image}
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Services', href: '/services' }, { label: page.title, href: path }]}
        actions={
          <>
            <Button href={page.inquiryHref} trackCta={page.trackCta}>{page.inquiryCta}</Button>
            <Button href={business.phoneHref} variant="ghost" trackCta="call">Call {business.phone}</Button>
          </>
        }
      />
      {slug === 'residential-group-home' ? <ResidentialDetails /> : <CommunityEngagementDetails />}
      <Section title={`${page.title} questions`}>
        <FaqList items={page.faqs} />
      </Section>
    </>
  );
}

function ResidentialDetails() {
  const page = servicePages['residential-group-home'];
  return (
    <>
      <Section title="What this service includes" description={missionFocus}>
        <div className="grid gap-4 md:grid-cols-2">
          <Reveal>
            <Card className="h-full">
              <h3 className="font-semibold text-brand-ink">Support</h3>
              <ul className="mt-3 space-y-2 text-sm text-brand-muted">
                {page.bullets.map((bullet) => <li key={bullet}>• {bullet}</li>)}
              </ul>
            </Card>
          </Reveal>
          <Reveal delayMs={70}>
            <Card className="h-full">
              <h3 className="font-semibold text-brand-ink">Our core values</h3>
              <ul className="mt-3 space-y-3 text-sm leading-7 text-brand-muted">
                {coreValues.map((value) => <li key={value.label}>{value.text}</li>)}
              </ul>
            </Card>
          </Reveal>
        </div>
      </Section>
      <Section title="The home" description={`${homeIntro} in North Chesterfield, VA.`}>
        <PhotoGrid photos={[homePhotos.bedroomTwin, homePhotos.livingRoom, homePhotos.backyardPatio]} />
        <ul className="mt-6 flex flex-wrap gap-2" aria-label="Home features">
          {homeFeatures.map((feature) => (
            <li key={feature} className="rounded-full border border-brand-ink/10 bg-white px-3 py-1.5 text-sm font-medium text-brand-ink">{feature}</li>
          ))}
        </ul>
        <div className="mt-6">
          <Button href="/our-home" variant="ghost" trackCta="view-our-home">View Our Home</Button>
        </div>
      </Section>
      <Section title="Requirements" description={requirementsIntro}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {requirements.map((item) => (
            <Card key={item.label}>
              <h3 className="font-semibold text-brand-ink">{item.label}</h3>
              <p className="mt-2 text-sm leading-7 text-brand-muted">{item.text}</p>
            </Card>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button href={page.inquiryHref} trackCta={page.trackCta}>{page.inquiryCta}</Button>
          <Button href="/tour" variant="ghost" trackCta="request-tour">Request a Tour</Button>
        </div>
      </Section>
    </>
  );
}

function CommunityEngagementDetails() {
  const page = servicePages['community-engagement'];
  return (
    <>
      <Section eyebrow={`Hours: ${communityEngagement.hours}`} title="What Community Engagement includes" description={communityEngagement.description}>
        <ul className="grid gap-4 md:grid-cols-3">
          {communityEngagement.activities.map((activity, index) => (
            <li key={activity}>
              <Reveal delayMs={index * 60}>
                <Card className="h-full">
                  <p className="font-display text-3xl font-bold text-brand-primary" aria-hidden="true">0{index + 1}</p>
                  <h3 className="mt-2 text-lg font-semibold text-brand-ink">{activity}</h3>
                </Card>
              </Reveal>
            </li>
          ))}
        </ul>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <IllustrativeImage src={peopleImages.volunteer.src} alt={peopleImages.volunteer.alt} sizes="(max-width: 768px) 100vw, 50vw" />
          <IllustrativeImage src={peopleImages.lifeCoaching.src} alt={peopleImages.lifeCoaching.alt} sizes="(max-width: 768px) 100vw, 50vw" />
        </div>
      </Section>
      <Section title="Ask about Community Engagement" description={`Community Engagement runs ${communityEngagement.hours}. Send an inquiry or call us to learn more.`}>
        <Card interactive={false}>
          <div className="flex flex-wrap gap-3">
            <Button href={page.inquiryHref} trackCta={page.trackCta}>{page.inquiryCta}</Button>
            <Button href={business.phoneHref} variant="secondary" trackCta="call">Call {business.phone}</Button>
          </div>
        </Card>
      </Section>
    </>
  );
}
