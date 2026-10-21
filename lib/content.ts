// Every factual statement rendered on the site lives here and is sourced in
// docs/claims.md (client flyer or client texts). Do not add facts that are not
// in that register — no licensure, payers, staffing, hours beyond Community
// Engagement, statistics, or testimonials.

export type Faq = { q: string; a: string };
export type SiteImage = { src: string; alt: string };

export const business = {
  name: 'Beyon Vital, LLC',
  shortName: 'Beyon Vital',
  brandLine: 'Beyon Vital Residential Group Home',
  phone: '(804) 366-3442',
  phoneSchema: '+1-804-366-3442',
  phoneHref: 'tel:+18043663442',
  email: 'beyonvitalllc@gmail.com',
  streetAddress: '8120 Clovertree Ct',
  locality: 'North Chesterfield',
  region: 'VA',
  postalCode: '23235',
  address: '8120 Clovertree Ct, North Chesterfield, VA 23235',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=8120+Clovertree+Ct%2C+North+Chesterfield%2C+VA+23235'
};

export const mission =
  'Our mission at Beyon Vital, LLC is to provide remarkable therapeutic, behavioral, psycho-educational, and other services. We seek to help stabilize mature and young adults who are at imminent risk of hospitalization and require additional coping skills to deal with life’s daily challenges. Our goal is to improve the lives of our clients and for our clients to receive memorable care from our team.';

export const missionFocus =
  'We seek to help stabilize mature and young adults who are at imminent risk of hospitalization and require additional coping skills to deal with life’s daily challenges.';

export const vision =
  'Beyon Vital, LLC is to bring positivity and remarkable services into our clients lives despite their challenges.';

export const coreValues = [
  { label: 'Effective tools and strategies', text: 'Provide effective tools, strategies, and services needed to improve the lives of our clients.' },
  { label: 'Personalized goals', text: 'Provide personalized goals to meet the specific needs for our mature and young adult clients.' },
  { label: 'A healthy mindset', text: 'Emphasize the importance of developing a healthy mindset for clients and a positive future for each of our clients.' }
];

export const homeIntro = 'A safe and comfortable environment';

// Answer-first summary: the sentence an AI answer or a search snippet should
// be able to lift as-is. Every clause is in docs/claims.md.
export const answerSummary =
  'Beyon Vital, LLC is a residential group home in North Chesterfield, VA, for mature and young adults, with therapeutic, behavioral, and psycho-educational support. We also offer Community Engagement from 9am–3pm, and we accept ID/DD Waivers.';

export const homeFeatures = ['4 beds', '3 bedrooms', '1 1/2 bathrooms', 'Updated appliances', 'TV area', 'Hardwood flooring', 'Outdoor sitting area'];

export const homeFeatureSentence =
  'The home has 4 beds, 3 bedrooms, 1 1/2 bathrooms, updated appliances, a TV area, hardwood flooring, and an outdoor sitting area.';

// Real photos of the home (public/images/home, generated from assets/source).
const photo = (name: string, alt: string): SiteImage => ({ src: `/images/home/${name}.webp`, alt });
export const homePhotos = {
  exterior: photo('exterior', 'Front of the Beyon Vital home, a two-story brick and siding home with house number 8120 above the door'),
  livingRoom: photo('living-room', 'Living room with a light gray sectional sofa and a wall-mounted TV'),
  kitchenDining: photo('kitchen-dining', 'Kitchen with wood cabinets beside a dining table with four chairs'),
  bedroomTwin: photo('bedroom-twin-beds', 'Bedroom with two twin beds, a patterned rug, and a dresser'),
  bedroomQueen: photo('bedroom-queen', 'Bedroom with a queen bed and gray bedding'),
  bedroomSleigh: photo('bedroom-sleigh', 'Bedroom with a white sleigh bed and a matching dresser'),
  bathroomFull: photo('bathroom-full', 'Full bathroom with a shower curtain, toilet, and vanity'),
  bathroomHalf: photo('bathroom-half', 'Half bathroom with a sink vanity and wallpapered walls'),
  backyardPatio: photo('backyard-patio', 'Fenced backyard with a stamped concrete patio and outdoor chairs'),
  staircase: photo('staircase', 'Staircase leading to the second floor')
};
export const HOME_PHOTO_SIZE = { width: 1200, height: 1600 };

