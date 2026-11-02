/**
 * One-question-per-page guides for families and support coordinators
 * (People Also Ask questions and the day-support / DD waiver searches around
 * Chesterfield and Richmond, VA). Linked from /faq, the home page, the service
 * pages and the location pages.
 *
 * Rules for this file:
 * - Every statement about Virginia waivers, licensing or regulations is backed
 *   by one of the page's `sources`, read on the date in `reviewed`.
 * - `atBeyon` uses only facts already in docs/claims.md: no licensure, waiver
 *   enrollment details, staffing, hours of the residence, prices or capacity
 *   beyond "4 beds". Never say Beyon Vital's Community Engagement is the waiver
 *   service of that name; the client describes it as "similar to day support".
 * - Use person-first language ("an adult with a disability").
 */

export type Source = { label: string; url: string };
export type GuideLink = { href: string; label: string };
export type GuideSection = { heading: string; paragraphs?: string[]; items?: string[] };

export type Guide = {
  slug: string;
  question: string;
  /** Short label for link lists. */
  label: string;
  metaTitle: string;
  metaDescription: string;
  /** Opens by restating the question; quotable on its own. */
  answer: string;
  sections: GuideSection[];
  /** What this means at Beyon Vital, from facts in docs/claims.md only. */
  atBeyon: string;
  moneyLinks: GuideLink[];
  related: string[];
  sources: Source[];
  reviewed: string;
};

const lis = (path: string) => `https://law.lis.virginia.gov/${path}`;

const SRC = {
  r30: { label: '12VAC30-122-30, Waiver populations; single waiver enrollment', url: lis('admincode/title12/agency30/chapter122/section30/') },
  r240: { label: '12VAC30-122-240, Services covered in the Building Independence Waiver', url: lis('admincode/title12/agency30/chapter122/section240/') },
  r250: { label: '12VAC30-122-250, Services covered in the Community Living Waiver', url: lis('admincode/title12/agency30/chapter122/section250/') },
  r260: { label: '12VAC30-122-260, Services covered in the Family and Individual Support Waiver', url: lis('admincode/title12/agency30/chapter122/section260/') },
  r310: { label: '12VAC30-122-310, Community coaching service', url: lis('admincode/title12/agency30/chapter122/section310/') },
  r320: { label: '12VAC30-122-320, Community engagement service', url: lis('admincode/title12/agency30/chapter122/section320/') },
  r380: { label: '12VAC30-122-380, Group day service', url: lis('admincode/title12/agency30/chapter122/section380/') },
  r390: { label: '12VAC30-122-390, Group home residential service', url: lis('admincode/title12/agency30/chapter122/section390/') },
  r530: { label: '12VAC30-122-530, Sponsored residential service', url: lis('admincode/title12/agency30/chapter122/section530/') },
  lic20: { label: '12VAC35-105-20, Definitions (DBHDS licensing rules)', url: lis('admincode/title12/agency35/chapter105/section20/') },
  code63: { label: 'Code of Virginia § 63.2-100, Definitions (assisted living facility)', url: lis('vacode/title63.2/chapter1/section63.2-100/') },
  afc10: { label: '22VAC30-120-10, Definitions (Adult Services Approved Providers)', url: lis('admincode/title22/agency30/chapter120/section10/') },
  dssAlf: { label: 'Virginia Department of Social Services: Assisted Living Facilities', url: 'https://www.dss.virginia.gov/licensed-care/assisted-living-facilities-alf/' },
  dmasDd: { label: 'Virginia DMAS: Developmental Disability (DD) Waivers', url: 'https://www.dmas.virginia.gov/for-members/benefits-and-services/waivers/developmental-disability-dd-waivers/' },
  dbhdsSsg: { label: 'DBHDS: Service Selection Guide for DD Waivers (11.19.25)', url: 'https://dbhds.virginia.gov/wp-content/uploads/2026/01/Service-Selection-Guide-for-DD-Waivers_11.19.25_final.pdf' },
  dbhdsNav: { label: 'DBHDS: Navigating the Developmental Disability Waivers', url: 'https://dbhds.virginia.gov/assets/MyLifeMyCommunity/Publications-and-Partner-Documents/Navigating%20the%20DD%20Waivers.pdf' },
  vacsb: { label: 'Virginia Association of Community Services Boards: CSB/BHA directory', url: 'https://vacsb.org/csb-bha-directory/' },
  chesterfieldDd: { label: 'Chesterfield County: Developmental Disability Services', url: 'https://www.chesterfield.gov/900/Developmental-Disability-Services' }
} satisfies Record<string, Source>;

