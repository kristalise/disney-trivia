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
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.disneytrivia.club' },
      { '@type': 'ListItem', position: 2, name: 'Cruise Guide', item: 'https://www.disneytrivia.club/Secret-menU' },
      { '@type': 'ListItem', position: 3, name: 'Entertainment' },
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
