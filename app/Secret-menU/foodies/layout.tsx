import type { Metadata } from 'next';
import faqData from '@/data/faq-data.json';

export const metadata: Metadata = {
  title: 'Dining Guide - Disney Cruise Line Restaurants & Bars',
  description: 'Complete dining guide for Disney Cruise Line. Rotational dining, specialty restaurants, quick service, bars & lounges across all 8 ships.',
  openGraph: {
    title: 'Dining Guide - Disney Cruise Line Restaurants & Bars',
    description: 'Complete dining guide for Disney Cruise Line.',
  },
};

export default function FoodiesLayout({ children }: { children: React.ReactNode }) {
  const diningTopic = faqData.topics.find(t => t.topic === 'dining');
  const faqLd = diningTopic ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: diningTopic.questions.map(q => ({
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