export const GUIDE_SOURCES = SRC;

const REVIEWED = '2026-11-02';

const CE_PAGE: GuideLink = { href: '/services/community-engagement', label: 'Community Engagement at Beyon Vital, 9am–3pm' };
const CE_INQUIRY: GuideLink = { href: '/services/community-engagement/inquiry', label: 'Send a Community Engagement inquiry' };
const HOME_PAGE: GuideLink = { href: '/services/residential-group-home', label: 'Our residential group home in North Chesterfield' };
const WAIVER_PAGE: GuideLink = { href: '/dd-waiver-group-home-richmond-va', label: 'ID/DD waiver group home near Richmond, VA' };
const REQUIREMENTS: GuideLink = { href: '/requirements', label: 'Group home requirements' };
const CHESTERFIELD: GuideLink = { href: '/locations/chesterfield-county-va', label: 'Group home in Chesterfield County, VA' };

export const guides: Guide[] = [
  {
    slug: 'what-is-community-engagement-in-virginia',
    question: 'What is Community Engagement for adults with disabilities in Virginia?',
    label: 'What Community Engagement is',
    metaTitle: 'What Is Community Engagement? Virginia DD Waiver Guide',
    metaDescription:
      'Community Engagement in Virginia’s DD waivers: what the service covers, where it must take place, group sizes, the weekly hour limit, and which waivers pay.',
    answer:
      'Community Engagement is a Virginia DD waiver service that helps a person with a developmental disability build the skills to take part in everyday community life: social skills, independence, volunteering, community events and personal choices. Under 12VAC30-122-320 it takes place out in the community, not in a licensed residential or day setting or the person’s own home, in groups of no more than three people with at least one direct support professional. The Community Living, Family and Individual Supports and Building Independence waivers all cover it.',
    sections: [
      {
        heading: 'What the service covers',
        paragraphs: [
          'Virginia’s rule describes Community Engagement as a service that helps a person acquire, keep or improve the skills needed for positive social behavior, interpersonal competence, greater independence, employability and personal choice, so they can use the same parts of community life as anyone else. It may include community education or training and volunteer activities.',
          'Activities happen at naturally occurring times and in ordinary community settings, where the person can spend time with people without disabilities other than paid staff. Allowed activities, as written into the person’s plan for supports, include:'
        ],
        items: [
          'Taking part in activities, public events and educational events in the community',
          'Volunteer experiences',
          'Keeping in touch with family and friends',
          'Building independence in activities of daily living',
          'Self-advocacy and communication skills',
          'Learning to get around the community, including by public transportation'
        ]
      },
      {
        heading: 'Where and how it is delivered',
        paragraphs: [
          'Apart from time spent planning activities, Community Engagement must be delivered in the community. It may not take place in a licensed residential or day setting or in the person’s own home.',
          'Groups are limited to three people with at least one direct support professional. Planning time with the group counts for no more than 10% of the person’s authorized hours each month. The service is billed by the hour.'
        ]
      },
      {
        heading: 'Hours and providers',
        paragraphs: [
          'Community Engagement, alone or combined with group day service, community coaching, workplace assistance or supported employment, cannot exceed 66 hours a week.',
          'A provider billing the waiver for Community Engagement must be licensed by the Department of Behavioral Health and Developmental Services (DBHDS) for non-center-based day support and must have a participation agreement with Virginia Medicaid (DMAS).'
        ]
      },
      {
        heading: 'Community coaching: the one-to-one option',
        paragraphs: [
          'Community coaching is for a person who needs one-to-one support to work through specific barriers that keep them from joining Community Engagement. It is always one staff member to one person, and all three DD waivers cover it.'
        ]
      }
    ],
    atBeyon:
      'Beyon Vital’s Community Engagement is a service similar to day support for individuals. It runs from 9am to 3pm and includes community outings, volunteer work and life coaching. Call (804) 366-3442 or send an inquiry to ask whether it fits your plan.',
    moneyLinks: [CE_PAGE, CE_INQUIRY],
    related: ['community-engagement-vs-day-support-in-virginia', 'how-many-hours-of-day-services-does-the-dd-waiver-cover'],
    sources: [SRC.r320, SRC.r310, SRC.r250, SRC.r260, SRC.r240, SRC.dbhdsSsg],
    reviewed: REVIEWED
  },
  {
    slug: 'community-engagement-vs-day-support-in-virginia',
    question: 'What is the difference between Community Engagement and day support in Virginia?',
    label: 'Community Engagement vs. day support',
    metaTitle: 'Community Engagement vs. Day Support in Virginia',
    metaDescription:
      'Day support (group day) and Community Engagement compared under Virginia’s DD waiver rules: setting, group size, staffing, licenses and the shared 66-hour cap.',
    answer:
      'What families usually call day support is billed in Virginia’s DD waivers as group day service, and its providers must hold a DBHDS day support license. It builds self-help, social and community skills, typically in a nonresidential setting, with at least one staff member for every seven people. Community Engagement is about taking part in community life: it must happen out in the community, not in a licensed day or residential setting or at home, in groups of three or fewer. All three DD waivers cover both, and they share one 66-hour weekly limit.',
    sections: [
      {
        heading: 'Group day service (day support)',
        paragraphs: [
          'Group day service helps a person acquire, keep or improve skills of self-help, socialization, community integration, career planning and adaptation, through peer interaction and time in the community. It is typically offered in a nonresidential setting, on a regular schedule, in places separate from the person’s home. Skill-building is part of the service unless the person has a documented progressive condition, in which case it can focus on keeping skills and slowing regression.',
          'Providers of group day service must hold a DBHDS day support or community-based day support license.'
        ]
      },
      {
        heading: 'Community Engagement',
        paragraphs: [
          'Community Engagement uses the community as the learning environment: volunteering, public events, educational events and keeping up relationships. Other than planning time, it is delivered in the community and not in a licensed residential or day setting or the person’s home. Providers must be licensed by DBHDS for non-center-based day support.'
        ]
      },
      {
        heading: 'Side by side',
        items: [
          'Setting: group day is typically offered in a nonresidential setting, separate from the person’s home; Community Engagement takes place out in the community.',
          'Group size: group day needs at least one staff member for every seven people; Community Engagement groups are three people or fewer, with at least one direct support professional.',
          'Waivers: Community Living, Family and Individual Supports, and Building Independence cover both.',
          'Hours: both count toward the same 66-hour weekly limit, together with community coaching, workplace assistance and supported employment.',
          'License: group day needs a day support or community-based day support license; Community Engagement needs a non-center-based day support license.'
        ]
      },
      {
        heading: 'What “day support” means in Virginia licensing',
        paragraphs: [
          'DBHDS licensing rules define day support service as structured programs of training, assistance and specialized supervision that help adults with a developmental disability gain, keep or improve self-help, social and adaptive skills, in nonresidential community-based settings. The definition excludes services whose main purpose is employment, general education or general recreation.'
        ]
      }
    ],
    atBeyon:
      'Beyon Vital describes its Community Engagement as a service similar to day support for individuals. It runs from 9am to 3pm, with community outings, volunteer work and life coaching. Call (804) 366-3442 to ask how it compares with the day options in your plan.',
    moneyLinks: [CE_PAGE, CE_INQUIRY],
    related: ['what-is-community-engagement-in-virginia', 'how-many-hours-of-day-services-does-the-dd-waiver-cover'],
    sources: [SRC.r380, SRC.r320, SRC.lic20, SRC.dbhdsSsg],
    reviewed: REVIEWED
  },
  {
    slug: 'how-many-hours-of-day-services-does-the-dd-waiver-cover',
    question: 'How many hours a week of day services can a DD waiver cover in Virginia?',
    label: 'Weekly hour limit for day services',
    metaTitle: 'How Many Hours of Day Services Does a VA DD Waiver Cover?',
    metaDescription:
      'Virginia DD waivers cap day services at 66 hours a week combined: Community Engagement, community coaching, group day and supported employment. What counts.',
    answer:
      'Up to 66 hours a week. Virginia’s DD waiver rules set one combined weekly limit for Community Engagement, community coaching, group day service, workplace assistance and supported employment: alone or together, they cannot exceed 66 hours per week. Community Engagement, community coaching and group day are each billed by the hour, and the hours a person receives are the ones set out in their plan for supports.',
    sections: [
      {
        heading: 'Which services share the 66 hours',
        items: ['Community Engagement', 'Community coaching', 'Group day service', 'Workplace assistance', 'Supported employment']
      },
      {
        heading: 'Other limits worth knowing',
        items: [
          'Community Engagement planning time with the group is capped at 10% of the person’s authorized hours each month.',
          'Group day service runs one or more hours a day, on a regular schedule, one or more days a week, in places separate from the person’s home.',
          'When group day staff ride along to and from the program, that time can be billed as group day only up to 25% of the person’s time in group day that day.'
        ]
      },
      {
        heading: 'Living in a group home and going to a day service',
        paragraphs: [
          'The Community Living waiver’s list of covered services includes group home residential service as well as Community Engagement, community coaching and group day service. Which of them a person receives is set in their plan for supports. Because Community Engagement cannot take place in the person’s residence or in a licensed residential setting, Community Engagement hours for someone who lives in a group home are spent out in the community.'
        ]
      }
    ],
    atBeyon:
      'Beyon Vital runs a residential group home in North Chesterfield and offers Community Engagement from 9am to 3pm. We accept ID/DD Waivers. Call (804) 366-3442 to ask how our services could fit with the rest of your plan.',
    moneyLinks: [CE_PAGE, HOME_PAGE],
    related: ['community-engagement-vs-day-support-in-virginia', 'what-is-community-engagement-in-virginia'],
    sources: [SRC.r320, SRC.r310, SRC.r380, SRC.r250],
    reviewed: REVIEWED
  },
  {
    slug: 'what-does-id-dd-waiver-mean-in-virginia',
    question: 'What does “ID/DD waiver” mean in Virginia?',
    label: 'What “ID/DD waiver” means',
    metaTitle: 'What Does ID/DD Waiver Mean in Virginia?',
    metaDescription:
      'ID/DD waiver refers to Virginia’s Medicaid waivers for people with intellectual and developmental disabilities, now named CL, FIS and BI. What each one covers.',
    answer:
      '“ID/DD waiver” refers to Virginia’s Medicaid waivers for people with intellectual and developmental disabilities. Virginia used to run an Intellectual Disability (ID) Waiver, an Individual and Family Developmental Disabilities Support Waiver and a Day Support Waiver. After a redesign approved in 2016, the three Developmental Disability (DD) Waivers are called Community Living (CL), Family and Individual Supports (FIS) and Building Independence (BI).',
    sections: [
      {
        heading: 'The three DD waivers today',
        items: [
          'Building Independence (BI): for adults 18 and older who can live mostly independently and do not need supports all the time. People usually own, lease or control their own living arrangements.',
          'Family and Individual Supports (FIS): for children and adults who may live with family, friends or in their own homes. Some need functional, behavioral or medical supports.',
          'Community Living (CL): for children and adults who usually need supports in their homes all the time. Some need to live in a home with staff who support functional skills or complex medical or behavioral needs.'
        ]
      },
      {
        heading: 'Which waiver covers a group home',
        paragraphs: [
          'Group home residential service is covered in the Community Living waiver. Sponsored residential service, another residential option, is also a Community Living waiver service. Community Engagement and group day service are covered in all three waivers.'
        ]
      },
      {
        heading: 'Who qualifies and how to apply',
        paragraphs: [
          'The DD waivers serve people, including children, with a developmental disability as defined in § 37.2-100 of the Code of Virginia who need the level of care provided in an intermediate care facility for individuals with intellectual disabilities (ICF/IID). A person can be enrolled in only one waiver at a time.',
          'Virginia Medicaid runs the DD waivers jointly with DBHDS. There is a waiting list, and slots are assigned by urgency of need. To apply, contact your local Community Services Board (CSB).'
        ]
      },
      {
        heading: 'Where the old names came from',
        items: [
          'Early 1991: Virginia began its waiver for persons with intellectual disability, later renamed the Intellectual Disability (ID) Waiver.',
          '2000: the Individual and Family Developmental Disabilities Support Waiver began, for people with developmental disabilities who did not meet the ID Waiver’s criteria.',
          '2005: the Day Support Waiver began, focused on day support and employment.',
          '2016: the redesigned waivers were approved and renamed Community Living, Family and Individual Supports, and Building Independence.'
        ]
      }
    ],
    atBeyon:
      'Beyon Vital accepts ID/DD Waivers. Our residential group home in North Chesterfield is for adults who are at least 18 years of age, have acceptable insurance and are willing to live with other residents. Call (804) 366-3442 to ask which services we can provide for you.',
    moneyLinks: [WAIVER_PAGE, REQUIREMENTS],
    related: ['how-to-apply-for-the-dd-waiver-in-chesterfield-county', 'group-home-vs-sponsored-residential-in-virginia'],
    sources: [SRC.dbhdsNav, SRC.dmasDd, SRC.r30, SRC.r250, SRC.r390],
    reviewed: REVIEWED
  },
  {
    slug: 'group-home-vs-assisted-living-in-virginia',
    question: 'What is the difference between a group home and assisted living in Virginia?',
    label: 'Group home vs. assisted living',
    metaTitle: 'Group Home vs. Assisted Living in Virginia',
    metaDescription:
      'Group homes and assisted living facilities in Virginia are licensed by different agencies under different rules. How size, licensing and funding differ.',
    answer:
      'In Virginia, group homes and assisted living facilities are licensed by different agencies under different rules. DBHDS licenses group homes and defines one as a community-based home with eight or fewer residents and 24-hour supervision. An assisted living facility is a congregate setting caring for four or more adults who are aged, infirm or have disabilities. The Department of Social Services licenses it, and settings licensed by DBHDS fall outside that definition.',
    sections: [
      {
        heading: 'Group homes (DBHDS)',
        paragraphs: [
          'DBHDS licensing rules define a group home or community residential service as a congregate service providing 24-hour supervision in a community-based home with eight or fewer residents. Services include supervision, supports, counseling and training in activities of daily living, based on each person’s individualized services plan.',
          'When the Community Living waiver pays for group home residential service, Medicaid pays only in homes with no more than six licensed beds. Larger homes that became DD waiver providers before March 31, 2021 may keep operating under that rule.'
        ]
      },
      {
        heading: 'Assisted living facilities (Department of Social Services)',
        paragraphs: [
          'Virginia law defines an assisted living facility as a congregate residential setting that provides or coordinates personal and health care services, 24-hour supervision and assistance for four or more adults who are aged or infirm or who have disabilities. Facilities licensed by DBHDS or the State Board of Health are excluded from that definition.',
          'The Department of Social Services notes that assisted living facilities are not nursing homes. Nursing homes are regulated by the Virginia Department of Health.'
        ]
      },
      {
        heading: 'A third option: adult foster care',
        paragraphs: [
          'Adult foster care is room and board, supervision and special services in the provider’s own home, for up to three adults. Caring for more than three adults requires an assisted living license from the Department of Social Services.'
        ]
      },
      {
        heading: 'Questions to ask any home',
        items: ['Which agency licenses this home, and for which service?', 'How many people live here?', 'Which waiver services, if any, can you provide for my family member?']
      }
    ],
    atBeyon:
      'Beyon Vital is a residential group home in North Chesterfield, VA, with 4 beds in 3 bedrooms, for mature and young adults who are at least 18 and willing to live with other residents. We accept ID/DD Waivers.',
    moneyLinks: [HOME_PAGE, REQUIREMENTS],
    related: ['what-is-adult-foster-care-in-virginia', 'group-home-vs-sponsored-residential-in-virginia'],
    sources: [SRC.lic20, SRC.r390, SRC.code63, SRC.dssAlf, SRC.afc10],
    reviewed: REVIEWED
  },
  {
    slug: 'what-is-adult-foster-care-in-virginia',
    question: 'What is adult foster care in Virginia?',
    label: 'What adult foster care is',
    metaTitle: 'What Is Adult Foster Care in Virginia?',
    metaDescription:
      'Adult foster care in Virginia: room, board and supervision in a provider’s own home for up to three adults, approved by the local department of social services.',
    answer:
      'Adult foster care in Virginia is room and board, supervision and special services for an adult with a physical or mental condition, given in the provider’s own home. One provider can care for up to three adults, and the provider is approved by the local department of social services. Caring for more than three adults requires an assisted living facility license from the Virginia Department of Social Services.',
    sections: [
      {
        heading: 'Who sets the rules',
        paragraphs: [
          'The standards are in 22VAC30-120, Adult Services Approved Providers, from the Department for Aging and Rehabilitative Services. A local department-approved provider is one that a local department of social services approves to give in-home or adult foster care services to adults.'
        ]
      },
      {
        heading: 'Adult foster care and the DD waivers',
        paragraphs: [
          'Virginia’s group home residential service, a Community Living waiver service, can be provided to a person living in a group home or in the home of an adult foster care provider. For adults, the provider must either be licensed by DBHDS for group home residential service or be approved by the local department of social services as an adult foster care provider.'
        ]
      },
      {
        heading: 'How it compares',
        items: [
          'Adult foster care: up to three adults in the provider’s own home, approved by the local department of social services.',
          'Sponsored residential: up to two people living in the home of a family or individual (the sponsor), under the supervision of a DBHDS-licensed provider.',
          'Group home: a DBHDS-licensed community-based home with eight or fewer residents.',
          'Assisted living facility: four or more adults, licensed by the Department of Social Services.'
        ]
      }
    ],
    atBeyon:
      'Beyon Vital runs a residential group home in North Chesterfield, VA: 4 beds in 3 bedrooms, for adults who are at least 18 years of age. We accept ID/DD Waivers.',
    moneyLinks: [HOME_PAGE, REQUIREMENTS],
    related: ['group-home-vs-assisted-living-in-virginia', 'group-home-vs-sponsored-residential-in-virginia'],
    sources: [SRC.afc10, SRC.r390, SRC.r530, SRC.lic20, SRC.code63],
    reviewed: REVIEWED
  },
  {
    slug: 'group-home-vs-sponsored-residential-in-virginia',
    question: 'What is the difference between a group home and sponsored residential in Virginia?',
    label: 'Group home vs. sponsored residential',
    metaTitle: 'Group Home vs. Sponsored Residential in Virginia',
    metaDescription:
      'Group home residential and sponsored residential are both Community Living waiver services in Virginia. Who provides support, home size and how to choose.',
    answer:
      'Group homes and sponsored residential are both residential services in Virginia’s Community Living waiver. In sponsored residential, a person lives in the home of a family or individual (the sponsor) who provides support under the supervision of a DBHDS-licensed provider, with no more than two people supported in one home. Group home residential service is provided by paid staff in a DBHDS-licensed home, and Medicaid pays for it only in homes with no more than six licensed beds.',
    sections: [
      {
        heading: 'Sponsored residential',
        paragraphs: [
          'Sponsored residential service is skill-building, routine supports, general supports and safety supports provided in the home of a sponsor, a family or person who supports the individual under a DBHDS-licensed provider. It is authorized only when the person-centered planning process finds it necessary, and it can serve up to two people in the same home.'
        ]
      },
      {
        heading: 'Group home residential',
        paragraphs: [
          'Group home residential service is skill-building, routine supports, general supports and safety supports that help a person live successfully in the community, provided by paid staff who are physically present. It is billed by the day and paid at a tier based on the person’s assessed level of support and the home’s licensed bed capacity. Homes must meet the federal home and community-based settings rules, and lease or residency agreements must support the person’s choice of service and setting.',
          'Medicaid pays for group home residential service only in homes with no more than six licensed beds, except for larger homes that became DD waiver providers before March 31, 2021.'
        ]
      },
      {
        heading: 'Other places to live with a DD waiver',
        items: [
          'Supported living: an apartment setting run by a DBHDS-licensed provider, with staff available around the clock (FIS and CL waivers).',
          'Shared living: a person lives in their own home with a roommate who gets a Medicaid-funded stipend toward rent, food and utilities in exchange for minimal supports (all three waivers).',
          'In-home supports: support in the person’s or family’s home and in the community (FIS and CL waivers).',
          'Independent living supports: skill-building toward a self-sustaining independent living situation, for adults (BI waiver).'
        ]
      },
      {
        heading: 'Choosing',
        paragraphs: [
          'Your support coordinator can give you a list of local services and providers. The DBHDS guide adds that if you are thinking about living somewhere with five or more people, such as a group home, your support coordinator will ask a Regional Support Team to review the decision so that you have all the information you need.'
        ]
      }
    ],
    atBeyon:
      'Beyon Vital’s residential group home in North Chesterfield, VA, has 4 beds in 3 bedrooms, 1 1/2 bathrooms, a TV area and an outdoor sitting area. We accept ID/DD Waivers.',
    moneyLinks: [HOME_PAGE, WAIVER_PAGE],
    related: ['group-home-vs-assisted-living-in-virginia', 'what-does-id-dd-waiver-mean-in-virginia'],
    sources: [SRC.r530, SRC.r390, SRC.r250, SRC.dbhdsSsg],
    reviewed: REVIEWED
  },
  {
    slug: 'how-to-apply-for-the-dd-waiver-in-chesterfield-county',
    question: 'How do I apply for the DD waiver in Chesterfield County, VA?',
    label: 'Applying for the DD waiver in Chesterfield',
    metaTitle: 'How to Apply for the DD Waiver in Chesterfield County, VA',
    metaDescription:
      'Apply for the DD waiver in Chesterfield County, VA through the Chesterfield Community Services Board. Intake numbers, who qualifies, and the Richmond options.',
    answer:
      'To apply for the DD waiver in Chesterfield County, contact the Chesterfield Community Services Board (CSB). Virginia Medicaid directs DD waiver applications to your local CSB, and the Chesterfield CSB serves Chesterfield County, including ZIP code 23235 in North Chesterfield. For Developmental Disability Services, call 804-717-6642 and press one to schedule an intake meeting, or press two for the intake coordinator.',
    sections: [
      {
        heading: 'Who to call',
        items: [
          'Chesterfield County Developmental Disability Services: 804-717-6642 (press one to schedule an intake meeting, press two to speak with the intake coordinator).',
          'Chesterfield Community Services Board main line: (804) 748-1227.',
          'City of Richmond residents: Richmond Behavioral Health Authority, 107 S. Fifth St., Richmond, (804) 819-4000.',
          'Henrico, New Kent and Charles City County residents: Henrico Area Mental Health and Developmental Services, (804) 727-8515.'
        ]
      },
      {
        heading: 'What Chesterfield’s Developmental Disability Services offers',
        paragraphs: [
          'The county describes flexible, individualized supports for children and adults with developmental disabilities: developmental services for infants and toddlers from birth to age 3, community integration opportunities for adults, residential supports for adults, and training and support for people aged 11 to adult.'
        ]
      },
      {
        heading: 'Who qualifies',
        paragraphs: [
          'The DD waivers serve people, including children, with a developmental disability as defined in § 37.2-100 of the Code of Virginia who need the level of care provided in an intermediate care facility for individuals with intellectual disabilities (ICF/IID). Virginia keeps a waiting list, and slots are assigned by urgency of need.'
        ]
      },
      {
        heading: 'After a waiver slot is assigned',
        paragraphs: [
          'A support coordinator helps you choose services and providers and can give you a list of local options. DBHDS also lists providers on the My Life, My Community website, and the Center for Family Involvement (877-567-1122) connects families with others who have waiver services.'
        ]
      }
    ],
    atBeyon:
      'Beyon Vital’s residential group home is at 8120 Clovertree Ct, North Chesterfield, VA 23235, and we accept ID/DD Waivers. Ask your support coordinator about us, or call (804) 366-3442.',
    moneyLinks: [WAIVER_PAGE, CHESTERFIELD],
    related: ['what-does-id-dd-waiver-mean-in-virginia', 'group-home-vs-sponsored-residential-in-virginia'],
    sources: [SRC.vacsb, SRC.chesterfieldDd, SRC.dmasDd, SRC.r30, SRC.dbhdsSsg],
    reviewed: REVIEWED
  }
];

