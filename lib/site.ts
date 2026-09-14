import type { Metadata } from 'next';
import { business, communityEngagement, homePhotos, locationPages, locationSlugs, servicePages, type Faq, type ServiceSlug } from '@/lib/content';
import { absoluteUrl } from '@/lib/utils';

export const defaultDescription =
  'Beyon Vital, LLC provides therapeutic, behavioral, and psycho-educational services for mature and young adults, with a residential group home and Community Engagement (9am–3pm) in North Chesterfield, VA.';

export const OG_IMAGE = {
  path: '/brand/og-image.png',
  width: 1200,
  height: 630,
  alt: 'Beyon Vital, LLC: Residential Group Home and Community Engagement in North Chesterfield, VA'
};

export function buildMetadata({ title, description, path = '/' }: { title: string; description?: string; path?: string }): Metadata {
  const desc = description || defaultDescription;
  const url = absoluteUrl(path);
  const image = { url: absoluteUrl(OG_IMAGE.path), width: OG_IMAGE.width, height: OG_IMAGE.height, alt: OG_IMAGE.alt };
  return {
    title,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: desc,
      url,
      siteName: business.brandLine,
      locale: 'en_US',
      type: 'website',
      images: [image]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
      images: [image]
    }
  };
}

const BUSINESS_ID = () => absoluteUrl('/#business');

function areaServed() {
  return locationSlugs.map((slug) => ({
    '@type': slug === 'chesterfield-county-va' ? 'AdministrativeArea' : 'City',
    name: locationPages[slug].shortName
  }));
}

// schema.org has no group-home or social-services business type, and
// MedicalBusiness would imply clinical/licensure claims the client has not made,
// so this is a LocalBusiness with a Wikipedia additionalType. No ratings, geo,
// sameAs, or opening hours for the residence (none were provided).
export function localBusinessJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': BUSINESS_ID(),
    additionalType: 'https://en.wikipedia.org/wiki/Group_home',
    name: business.name,
    alternateName: business.brandLine,
    description: defaultDescription,
    url: absoluteUrl('/'),
    logo: absoluteUrl('/brand/logo.png'),
    image: [absoluteUrl(homePhotos.exterior.src), absoluteUrl('/brand/logo-full.png')],
    telephone: business.phoneSchema,
    email: business.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: business.streetAddress,
      addressLocality: business.locality,
      addressRegion: business.region,
      postalCode: business.postalCode,
      addressCountry: 'US'
    },
    areaServed: areaServed(),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Services',
      itemListElement: (Object.keys(servicePages) as ServiceSlug[]).map((slug) => ({
        '@type': 'Offer',
        itemOffered: { '@id': absoluteUrl(`/services/${slug}#service`), '@type': 'Service', name: servicePages[slug].title }
      }))
    }
  };
}

export function serviceJsonLd(slug: ServiceSlug) {
  const page = servicePages[slug];
  const base = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': absoluteUrl(`/services/${slug}#service`),
    name: page.title,
    serviceType: page.title,
    description: page.summary,
    url: absoluteUrl(`/services/${slug}`),
    image: absoluteUrl(slug === 'residential-group-home' ? homePhotos.exterior.src : page.image.src),
    provider: { '@id': BUSINESS_ID(), '@type': 'LocalBusiness', name: business.name },
    areaServed: areaServed()
  };
  if (slug !== 'community-engagement') return base;
  // Hours come from the client; days of the week were not given, so none are listed.
  return {
    ...base,
    hoursAvailable: { '@type': 'OpeningHoursSpecification', opens: communityEngagement.opens, closes: communityEngagement.closes }
  };
}

export function breadcrumbJsonLd(items: { label: string; href?: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: absoluteUrl(item.href) } : {})
    }))
  };
}

export function faqJsonLd(items: Faq[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a }
    }))
  };
}
