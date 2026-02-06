'use client';

import { useState } from 'react';

export default function EmailSignup() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage('You\'re on the list! We\'ll notify you when login is available.');
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="bg-disney-gradient py-8 mt-12">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <div className="text-3xl mb-3">🔔</div>
        <h3 className="text-xl font-bold text-white mb-2">
          Want to Save Your Progress Across Devices?
        </h3>
        <p className="text-white/80 text-sm mb-4">
          Be the first to know when we launch the login feature to sync your trivia progress everywhere!
        </p>

        {status === 'success' ? (
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-white">
            <span className="text-2xl mr-2">✨</span>
            {message}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="flex-1 px-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="px-6 py-3 rounded-xl font-medium bg-disney-gold text-disney-blue hover:bg-yellow-400 transition-colors disabled:opacity-50"
            >
              {status === 'loading' ? 'Joining...' : 'Notify Me'}
            </button>
          </form>
        )}

        {status === 'error' && (
          <p className="mt-3 text-red-200 text-sm">{message}</p>
        )}

        <p className="text-white/60 text-xs mt-4">
          No spam, just one email when the feature launches.
        </p>
      </div>
    </div>
  );
}