// AI-generated lifestyle images. They don't depict Beyon Vital's actual staff or
// residents, so alt text describes the scene without naming anyone as staff.
export const peopleImages = {
  hero: { src: '/images/people/hero.webp', alt: 'A caregiver and two adults laughing over a photo album on a living room sofa', width: 1600, height: 1000 },
  communityOuting: { src: '/images/people/community-outing.webp', alt: 'Three adults shopping for fresh produce at an outdoor farmers market', width: 1200, height: 800 },
  lifeCoaching: { src: '/images/people/life-coaching.webp', alt: 'A coach helping a young adult fill in a planner at a table', width: 1200, height: 800 },
  volunteer: { src: '/images/people/volunteer.webp', alt: 'Three adults planting seedlings together in a community garden', width: 1200, height: 800 },
  staffCare: { src: '/images/people/staff-care.webp', alt: 'A caregiver and an adult talking over coffee at a kitchen table', width: 1200, height: 800 }
};

export const requirementsIntro = 'To ensure the comfort of staff and potential residents, you must meet the following criteria:';

export const requirements = [
  { label: 'Age', text: 'Client must be at least 18 years of age.' },
  { label: 'Insurance', text: 'Client must have acceptable insurance.' },
  { label: 'Shared living', text: 'Client must be willing to live with other residents.' },
  { label: 'Waivers', text: 'Accepting ID/DD Waivers' }
];

export const communityEngagement = {
  hours: '9am–3pm',
  opens: '09:00',
  closes: '15:00',
  description: 'Community Engagement is a service similar to day support for individuals.',
  activities: ['Community outings', 'Volunteer work', 'Life coaching']
};

export const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/services', label: 'Services' },
  { href: '/our-home', label: 'Our Home' },
  { href: '/requirements', label: 'Requirements' },
  { href: '/resources', label: 'Resources' },
  { href: '/faq', label: 'FAQ' },
  { href: '/announcements', label: 'Announcements' },
  { href: '/contact', label: 'Contact' }
];

