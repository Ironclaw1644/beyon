'use client';

import { usePathname } from 'next/navigation';

export function LuziqCredit() {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) return null;

  return (
    <p>
      Website powered by{' '}
      <a
        href="https://luziq.ai/"
        target="_blank"
        rel="noreferrer"
        className="transition duration-150 ease-out hover:text-brand-ink hover:underline hover:underline-offset-4"
      >
        Luziq
      </a>
    </p>
  );
}
