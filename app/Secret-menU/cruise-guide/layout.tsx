import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cruise Guide - Everything Onboard Disney Cruise Line',
  description: 'Browse 300+ onboard experiences across all 8 Disney ships. Dining, entertainment, activities, pools, youth clubs, spas, and shopping — all in one guide.',
  openGraph: {
    title: 'Cruise Guide - Everything Onboard Disney Cruise Line',
    description: 'Browse 300+ onboard experiences across all 8 Disney ships.',
  },
};

export default function CruiseGuideLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
