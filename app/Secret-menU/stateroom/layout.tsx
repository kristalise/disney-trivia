import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Stateroom Reviews - Disney Cruise Line Cabins',
  description: 'Community reviews of Disney Cruise Line staterooms. Compare cabin categories, read ratings, and find the perfect room for your sailing.',
  openGraph: {
    title: 'Stateroom Reviews - Disney Cruise Line Cabins',
    description: 'Community reviews of Disney Cruise Line staterooms.',
  },
};

export default function StateroomLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
