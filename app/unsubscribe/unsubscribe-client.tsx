'use client';

import { useState } from 'react';
import { business } from '@/lib/content';

export function UnsubscribeClient({ token }: { token: string }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleUnsubscribe() {
    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to unsubscribe');
      setStatus('success');
      setMessage('You have been unsubscribed from email updates.');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Unable to unsubscribe');
    }
  }

  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-brand-ink/10 bg-white p-6 shadow-card">
      <h1 className="text-4xl font-bold text-brand-ink">Unsubscribe</h1>
      <p className="mt-2 text-sm text-brand-muted">Use the button below to stop email updates from {business.name}.</p>
      {!token ? (
        <p className="mt-3 text-sm text-brand-muted">
          This link is missing its unsubscribe token. Use the link from your email, or write to{' '}
          <a href={`mailto:${business.email}`} className="font-semibold text-brand-primary hover:text-brand-primary-dark">{business.email}</a>.
        </p>
      ) : null}
      <button
        onClick={handleUnsubscribe}
        disabled={status === 'loading' || status === 'success' || !token}
        className="mt-6 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white transition duration-150 ease-out hover:bg-brand-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === 'loading' ? 'Unsubscribing...' : 'Confirm Unsubscribe'}
      </button>
      <p role="status" aria-live="polite" className={`mt-4 text-sm ${status === 'success' ? 'text-emerald-800' : 'text-rose-800'}`}>{message}</p>
    </div>
  );
}
