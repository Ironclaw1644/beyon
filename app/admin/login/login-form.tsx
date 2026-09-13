'use client';

import Image from 'next/image';
import { Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

type LoginFormProps = {
  nextPath: string;
  initialError?: string;
};

export function AdminLoginForm({ nextPath, initialError }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError || '');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const normalized = email.trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(normalized)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!password.trim()) {
      setError('Password is required.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalized, password, next: nextPath })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Invalid email or password.');
        return;
      }
      router.push(data.next || '/admin');
      router.refresh();
    } catch {
      setError('Unable to sign in right now.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-shell py-16">
      <div className="mx-auto max-w-md rounded-3xl border border-white/80 bg-white p-6 shadow-card">
        <div className="mb-3 flex items-center gap-3">
          <Image
            src="/brand/logo.png"
            alt="Beyon Vital, LLC"
            width={44}
            height={44}
            className="h-11 w-11 rounded-full object-contain"
            priority
          />
          <p className="text-sm font-semibold tracking-tight text-brand-ink">Beyon Vital, LLC</p>
        </div>
        <h1 className="text-2xl font-semibold text-brand-ink">Admin Login</h1>
        <p className="mt-2 text-sm text-brand-muted">Sign in to access the admin dashboard.</p>

        {error ? <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

        <form onSubmit={onSubmit} className="mt-5 space-y-4" noValidate>
          <label className="block text-sm font-medium text-brand-ink">
            Email
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              required
              autoComplete="email"
              className="mt-1 w-full rounded-xl border border-brand-ink/10 px-3 py-2.5 text-sm"
            />
          </label>

          <label className="block text-sm font-medium text-brand-ink">
            Password
            <div className="relative mt-1">
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                className="w-full rounded-xl border border-brand-ink/10 px-3 py-2.5 pr-10 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-brand-muted hover:text-brand-ink"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brand-ink px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
