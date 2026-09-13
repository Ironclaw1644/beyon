import type { ReactNode } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { StructuredData } from '@/components/structured-data';
import { IllustrativeImage } from '@/components/illustrative-image';
import { breadcrumbJsonLd } from '@/lib/site';
import { cn } from '@/lib/utils';

type Crumb = { label: string; href?: string };

export function PageHero({
  title,
  description,
  eyebrow,
  breadcrumbs,
  actions,
  image
}: {
  title: string;
  description: string;
  eyebrow?: string;
  breadcrumbs?: Crumb[];
  actions?: ReactNode;
  image?: { src: string; alt: string };
}) {
  return (
    <section className="relative overflow-hidden py-8 sm:py-12">
      {breadcrumbs ? <StructuredData data={breadcrumbJsonLd(breadcrumbs)} /> : null}
      <div className="container-shell">
        {breadcrumbs ? <Breadcrumbs items={breadcrumbs.map((crumb, index) => (index === breadcrumbs.length - 1 ? { label: crumb.label } : crumb))} /> : null}
        <div className={cn('rounded-3xl border border-white/80 bg-white/80 p-6 shadow-card backdrop-blur-sm sm:p-10', image && 'grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center')}>
          <div>
            {eyebrow ? <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-brand-primary">{eyebrow}</p> : null}
            <h1 className="max-w-4xl text-4xl font-bold leading-[1.05] text-brand-ink sm:text-6xl">{title}</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-brand-muted">{description}</p>
            {actions ? <div className="mt-6 flex flex-wrap gap-3">{actions}</div> : null}
          </div>
          {image ? (
            <IllustrativeImage src={image.src} alt={image.alt} priority className="aspect-[8/5]" sizes="(max-width: 1024px) 100vw, 40vw" />
          ) : null}
        </div>
      </div>
    </section>
  );
}
