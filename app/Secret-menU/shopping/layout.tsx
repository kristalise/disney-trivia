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
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.disneytrivia.club' },
      { '@type': 'ListItem', position: 2, name: 'Cruise Guide', item: 'https://www.disneytrivia.club/Secret-menU' },
      { '@type': 'ListItem', position: 3, name: 'Shopping Guide' },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      {children}
    </>
  );
}
