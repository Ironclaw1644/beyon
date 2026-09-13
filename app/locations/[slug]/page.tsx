import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  business,
  coreValues,
  HOME_PHOTO_SIZE,
  homePhotos,
  locationPages,
  locationSlugs,
  requirements,
  requirementsIntro,
  servicePages,
  serviceSlugs,
  type LocationSlug
} from '@/lib/content';
import { buildMetadata } from '@/lib/site';
import { PageHero } from '@/components/page-hero';
import { Section, Card, Button } from '@/components/ui';

export const dynamicParams = false;

export function generateStaticParams() {
  return locationSlugs.map((slug) => ({ slug }));
}

function isLocationSlug(slug: string): slug is LocationSlug {
  return (locationSlugs as readonly string[]).includes(slug);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (!isLocationSlug(slug)) return {};
  const page = locationPages[slug];
  return buildMetadata({ title: page.metaTitle, description: page.metaDescription, path: `/locations/${slug}` });
}

export default async function LocationLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isLocationSlug(slug)) notFound();
  const page = locationPages[slug];
  const otherAreas = locationSlugs.filter((item) => item !== slug);

  return (
    <>
      <PageHero
        title={page.title}
        description={page.summary}
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: page.shortName, href: `/locations/${slug}` }]}
        actions={
          <>
            <Button href="/placement-inquiry" trackCta="placement-inquiry">Start an Inquiry</Button>
            <Button href={business.phoneHref} variant="ghost" trackCta="call">Call {business.phone}</Button>
          </>
        }
      />
      <Section title={`Beyon Vital, LLC for ${page.shortName}`}>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            {page.body.map((paragraph) => (
              <p key={paragraph} className="text-sm leading-7 text-brand-muted [&+p]:mt-3">{paragraph}</p>
            ))}
            <p className="mt-4 text-sm text-brand-ink">
              <span className="font-semibold">Address:</span> {business.address}
            </p>
          </Card>
          <Card>
            {page.feature === 'photo' ? (
              <figure>
                <Image
                  src={homePhotos.exterior.src}
                  alt={homePhotos.exterior.alt}
                  width={HOME_PHOTO_SIZE.width}
                  height={HOME_PHOTO_SIZE.height}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="aspect-[3/4] w-full rounded-xl object-cover"
                />
                <figcaption className="mt-2 text-xs text-brand-muted">Our home in North Chesterfield, VA</figcaption>
              </figure>
            ) : null}
            {page.feature === 'requirements' ? (
              <>
                <h2 className="text-2xl font-bold text-brand-ink">Requirements</h2>
                <p className="mt-2 text-sm leading-7 text-brand-muted">{requirementsIntro}</p>
                <ul className="mt-3 space-y-2 text-sm text-brand-muted">
                  {requirements.map((item) => <li key={item.label}>• {item.text}</li>)}
                </ul>
              </>
            ) : null}
            {page.feature === 'values' ? (
              <>
                <h2 className="text-2xl font-bold text-brand-ink">Our core values</h2>
                <ul className="mt-3 space-y-3 text-sm leading-7 text-brand-muted">
                  {coreValues.map((value) => <li key={value.label}>{value.text}</li>)}
                </ul>
              </>
            ) : null}
          </Card>
        </div>
      </Section>
      <Section title="Services and next steps">
        <div className="grid gap-4 md:grid-cols-3">
          {serviceSlugs.map((serviceSlug) => (
            <Card key={serviceSlug}>
              <h3 className="font-semibold text-brand-ink">{servicePages[serviceSlug].title}</h3>
              <Link href={`/services/${serviceSlug}`} className="mt-3 inline-flex text-sm font-semibold text-brand-primary hover:text-brand-primary-dark">
                Learn about {servicePages[serviceSlug].title}
              </Link>
            </Card>
          ))}
          <Card>
            <h3 className="font-semibold text-brand-ink">Other service areas</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {otherAreas.map((area) => (
                <li key={area}>
                  <Link href={`/locations/${area}`} className="font-semibold text-brand-primary hover:text-brand-primary-dark">{locationPages[area].shortName}</Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </Section>
    </>
  );
}
