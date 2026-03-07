import type { Metadata } from 'next';
import faqData from '@/data/faq-data.json';

export const metadata: Metadata = {
  title: 'Disney Cruise Q&A - Questions Answered by the Community',
  description: 'Get answers to your Disney Cruise Line questions. Curated FAQs on dining, staterooms, activities, and more — plus community Q&A from experienced cruisers.',
  openGraph: {
    title: 'Disney Cruise Q&A - Questions Answered by the Community',
    description: 'Get answers to your Disney Cruise Line questions.',
  },
};

export default function QALayout({ children }: { children: React.ReactNode }) {
  // FAQPage JSON-LD from curated content
  const faqEntries = faqData.topics.flatMap(topic =>
    topic.questions.map(q => ({
      '@type': 'Question' as const,
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer' as const,
        text: q.answer,
      },
    }))
  );

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqEntries,
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.disneytrivia.club' },
      { '@type': 'ListItem', position: 2, name: 'Cruise Guide', item: 'https://www.disneytrivia.club/Secret-menU' },
      { '@type': 'ListItem', position: 3, name: 'Q&A' },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      {children}
    </>
  );
}
