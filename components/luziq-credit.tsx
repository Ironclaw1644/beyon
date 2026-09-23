'use client';

import { usePathname } from 'next/navigation';

export function LuziqCredit() {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) return null;

  return <p>Website by <a href="https://luziq.ai" className="hover:text-brand-ink">Luziq.ai</a></p>;
}
