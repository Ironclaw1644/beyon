import type { Faq } from '@/lib/content';

export function FaqList({ items }: { items: Faq[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <details key={item.q} className="group rounded-2xl border border-brand-ink/10 bg-white p-4 shadow-card transition duration-200 ease-out hover:shadow-card-hover">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-brand-ink [&::-webkit-details-marker]:hidden">
            <span>{item.q}</span>
            <span aria-hidden="true" className="text-brand-primary transition-transform duration-200 ease-out group-open:rotate-45">+</span>
          </summary>
          <p className="mt-2 text-sm leading-7 text-brand-muted">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
