import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Venue Directory - Disney Cruise Line Onboard Spaces',
  description: 'Browse 153 onboard venues across 8 Disney ships. Restaurants, bars, pools, theaters, lounges, and kids clubs — all with community reviews.',
  openGraph: {
    title: 'Venue Directory - Disney Cruise Line Onboard Spaces',
    description: 'Browse 153 onboard venues across 8 Disney ships.',
  },
};

export default function VenuesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
