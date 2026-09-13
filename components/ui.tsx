import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes, MouseEventHandler, ReactNode } from 'react';

export function Section({ title, eyebrow, description, children, className, id }: { title: string; eyebrow?: string; description?: string; children?: ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={cn('py-10 sm:py-14', className)}>
      <div className="container-shell">
        <div className="mb-6 max-w-3xl">
          {eyebrow ? <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-brand-primary">{eyebrow}</p> : null}
          <h2 className="text-3xl font-bold leading-tight text-brand-ink sm:text-5xl">{title}</h2>
          {description ? <p className="mt-3 text-sm leading-7 text-brand-muted sm:text-base">{description}</p> : null}
        </div>
        {children}
      </div>
    </section>
  );
}

// Subtle lift on hover (motion-safe only); set interactive={false} for static panels.
export function Card({ children, className, interactive = true }: { children: ReactNode; className?: string; interactive?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-brand-ink/5 bg-white/90 p-5 shadow-card backdrop-blur-sm',
        interactive && 'transition duration-200 ease-out hover:shadow-card-hover motion-safe:hover:-translate-y-0.5',
        className
      )}
    >
      {children}
    </div>
  );
}

export function Button({
  href,
  children,
  variant = 'primary',
  className,
  type = 'button',
  onClick,
  disabled,
  trackCta
}: {
  href?: string;
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  onClick?: MouseEventHandler<HTMLButtonElement>;
  disabled?: ButtonHTMLAttributes<HTMLButtonElement>['disabled'];
  trackCta?: string;
}) {
  const base = cn(
    'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition duration-150 ease-out active:translate-y-0 motion-safe:hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0',
    variant === 'primary' && 'bg-brand-primary text-white shadow-sm hover:bg-brand-primary-dark hover:shadow-card',
    variant === 'secondary' && 'bg-brand-ink text-white hover:bg-brand-ink/90 hover:shadow-card',
    variant === 'ghost' && 'border border-brand-ink/15 bg-white text-brand-ink hover:border-brand-primary/40 hover:bg-brand-cream',
    className
  );

  if (href) return <Link className={base} href={href} data-track-cta={trackCta}>{children}</Link>;
  return <button type={type} className={base} onClick={onClick} disabled={disabled} data-track-cta={trackCta}>{children}</button>;
}

export function Badge({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-center rounded-full bg-brand-accent/30 px-2.5 py-1 text-xs font-semibold text-brand-ink">{children}</span>;
}
