import Link from 'next/link';
import { guideLinksFor } from '@/lib/guides';
import { Section } from '@/components/ui';

/** Links from a money or hub page to the guides that bridge into it. */
export function GuideLinkList({ path, className }: { path: string; className?: string }) {
  const links = guideLinksFor(path);
  if (!links.length) return null;
  return (
    <ul className={className ?? 'grid gap-3 md:grid-cols-2'}>
      {links.map((link) => (
        <li key={link.href}>
          <Link
            href={link.href}
            className="flex h-full items-start gap-2 rounded-2xl border border-brand-ink/10 bg-white px-4 py-3 text-sm font-semibold leading-6 text-brand-primary transition duration-150 ease-out hover:border-brand-primary/40 hover:text-brand-primary-dark"
          >
            <span aria-hidden="true">→</span>
            <span>{link.label}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function GuideLinksSection({ path, title = 'Questions families ask', description }: { path: string; title?: string; description?: string }) {
  return (
    <Section
      title={title}
      description={description ?? 'Plain-language answers about Virginia’s DD waivers, day services and group homes, each checked against the official source.'}
    >
      <GuideLinkList path={path} />
    </Section>
  );
}
