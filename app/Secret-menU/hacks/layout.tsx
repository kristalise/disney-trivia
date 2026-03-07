import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cruise Hacks - Community-Rated Disney Cruise Tips',
  description: 'Community-rated tips, tricks, and insider hacks for Disney Cruise Line. Browse hacks by category and ship, or share your own.',
  openGraph: {
    title: 'Cruise Hacks - Community-Rated Disney Cruise Tips',
    description: 'Community-rated tips, tricks, and insider hacks for Disney Cruise Line.',
  },
};

export default function HacksLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
