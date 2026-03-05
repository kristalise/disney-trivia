'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function ActivityRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams();
    params.set('mode', 'activities');
    const ship = searchParams.get('ship');
    const type = searchParams.get('type');
    const activity = searchParams.get('activity');
    if (ship) params.set('ship', ship);
    if (type) params.set('category', type);
    if (activity) params.set('item', activity);
    router.replace(`/Secret-menU/cruise-guide`);
  }, [router, searchParams]);

  return (
    <div className="max-w-2xl mx-auto py-12 text-center text-slate-500 dark:text-slate-400">
      Redirecting to Cruise Guide...
    </div>
  );
}

export default function ActivityExplorerPage() {
  return (
    <Suspense>
      <ActivityRedirect />
    </Suspense>
  );
}
