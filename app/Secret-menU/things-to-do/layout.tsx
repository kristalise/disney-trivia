import type { Metadata } from 'next';
import faqData from '@/data/faq-data.json';

export const metadata: Metadata = {
  title: 'Things to Do - Disney Cruise Line Activities & Recreation',
  description: 'Discover pools, water rides, sports, fitness, and youth clubs on Disney Cruise Line. Activities for every age across all 8 ships.',
  openGraph: {
    title: 'Things to Do - Disney Cruise Line Activities & Recreation',
    description: 'Discover pools, water rides, sports, fitness, and youth clubs on Disney Cruise Line.',
  },
};

export default function ThingsToDoLayout({ children }: { children: React.ReactNode }) {
  const activityTopic = faqData.topics.find(t => t.topic === 'activities');
  const faqLd = activityTopic ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: activityTopic.questions.map(q => ({
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
