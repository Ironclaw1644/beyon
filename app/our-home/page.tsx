import { buildMetadata } from '@/lib/site';
import { PageHero } from '@/components/page-hero';
import { Section, Card, Button } from '@/components/ui';
import { OurHomeCarousel } from '@/components/our-home-carousel';
import { Reveal } from '@/components/reveal';
import { business, homeFeatureSentence, homeFeatures, homeIntro, homePhotos, requirements, requirementsIntro } from '@/lib/content';

export const metadata = buildMetadata({
  title: 'Our Home: 4 Beds, 3 Bedrooms in North Chesterfield, VA | Beyon Vital, LLC',
  path: '/our-home',
  description:
    'Photos of the Beyon Vital group home in North Chesterfield, VA: a safe and comfortable environment with 4 beds, 3 bedrooms, 1 1/2 bathrooms, updated appliances, a TV area, hardwood flooring, and an outdoor sitting area.'
});

const slides = [
  homePhotos.exterior,
  homePhotos.livingRoom,
  homePhotos.kitchenDining,
  homePhotos.bedroomTwin,
  homePhotos.bedroomQueen,
  homePhotos.bedroomSleigh,
  homePhotos.bathroomFull,
  homePhotos.bathroomHalf,
  homePhotos.staircase,
  homePhotos.backyardPatio
];

export default function OurHomePage() {
  return (
    <>
      <PageHero
        title="Our home"
        description={`${homeIntro} in North Chesterfield, VA.`}
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Our Home', href: '/our-home' }]}
        actions={
          <>
            <Button href="/tour" trackCta="request-tour">Request a Tour</Button>
            <Button href="/placement-inquiry" variant="ghost" trackCta="placement-inquiry">Inquire</Button>
          </>
        }
      />
      <Section title="Home features" description={homeFeatureSentence}>
        <Reveal>
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {homeFeatures.map((item) => (
              <li key={item}>
                <Card className="h-full"><p className="text-sm font-semibold text-brand-ink">{item}</p></Card>
              </li>
            ))}
          </ul>
        </Reveal>
      </Section>
      <Section title="Take a look inside" description="Bedrooms, bathrooms, the kitchen and dining area, the living room, and the backyard patio.">
        <Reveal>
          <OurHomeCarousel slides={slides} />
        </Reveal>
      </Section>
      <Section title="Who can live here" description={requirementsIntro}>
        <div className="grid gap-4 md:grid-cols-3">
          {requirements.map((item) => (
            <Card key={item.label}>
              <h3 className="font-semibold text-brand-ink">{item.label}</h3>
              <p className="mt-2 text-sm leading-7 text-brand-muted">{item.text}</p>
            </Card>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button href="/requirements" variant="ghost" trackCta="review-requirements">Review Requirements</Button>
          <Button href={business.phoneHref} variant="secondary" trackCta="call">Call {business.phone}</Button>
        </div>
      </Section>
    </>
  );
}
