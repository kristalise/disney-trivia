import type { Metadata } from 'next';
import faqData from '@/data/faq-data.json';

export const metadata: Metadata = {
  title: 'Stateroom Guide - Disney Cruise Line Room Categories',
  description: 'Complete guide to Disney Cruise Line stateroom categories. Inside, oceanview, verandah, and concierge rooms across all 8 ships.',
  openGraph: {
    title: 'Stateroom Guide - Disney Cruise Line Room Categories',
    description: 'Complete guide to Disney Cruise Line stateroom categories.',
  },
};

export default function StateroomGuideLayout({ children }: { children: React.ReactNode }) {
  const stateroomTopic = faqData.topics.find(t => t.topic === 'staterooms');
  const faqLd = stateroomTopic ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: stateroomTopic.questions.map(q => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: { '@type': 'Answer', text: q.answer },
    })),
  } : null;

  return (
    <>
      {faqLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
      )}
      {children}
    </>
  );
}
