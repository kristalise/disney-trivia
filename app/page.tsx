import Link from 'next/link';
import CategoryCard from '@/components/CategoryCard';
import { getCategories } from '@/lib/questions';
import InstallAppBanner from '@/components/InstallAppBanner';

export default async function Home() {
  const categories = await getCategories();

  return (
    <div className="space-y-12">
      {/* Install App Banner - Shown at top for new visitors */}
      <InstallAppBanner />

      {/* Hero Section */}
      <section className="text-center py-8 px-4">
        <div className="inline-block mb-4 px-4 py-2 bg-disney-gold/10 rounded-full">
          <span className="text-disney-gold font-medium">✨ 700+ Trivia Questions</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-4">
          Disney Cruise <span className="text-disney-blue dark:text-disney-gold">Trivia</span>
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8">
          Study and ace your Disney cruise trivia nights! Practice questions on movies, parks, princesses, villains, Marvel, Star Wars, and more.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/quiz"
            className="px-8 py-4 rounded-xl font-semibold btn-disney text-lg"
          >
            Start Quiz
          </Link>
          <Link
            href="/search"
            className="px-8 py-4 rounded-xl font-semibold bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white hover:border-disney-blue dark:hover:border-disney-gold transition-colors text-lg"
          >
            Search Q&A
          </Link>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Categories', value: '13', icon: '📚' },
          { label: 'Questions', value: '700+', icon: '❓' },
          { label: 'Quiz Modes', value: '3', icon: '🎮' },
          { label: 'Works Offline', value: 'Yes!', icon: '📱' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-slate-800 rounded-xl p-4 text-center shadow-sm border border-slate-200 dark:border-slate-700"
          >
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {stat.value}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              {stat.label}
            </div>
          </div>
        ))}
      </section>

      {/* Categories */}
      <section>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
          Choose a Category
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.slice(0, 8).map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
        {categories.length > 8 && (
          <div className="mt-6 text-center">
            <Link
              href="/quiz"
              className="text-disney-blue dark:text-disney-gold font-medium hover:underline"
            >
              View all {categories.length} categories →
            </Link>
          </div>
        )}
      </section>

      {/* Features */}
      <section className="bg-disney-gradient rounded-2xl p-8 text-white">
        <h2 className="text-2xl font-bold mb-6 text-center">Why Use Disney Cruise Trivia?</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: 'Multiple Quiz Modes',
              description: 'Practice mode, timed challenges, or flashcard study - learn your way.',
              icon: '🎯',
            },
            {
              title: 'Community Questions',
              description: 'Real questions from actual Disney cruise trivia nights, contributed by cruisers.',
              icon: '🚢',
            },
            {
              title: 'Works Offline',
              description: 'Install the app and study even without internet - perfect for at sea!',
              icon: '📱',
            },
          ].map((feature) => (
            <div key={feature.title} className="text-center">
              <div className="text-4xl mb-3">{feature.icon}</div>
              <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
              <p className="text-white/80 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 text-center">
          How It Works
        </h2>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { step: '1', title: 'Install App', description: 'Add to your home screen for quick access', icon: '📲' },
            { step: '2', title: 'Pick Category', description: 'Choose from 13 Disney categories', icon: '📚' },
            { step: '3', title: 'Study & Quiz', description: 'Practice with flashcards or test yourself', icon: '🧠' },
            { step: '4', title: 'Win Trivia Night!', description: 'Dominate your cruise trivia competition', icon: '🏆' },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-disney-blue dark:bg-disney-gold text-white dark:text-slate-900 rounded-full flex items-center justify-center text-xl font-bold">
                {item.step}
              </div>
              <div className="text-3xl mb-2">{item.icon}</div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-1">{item.title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contribute CTA */}
      <section className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-3">Been on a Disney Cruise?</h2>
        <p className="text-white/90 mb-6 max-w-xl mx-auto">
          Help fellow cruisers by contributing trivia questions from your experience!
          Share what you learned at trivia night.
        </p>
        <Link
          href="/contribute"
          className="inline-block px-6 py-3 rounded-xl font-semibold bg-white text-purple-600 hover:bg-purple-50 transition-colors"
        >
          Contribute a Question
        </Link>
      </section>

      {/* CTA */}
      <section className="text-center py-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
          Ready to Become a Disney Trivia Champion?
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Start with any category and track your progress as you learn!
        </p>
        <Link
          href="/quiz"
          className="inline-block px-8 py-4 rounded-xl font-semibold btn-disney text-lg"
        >
          Take a Quiz Now
        </Link>
      </section>
    </div>
  );
}
