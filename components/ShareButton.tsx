'use client';

import { useState } from 'react';

interface ShareButtonProps {
  title: string;
  text: string;
  url?: string;
  className?: string;
}

export default function ShareButton({ title, text, url, className = '' }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareUrl = url || window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl });
      } catch {
        // User cancelled or share failed — ignore
      }
      return;
    }

    // Clipboard fallback
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard not available
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className={`relative text-slate-500 hover:text-disney-blue dark:text-slate-400 dark:hover:text-disney-gold transition-colors ${className}`}
      aria-label="Share"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
      </svg>
      {copied && (
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs px-2 py-1 rounded-lg animate-fade-in">
          Link copied!
        </span>
      )}
    </button>
  );
}
