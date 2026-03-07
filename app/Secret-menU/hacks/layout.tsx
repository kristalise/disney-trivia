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
  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Cruise Hacks - Community-Rated Disney Cruise Tips',
    description: 'Community-rated tips, tricks, and insider hacks for Disney Cruise Line. Browse hacks by category and ship.',
    author: { '@type': 'Organization', name: 'Disney Cruise Trivia' },
    publisher: { '@type': 'Organization', name: 'Disney Cruise Trivia', url: 'https://www.disneytrivia.club' },
    mainEntityOfPage: 'https://www.disneytrivia.club/Secret-menU/hacks',
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.disneytrivia.club' },
      { '@type': 'ListItem', position: 2, name: 'Cruise Guide', item: 'https://www.disneytrivia.club/Secret-menU' },
      { '@type': 'ListItem', position: 3, name: 'Cruise Hacks' },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      {children}
    </>
  );
}
