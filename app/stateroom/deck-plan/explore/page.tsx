import Link from 'next/link';
import DeckPlanExplorer from '@/components/deck-plan/DeckPlanExplorer';

export const metadata = {
  title: 'Explore Official Deck Plans — Disney Cruise Trivia',
  description:
    'Pan and zoom through official Disney Cruise Line deck plan posters. Search for any stateroom number.',
};

export default async function ExploreDeckPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ ship?: string }>;
}) {
  const params = await searchParams;
  const initialShip = params.ship || undefined;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm mb-4">
          <Link
            href="/stateroom"
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Stateroom Lookup
          </Link>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <Link
            href="/stateroom/deck-plan"
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            Interactive Deck Plan
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Official Deck Plans
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Explore high-resolution official deck plan posters from Disney Cruise Line. Zoom in to see
          individual room numbers and search for specific staterooms.
        </p>
      </div>

      <DeckPlanExplorer initialShip={initialShip} />
    </div>
  );
}
