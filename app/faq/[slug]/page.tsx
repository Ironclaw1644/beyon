import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { StructuredData } from '@/components/structured-data';
import { Section, Card, Button } from '@/components/ui';
import { business } from '@/lib/content';
import { getGuide, guidePath, guides } from '@/lib/guides';
import { breadcrumbJsonLd, buildMetadata } from '@/lib/site';

export const dynamicParams = false;

export function generateStaticParams() {
  return guides.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return {};
  const branded = `${guide.metaTitle} | Beyon Vital`;
  return buildMetadata({ title: branded.length <= 60 ? branded : guide.metaTitle, description: guide.metaDescription, path: guidePath(slug) });
}

const REVIEWED_LABEL = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();
  const path = guidePath(slug);
  const crumbs = [{ label: 'Home', href: '/' }, { label: 'FAQ', href: '/faq' }, { label: guide.label, href: path }];
  const related = guide.related.map((s) => getGuide(s)).filter((g): g is NonNullable<typeof g> => Boolean(g));

  return (
    <>
      <StructuredData data={breadcrumbJsonLd(crumbs)} />
      <section className="py-8 sm:py-12">
        <div className="container-shell">
          <Breadcrumbs items={[crumbs[0], crumbs[1], { label: guide.label }]} />
          <article className="rounded-3xl border border-white/80 bg-white/80 p-6 shadow-card backdrop-blur-sm sm:p-10">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-brand-primary">Family questions · Virginia</p>
            <h1 className="max-w-4xl text-3xl font-bold leading-tight text-brand-ink sm:text-5xl">{guide.question}</h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-brand-ink sm:text-lg">{guide.answer}</p>
            <p className="mt-4 text-xs text-brand-muted">
              Checked against the official sources listed below on {REVIEWED_LABEL(guide.reviewed)}. This page is general information, not legal or benefits advice.
            </p>
          </article>
        </div>
      </section>

      <div className="container-shell">
        <div className="max-w-3xl space-y-10 pb-4">
          {guide.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-2xl font-bold leading-tight text-brand-ink sm:text-3xl">{section.heading}</h2>
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph.slice(0, 40)} className="mt-3 text-base leading-8 text-brand-muted">{paragraph}</p>
              ))}
              {section.items ? (
                <ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-7 text-brand-muted">
                  {section.items.map((item) => <li key={item.slice(0, 40)}>{item}</li>)}
                </ul>
              ) : null}
            </section>
          ))}
        </div>
      </div>

      <Section title="At Beyon Vital">
        <Card interactive={false} className="max-w-3xl">
          <p className="text-base leading-8 text-brand-ink">{guide.atBeyon}</p>
          <ul className="mt-4 space-y-2">
            {guide.moneyLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="font-semibold text-brand-primary underline hover:text-brand-primary-dark">{link.label}</Link>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button href={business.phoneHref} trackCta="call">Call {business.phone}</Button>
            <Button href="/contact" variant="ghost">Contact us</Button>
          </div>
        </Card>
      </Section>

      {related.length ? (
        <Section title="Related questions">
          <ul className="grid max-w-3xl gap-3">
            {related.map((item) => (
              <li key={item.slug}>
                <Link href={guidePath(item.slug)} className="font-semibold text-brand-primary underline hover:text-brand-primary-dark">{item.question}</Link>
              </li>
            ))}
            <li>
              <Link href="/faq" className="font-semibold text-brand-primary underline hover:text-brand-primary-dark">All questions about Beyon Vital</Link>
            </li>
          </ul>
        </Section>
      ) : null}

      <Section title="Sources">
        <ol className="max-w-3xl list-decimal space-y-2 pl-5 text-sm leading-6 text-brand-muted">
          {guide.sources.map((source) => (
            <li key={source.url}>
              <a href={source.url} className="underline hover:text-brand-ink" rel="noopener" target="_blank">{source.label}</a>
            </li>
          ))}
        </ol>
      </Section>
    </>
  );
}
