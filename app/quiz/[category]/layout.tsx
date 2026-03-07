import type { Metadata } from 'next';
import seedData from '@/data/seed-questions.json';

const categoryMap = new Map(
  seedData.categories.map(c => [c.slug, { name: c.name, description: c.description }])
);

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const cat = categoryMap.get(category);
  if (!cat) {
    return { title: 'Disney Trivia Quiz' };
  }

  const title = `${cat.name} Trivia Quiz - Disney Cruise Trivia`;
  const description = `Test your ${cat.name} knowledge! ${cat.description}. Practice trivia questions to prepare for Disney cruise trivia night.`;

  return {
    title,
    description,
    openGraph: { title, description },
  };
}

export default function QuizCategoryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
