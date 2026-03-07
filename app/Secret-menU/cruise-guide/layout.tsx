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
  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Cruise Guide - Everything Onboard Disney Cruise Line',
    description: 'Browse 300+ onboard experiences across all 8 Disney ships. Dining, entertainment, activities, pools, youth clubs, spas, and shopping.',
    author: { '@type': 'Organization', name: 'Disney Cruise Trivia' },
    publisher: { '@type': 'Organization', name: 'Disney Cruise Trivia', url: 'https://www.disneytrivia.club' },
    mainEntityOfPage: 'https://www.disneytrivia.club/Secret-menU/cruise-guide',
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.disneytrivia.club' },
      { '@type': 'ListItem', position: 2, name: 'Cruise Guide', item: 'https://www.disneytrivia.club/Secret-menU' },
      { '@type': 'ListItem', position: 3, name: 'Onboard Experiences' },
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
