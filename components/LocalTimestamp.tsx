'use client';

import { useState, useEffect } from 'react';

export default function LocalTimestamp({ iso }: { iso: string }) {
  const [formatted, setFormatted] = useState('');

  useEffect(() => {
    const d = new Date(iso);
    setFormatted(
      `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
    );
  }, [iso]);

  if (!formatted) return null;

  return (
    <p className="text-slate-400 dark:text-slate-500">
      Last updated: {formatted}
      {' · '}
      <button
        onClick={() => {
          if (typeof window !== 'undefined') {
            window.location.reload();
          }
        }}
        className="underline hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
      >
        Refresh
      </button>
    </p>
  );
}
