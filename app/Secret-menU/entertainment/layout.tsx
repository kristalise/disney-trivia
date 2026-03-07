import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Entertainment - Disney Cruise Line Shows & Nightlife',
  description: 'Live shows, character experiences, deck parties, and nightclub lounges on Disney Cruise Line. Entertainment guide for all 8 ships.',
  openGraph: {
    title: 'Entertainment - Disney Cruise Line Shows & Nightlife',
    description: 'Live shows, character experiences, deck parties, and nightclubs on Disney Cruise Line.',
  },
};

export default function EntertainmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
