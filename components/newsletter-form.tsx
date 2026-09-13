'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui';
import { HoneypotField, useFormGuard } from '@/components/honeypot-field';
import { writeNewsletterState } from '@/lib/newsletter-client';
import { trackEvent } from '@/lib/track-client';
import { cn } from '@/lib/utils';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const FALLBACK_ERROR = 'Something went wrong. Please try again.';

type NewsletterFormProps = {
  surface: 'widget' | 'sheet' | 'footer';
  tone?: 'light' | 'dark';
  layout?: 'stacked' | 'inline';
  autoFocusEmail?: boolean;
};

export function NewsletterForm({ surface, tone = 'light', layout = 'stacked', autoFocusEmail = false }: NewsletterFormProps) {
  const pathname = usePathname();
  const id = useId();
  const emailRef = useRef<HTMLInputElement | null>(null);
  const successRef = useRef<HTMLParagraphElement | null>(null);
  const { honeypotRef, guardFields } = useFormGuard();
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (autoFocusEmail) emailRef.current?.focus();
  }, [autoFocusEmail]);

  // The form unmounts on success; keep keyboard focus inside the dialog.
  useEffect(() => {
    if (status === 'success') successRef.current?.focus();
  }, [status]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'loading') return;

    const trimmed = email.trim();
    if (!EMAIL_PATTERN.test(trimmed)) {
      setStatus('error');
      setMessage(trimmed ? 'Please enter a valid email address.' : 'Please enter your email address.');
      emailRef.current?.focus();
      return;
    }

    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed, firstName: firstName.trim() || undefined, surface, ...guardFields() })
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
      if (!res.ok) throw new Error(data.error || FALLBACK_ERROR);
      setStatus('success');
      setMessage(data.message || 'Almost done! Check your inbox for a link to confirm your subscription.');
      writeNewsletterState('subscribed');
      trackEvent({ event_type: 'form_submit', form_name: `newsletter_${surface}`, page_path: pathname || undefined });
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : FALLBACK_ERROR);
    }
  }

  const dark = tone === 'dark';
  const hasError = status === 'error';
  const statusId = `${id}-status`;
  const labelClass = cn('text-sm font-medium', dark ? 'text-white' : 'text-brand-ink');
  const optionalClass = cn('font-normal', dark ? 'text-white/65' : 'text-brand-muted');
  const inputClass = cn(
    'mt-1 w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-brand-ink outline-none transition duration-150 ease-out placeholder:text-brand-muted/60 focus:border-brand-primary focus:ring-2',
    dark ? 'focus:ring-white/40' : 'focus:ring-brand-primary/25'
  );

  return (
    <div>
      {status === 'success' ? (
        <div className={cn('rounded-2xl p-4', dark ? 'bg-white/10' : 'bg-brand-cream')}>
          <p ref={successRef} tabIndex={-1} className={cn('font-display text-2xl font-bold leading-tight outline-none', dark ? 'text-white' : 'text-brand-ink')}>
            Check your inbox
          </p>
          <p aria-hidden="true" className={cn('mt-1 text-sm leading-6', dark ? 'text-white/80' : 'text-brand-muted')}>
            {message}
          </p>
        </div>
      ) : (
        <form noValidate onSubmit={handleSubmit} aria-describedby={hasError ? statusId : undefined}>
          <HoneypotField inputRef={honeypotRef} />
          <div className={layout === 'inline' ? 'grid gap-3 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)_auto] sm:items-end' : 'space-y-3'}>
            <label htmlFor={`${id}-first-name`} className="block">
              <span className={labelClass}>
                First name <span className={optionalClass}>(optional)</span>
              </span>
              <input
                id={`${id}-first-name`}
                name="firstName"
                type="text"
                autoComplete="given-name"
                maxLength={80}
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                className={cn(inputClass, 'border-brand-ink/10')}
              />
            </label>
            <label htmlFor={`${id}-email`} className="block">
              <span className={labelClass}>Email address</span>
              <input
                ref={emailRef}
                id={`${id}-email`}
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                maxLength={254}
                placeholder="you@example.com"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (hasError) setStatus('idle');
                }}
                aria-invalid={hasError}
                aria-describedby={hasError ? statusId : undefined}
                className={cn(inputClass, hasError ? 'border-rose-400' : 'border-brand-ink/10')}
              />
            </label>
            <Button type="submit" className="w-full sm:w-auto" disabled={status === 'loading'}>
              {status === 'loading' ? 'Subscribing…' : 'Subscribe'}
            </Button>
          </div>
          <p className={cn('mt-2 text-xs leading-5', dark ? 'text-white/65' : 'text-brand-muted')}>
            We’ll email you a link to confirm. Unsubscribe anytime.
          </p>
        </form>
      )}
      <p
        id={statusId}
        role="status"
        aria-live="polite"
        className={
          hasError
            ? cn('mt-3 rounded-xl px-3 py-2 text-sm', dark ? 'bg-rose-100 text-rose-900' : 'bg-rose-50 text-rose-700')
            : 'sr-only'
        }
      >
        {hasError || status === 'success' ? message : ''}
      </p>
    </div>
  );
}
