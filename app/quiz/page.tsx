import CategoryCard from '@/components/CategoryCard';
import { getCategories } from '@/lib/questions';

export const metadata = {
  title: 'Choose Quiz Category - Disney Trivia',
  description: 'Select a category to start your Disney trivia quiz',
};

export default async function QuizPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Choose Your Quiz Category
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Select a topic to start your trivia challenge
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {categories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>

      {/* Quiz Mode Info */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 text-center">
          Quiz Modes Available
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              mode: 'Practice',
              description: 'Answer at your own pace. See explanations immediately after each question.',
              icon: '📝',
              recommended: true,
            },
            {
              mode: 'Timed Challenge',
              description: 'Race against the clock! Submit answers before time runs out.',
              icon: '⏱️',
              recommended: false,
            },
            {
              mode: 'Study Mode',
              description: 'Flashcard-style learning. See question, reveal answer when ready.',
              icon: '📚',
              recommended: false,
            },
          ].map((item) => (
            <div
              key={item.mode}
              className={`bg-white dark:bg-slate-800 rounded-xl p-5 border-2 ${
                item.recommended
                  ? 'border-disney-gold'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              {item.recommended && (
                <span className="inline-block px-2 py-1 bg-disney-gold/10 text-disney-gold text-xs font-medium rounded-full mb-2">
                  Recommended
                </span>
              )}
              <div className="text-2xl mb-2">{item.icon}</div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                {item.mode}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
