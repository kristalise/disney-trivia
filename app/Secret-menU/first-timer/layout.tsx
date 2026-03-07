import type { Metadata } from 'next';
import firstTimerData from '@/data/first-timer-data.json';

export const metadata: Metadata = {
  title: "First-Timer's Guide to Disney Cruise Line",
  description: 'Everything you need to know for your first Disney cruise. Embarkation tips, dining guide, stateroom advice, activities, port days, and debarkation — all from experienced cruisers.',
  openGraph: {
    title: "First-Timer's Guide to Disney Cruise Line",
    description: 'Everything you need to know for your first Disney cruise.',
  },
};

export default function FirstTimerLayout({ children }: { children: React.ReactNode }) {
  // Build FAQPage JSON-LD from the curated Q&A content
  const faqEntries = firstTimerData.sections.flatMap(section =>
    section.items.map(item => ({
      '@type': 'Question' as const,
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer' as const,
        text: item.answer,
      },
    }))
  );

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqEntries,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      {children}
    </>
  );
}
