import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fleet Info - All 8 Disney Cruise Line Ships',
  description: 'Explore the Disney Cruise Line fleet: Magic, Wonder, Dream, Fantasy, Wish, Treasure, Destiny, and Adventure. Venues, decks, and details for every ship.',
  openGraph: {
    title: 'Fleet Info - All 8 Disney Cruise Line Ships',
    description: 'Explore the Disney Cruise Line fleet — venues, decks, and details for every ship.',
  },
};

export default function ShipsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
