import type { Metadata } from 'next';
import { UnsubscribeClient } from '@/app/unsubscribe/unsubscribe-client';
import { absoluteUrl } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Unsubscribe | Beyon Vital, LLC',
  description: 'Stop email updates from Beyon Vital, LLC.',
  alternates: { canonical: absoluteUrl('/unsubscribe') },
  robots: { index: false, follow: false }
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="container-shell py-16">
      <UnsubscribeClient token={params.token || ''} />
    </div>
  );
}
