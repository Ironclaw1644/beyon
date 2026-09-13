import Link from 'next/link';
import { PageHero } from '@/components/page-hero';
import { Section, Card, Button, Badge } from '@/components/ui';
import { AnnouncementList } from '@/components/announcement-list';
import { Reveal } from '@/components/reveal';
import { PhotoGrid } from '@/components/photo-grid';
import { IllustrativeImage } from '@/components/illustrative-image';
import { getAnnouncements } from '@/lib/announcements';
import { buildMetadata } from '@/lib/site';
import { business, coreValues, homeFeatures, homeIntro, homePhotos, mission, peopleImages, servicePages, serviceSlugs, vision } from '@/lib/content';

export const metadata = buildMetadata({
  title: 'Beyon Vital, LLC | Group Home & Community Engagement in North Chesterfield, VA',
  path: '/'
});

export default async function HomePage() {
  const announcements = await getAnnouncements({ currentPath: '/', limit: 3 });

  return (
    <>
      <PageHero
        eyebrow={business.brandLine}
        title="Bringing positivity and remarkable services into our clients’ lives."
        description="Therapeutic, behavioral, and psycho-educational services for mature and young adults: a residential group home in North Chesterfield, VA, and Community Engagement from 9am–3pm."
        image={peopleImages.hero}
        actions={
          <>
            <Button href="/placement-inquiry" trackCta="placement-inquiry">Start an Inquiry</Button>
            <Button href="/tour" variant="ghost" trackCta="request-tour">Request a Tour</Button>
            <Button href={business.phoneHref} variant="secondary" trackCta="call">Call {business.phone}</Button>
          </>
        }
      />

      <Section eyebrow="Who we are" title="Our mission and vision">
        <div className="grid gap-4 lg:grid-cols-3">
          <Reveal className="lg:col-span-2">
            <Card className="h-full">
              <Badge>Our Mission</Badge>
              <p className="mt-3 text-base leading-8 text-brand-ink">{mission}</p>
            </Card>
          </Reveal>
          <Reveal delayMs={70}>
            <Card className="h-full">
              <Badge>Vision</Badge>
              <p className="mt-3 font-display text-2xl font-semibold leading-snug text-brand-ink">{vision}</p>
            </Card>
          </Reveal>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {coreValues.map((value, index) => (
            <Reveal key={value.label} delayMs={index * 60}>
              <Card className="h-full">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary">Core value</p>
                <h3 className="mt-2 text-lg font-semibold text-brand-ink">{value.label}</h3>
                <p className="mt-2 text-sm leading-7 text-brand-muted">{value.text}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section eyebrow="What we offer" title="Our services">
        <div className="grid gap-5 md:grid-cols-2">
          {serviceSlugs.map((slug, index) => {
            const page = servicePages[slug];
            return (
              <Reveal key={slug} delayMs={index * 70}>
                <Card className="flex h-full flex-col">
                  <IllustrativeImage src={page.image.src} alt={page.image.alt} sizes="(max-width: 768px) 100vw, 50vw" />
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary">{page.eyebrow}</p>
                  <h3 className="mt-1 font-display text-3xl font-bold text-brand-ink">{page.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-brand-muted">{page.summary}</p>
                  <div className="mt-auto flex flex-wrap gap-3 pt-5">
                    <Button href={`/services/${slug}`} variant="ghost">Learn More</Button>
                    <Button href={page.inquiryHref} trackCta={page.trackCta}>{page.inquiryCta}</Button>
                  </div>
                </Card>
              </Reveal>
            );
          })}
        </div>
      </Section>

      <Section eyebrow="Our home" title={homeIntro} description="Our residential group home in North Chesterfield, VA.">
        <PhotoGrid photos={[homePhotos.exterior, homePhotos.livingRoom, homePhotos.kitchenDining]} />
        <ul className="mt-6 flex flex-wrap gap-2" aria-label="Home features">
          {homeFeatures.map((feature) => (
            <li key={feature} className="rounded-full border border-brand-ink/10 bg-white px-3 py-1.5 text-sm font-medium text-brand-ink">{feature}</li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button href="/our-home" variant="ghost" trackCta="view-our-home">View Our Home</Button>
          <Button href="/requirements" variant="secondary" trackCta="review-requirements">Review Requirements</Button>
        </div>
      </Section>

      {announcements.length ? (
        <Section title="Current announcements">
          <Reveal>
            <AnnouncementList announcements={announcements} />
          </Reveal>
          <div className="mt-4">
            <Link href="/announcements" className="text-sm font-semibold text-brand-primary hover:text-brand-primary-dark">See all announcements</Link>
          </div>
        </Section>
      ) : null}
    </>
  );
}
