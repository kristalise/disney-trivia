'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function VenueRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams();
    params.set('mode', 'venues');
    const ship = searchParams.get('ship');
    const category = searchParams.get('category');
    const ip = searchParams.get('ip');
    const venue = searchParams.get('venue');
    if (ship) params.set('ship', ship);
    if (category) params.set('category', category);
    if (ip) params.set('ip', ip);
    if (venue) params.set('item', venue);
    router.replace(`/Secret-menU/cruise-guide`);
  }, [router, searchParams]);

  return (
    <div className="max-w-2xl mx-auto py-12 text-center text-slate-500 dark:text-slate-400">
      Redirecting to Cruise Guide...
    </div>
  );
}

export default function VenueExplorerPage() {
  return (
    <Suspense>
      <VenueRedirect />
    </Suspense>
  );
}
