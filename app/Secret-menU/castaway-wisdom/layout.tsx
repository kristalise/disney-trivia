import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Castaway Club Guide - Benefits, Hidden Perks & Insider Tips',
  description: 'Complete guide to Disney Cruise Line Castaway Club membership. Official benefits, hidden perks, and insider tips for every level — First Sail, Silver, Gold, Platinum, and Pearl.',
  openGraph: {
    title: 'Castaway Club Guide - Benefits, Hidden Perks & Insider Tips',
    description: 'Complete guide to Disney Cruise Line Castaway Club membership for every level.',
  },
};

export default function CastawayWisdomLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
