import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shopping Guide - Disney Cruise Line Onboard Shops',
  description: 'Browse onboard shops and retail stores on Disney Cruise Line. Exclusive merchandise, duty-free, and souvenirs across all 8 ships.',
  openGraph: {
    title: 'Shopping Guide - Disney Cruise Line Onboard Shops',
    description: 'Browse onboard shops and retail stores on Disney Cruise Line.',
  },
};

export default function ShoppingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
