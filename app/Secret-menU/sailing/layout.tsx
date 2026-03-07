import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sailing Log - Disney Cruise Line Voyages',
  description: 'Log and review your Disney Cruise Line sailings. Track your voyage history, Castaway Club level, and share reviews.',
  openGraph: {
    title: 'Sailing Log - Disney Cruise Line Voyages',
    description: 'Log and review your Disney Cruise Line sailings.',
  },
};

export default function SailingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