export const footerLinks = [
  { href: '/services/residential-group-home', label: 'Residential Group Home' },
  { href: '/services/community-engagement', label: 'Community Engagement' },
  { href: '/our-home', label: 'Our Home' },
  { href: '/requirements', label: 'Requirements' },
  { href: '/resources', label: 'Resources' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' }
];

export const serviceSlugs = ['residential-group-home', 'community-engagement'] as const;
export type ServiceSlug = (typeof serviceSlugs)[number];

const waiverFaq: Faq = {
  q: 'Does Beyon Vital accept ID/DD Waivers?',
  a: 'Yes. Beyon Vital, LLC accepts ID/DD Waivers. Clients must also be at least 18 years of age, have acceptable insurance, and be willing to live with other residents.'
};

const bedsFaq: Faq = {
  q: 'How many beds does the group home have?',
  a: 'The home has 4 beds in 3 bedrooms, with 1 1/2 bathrooms, updated appliances, a TV area, hardwood flooring, and an outdoor sitting area.'
};

const areasFaq: Faq = {
  q: 'What areas does Beyon Vital serve?',
  a: 'Our residential group home is at 8120 Clovertree Ct, North Chesterfield, VA 23235. We serve North Chesterfield, Chesterfield County, and the Richmond, VA area.'
};

const tourFaq: Faq = {
  q: 'Can I tour the home?',
  a: 'You can request a tour of the home online. Share a few days and times that work for you, and we will follow up to schedule.'
};

type ServicePage = {
  title: string;
  eyebrow: string;
  metaTitle: string;
  metaDescription: string;
  summary: string;
  bullets: string[];
  image: SiteImage & { width: number; height: number };
  inquiryHref: string;
  inquiryCta: string;
  trackCta: string;
  faqs: Faq[];
};

export const servicePages: Record<ServiceSlug, ServicePage> = {
  'residential-group-home': {
    title: 'Residential Group Home',
    eyebrow: 'Therapeutic · Behavioral · Psycho-educational',
    metaTitle: 'Residential Group Home, North Chesterfield, VA | Beyon Vital',
    metaDescription:
      'Therapeutic, behavioral, and psycho-educational support for mature and young adults in a safe, comfortable 4-bed group home in North Chesterfield, VA.',
    summary: 'Therapeutic, behavioral, and psycho-educational support for mature and young adults, in a safe and comfortable home in North Chesterfield, VA.',
    bullets: ['Therapeutic support', 'Behavioral support', 'Psycho-educational support', 'Personalized goals for each client', 'A safe and comfortable home'],
    image: peopleImages.staffCare,
    inquiryHref: '/placement-inquiry',
    inquiryCta: 'Inquire About the Home',
    trackCta: 'placement-inquiry',
    faqs: [
      { q: 'Who is the residential group home for?', a: `Mature and young adults. ${missionFocus}` },
      { q: 'What are the requirements?', a: 'Clients must be at least 18 years of age, must have acceptable insurance, and must be willing to live with other residents. We accept ID/DD Waivers.' },
      { q: 'What is the home like?', a: `${homeIntro}. ${homeFeatureSentence}` },
      waiverFaq,
      { q: 'Where is the group home?', a: `${business.address}. We serve North Chesterfield, Chesterfield County, and the Richmond, VA area.` },
      tourFaq
    ]
  },
  'community-engagement': {
    title: 'Community Engagement',
    eyebrow: 'Hours: 9am–3pm',
    metaTitle: 'Community Engagement 9am–3pm, North Chesterfield, VA',
    metaDescription:
      'Community Engagement in North Chesterfield, VA: a service similar to day support, 9am–3pm, with community outings, volunteer work, and life coaching.',
    summary: 'A service similar to day support for individuals, 9am–3pm, with community outings, volunteer work, and life coaching.',
    bullets: ['Community outings', 'Volunteer work', 'Life coaching', 'Hours: 9am–3pm'],
    image: peopleImages.communityOuting,
    inquiryHref: '/services/community-engagement/inquiry',
    inquiryCta: 'Community Engagement Inquiry',
    trackCta: 'community-engagement-inquiry',
    faqs: [
      { q: 'What is Community Engagement?', a: 'Community Engagement is a service similar to day support for individuals.' },
      { q: 'What are the hours?', a: 'Community Engagement runs from 9am to 3pm.' },
      { q: 'What does it include?', a: 'Community outings, volunteer work, and life coaching.' },
      { q: 'Where is Community Engagement offered?', a: 'Community Engagement is offered from our North Chesterfield, VA location at 8120 Clovertree Ct.' },
      { q: 'How do I ask about Community Engagement?', a: `Submit a Community Engagement inquiry online or call ${business.phone}.` }
    ]
  }
};

export const locationSlugs = ['north-chesterfield-va', 'chesterfield-county-va', 'richmond-va'] as const;
export type LocationSlug = (typeof locationSlugs)[number];

type LocationPage = {
  title: string;
  shortName: string;
  metaTitle: string;
  metaDescription: string;
  summary: string;
  body: string[];
  feature: 'photo' | 'requirements' | 'values';
  faqs: Faq[];
};

export const locationPages: Record<LocationSlug, LocationPage> = {
  'north-chesterfield-va': {
    title: 'Residential Group Home in North Chesterfield, VA',
    shortName: 'North Chesterfield, VA',
    metaTitle: 'Group Home in North Chesterfield, VA | Beyon Vital, LLC',
    metaDescription: 'Beyon Vital, LLC is at 8120 Clovertree Ct, North Chesterfield, VA 23235: a residential group home for mature and young adults plus Community Engagement 9am–3pm.',
    summary: `Beyon Vital, LLC is located at ${business.address}, where our residential group home offers a safe and comfortable environment for mature and young adults.`,
    body: [
      homeFeatureSentence,
      'From the same North Chesterfield location we also offer Community Engagement, a service similar to day support for individuals, from 9am to 3pm, with community outings, volunteer work, and life coaching.'
    ],
    feature: 'photo',
    faqs: [
      { q: 'Where is the Beyon Vital group home in North Chesterfield?', a: `${business.address}.` },
      bedsFaq,
      waiverFaq,
      {
        q: 'Is Community Engagement offered in North Chesterfield?',
        a: 'Yes. From the same North Chesterfield location we also offer Community Engagement, a service similar to day support for individuals, from 9am to 3pm.'
      }
    ]
  },
  'chesterfield-county-va': {
    title: 'Group Home and Community Engagement for Chesterfield County, VA',
    shortName: 'Chesterfield County, VA',
    metaTitle: 'Adult Group Home for Chesterfield County, VA | Beyon Vital',
    metaDescription: 'Therapeutic, behavioral, and psycho-educational services for mature and young adults in Chesterfield County, VA, from Beyon Vital, LLC in North Chesterfield.',
    summary:
      'Beyon Vital, LLC serves Chesterfield County, VA, from our residential group home in North Chesterfield: therapeutic, behavioral, and psycho-educational support for mature and young adults. We accept ID/DD Waivers.',
    body: [
      'Our residential group home is in North Chesterfield. To ensure the comfort of staff and potential residents, clients must meet the criteria below before moving in.',
      'Our goal is to improve the lives of our clients and for our clients to receive memorable care from our team.'
    ],
    feature: 'requirements',
    faqs: [
      {
        q: 'Does Beyon Vital serve Chesterfield County?',
        a: 'Yes. Our residential group home is in North Chesterfield, and we serve individuals and families in Chesterfield County, VA.'
      },
      {
        q: 'Who can live at the group home?',
        a: 'Mature and young adults who are at least 18 years of age, have acceptable insurance, and are willing to live with other residents. We accept ID/DD Waivers.'
      },
      {
        q: 'How do I start an inquiry?',
        a: `Send an inquiry through this website or call ${business.phone}. Please do not include medical details in online forms.`
      }
    ]
  },
  'richmond-va': {
    title: 'Adult Group Home Serving the Richmond, VA Area',
    shortName: 'Richmond, VA',
    metaTitle: 'Adult Group Home Near Richmond, VA | Beyon Vital, LLC',
    metaDescription: 'Beyon Vital, LLC serves the Richmond, VA area from North Chesterfield with a residential group home and Community Engagement for mature and young adults.',
    summary:
      'Beyon Vital, LLC serves the Richmond, VA area from our residential group home in North Chesterfield: a home for mature and young adults with therapeutic, behavioral, and psycho-educational support, plus Community Engagement 9am–3pm.',
    body: [
      missionFocus,
      'Beyon Vital, LLC is to bring positivity and remarkable services into our clients lives despite their challenges.'
    ],
    feature: 'values',
    faqs: [
      { q: 'Does Beyon Vital serve the Richmond area?', a: `Yes. We serve the Richmond, VA area from our home at ${business.address}.` },
      {
        q: 'What services does Beyon Vital offer near Richmond?',
        a: 'A residential group home with therapeutic, behavioral, and psycho-educational support for mature and young adults, and Community Engagement, a service similar to day support for individuals, from 9am to 3pm.'
      },
      waiverFaq,
      tourFaq
    ]
  }
};

export const faqs: Faq[] = [
  {
    q: 'What services does Beyon Vital, LLC offer?',
    a: 'A residential group home with therapeutic, behavioral, and psycho-educational support for mature and young adults, and Community Engagement, a service similar to day support for individuals, from 9am to 3pm.'
  },
  { q: 'Who do you serve?', a: `Mature and young adults. ${missionFocus}` },
  {
    q: 'What are the requirements for the residential group home?',
    a: 'Clients must be at least 18 years of age, must have acceptable insurance, and must be willing to live with other residents. We accept ID/DD Waivers.'
  },
  {
    q: 'Which insurance is acceptable?',
    a: `Clients must have acceptable insurance. Please call ${business.phone} to ask about your coverage.`
  },
  waiverFaq,
  { q: 'What is the home like?', a: `${homeIntro}. ${homeFeatureSentence}` },
  bedsFaq,
  areasFaq,
  tourFaq,
  { q: 'What does Community Engagement include?', a: 'Community outings, volunteer work, and life coaching, from 9am to 3pm.' },
  { q: 'Where are you located?', a: `${business.address}.` },
  {
    q: 'Should I include medical information in the online form?',
    a: 'No. Please do not include medical details, diagnoses, or other health information in online forms. Share your contact details, and we can discuss specifics by phone.'
  },
  { q: 'How do I contact Beyon Vital?', a: `Call ${business.phone}, email ${business.email}, or send an inquiry through this website.` }
];