export const guidePath = (slug: string) => `/faq/${slug}`;

export function getGuide(slug: string) {
  return guides.find((guide) => guide.slug === slug);
}

/** Which guides each money or hub page links to, most relevant first. */
export const guidesFor: Record<string, string[]> = {
  '/': guides.map((guide) => guide.slug),
  '/faq': guides.map((guide) => guide.slug),
  '/resources': guides.map((guide) => guide.slug),
  '/services/community-engagement': [
    'what-is-community-engagement-in-virginia',
    'community-engagement-vs-day-support-in-virginia',
    'how-many-hours-of-day-services-does-the-dd-waiver-cover'
  ],
  '/services/residential-group-home': [
    'group-home-vs-assisted-living-in-virginia',
    'group-home-vs-sponsored-residential-in-virginia',
    'what-is-adult-foster-care-in-virginia',
    'what-does-id-dd-waiver-mean-in-virginia'
  ],
  '/requirements': ['what-does-id-dd-waiver-mean-in-virginia', 'how-to-apply-for-the-dd-waiver-in-chesterfield-county'],
  '/locations/north-chesterfield-va': ['how-to-apply-for-the-dd-waiver-in-chesterfield-county', 'community-engagement-vs-day-support-in-virginia'],
  '/locations/chesterfield-county-va': ['how-to-apply-for-the-dd-waiver-in-chesterfield-county', 'group-home-vs-assisted-living-in-virginia'],
  '/locations/richmond-va': ['what-does-id-dd-waiver-mean-in-virginia', 'group-home-vs-sponsored-residential-in-virginia']
};

export function guideLinksFor(path: string) {
  return (guidesFor[path] || []).map((slug) => {
    const guide = getGuide(slug);
    if (!guide) throw new Error(`Unknown guide slug ${slug} for ${path}`);
    return { href: guidePath(slug), label: guide.question };
  });
}
