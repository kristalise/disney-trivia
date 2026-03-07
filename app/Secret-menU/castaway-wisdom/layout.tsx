import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Castaway Club Guide - Benefits, Hidden Perks & Insider Tips',
  description: 'Complete guide to Disney Cruise Line Castaway Club membership. Official benefits, hidden perks, and insider tips for every level — First Sail, Silver, Gold, Platinum, and Pearl.',
  openGraph: {
    title: 'Castaway Club Guide - Benefits, Hidden Perks & Insider Tips',
    description: 'Complete guide to Disney Cruise Line Castaway Club membership for every level.',
  },
};

export default function CastawayWisdomLayout({ children }: { children: React.ReactNode }) {
  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Castaway Club Guide - Benefits, Hidden Perks & Insider Tips',
    description: 'Complete guide to Disney Cruise Line Castaway Club membership. Official benefits, hidden perks, and insider tips for every level.',
    author: { '@type': 'Organization', name: 'Disney Cruise Trivia' },
    publisher: { '@type': 'Organization', name: 'Disney Cruise Trivia', url: 'https://www.disneytrivia.club' },
    mainEntityOfPage: 'https://www.disneytrivia.club/Secret-menU/castaway-wisdom',
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.disneytrivia.club' },
      { '@type': 'ListItem', position: 2, name: 'Cruise Guide', item: 'https://www.disneytrivia.club/Secret-menU' },
      { '@type': 'ListItem', position: 3, name: 'Castaway Club Guide' },
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
