import Link from 'next/link';
import DeckPlanViewer from '@/components/deck-plan/DeckPlanViewer';

export const metadata = {
  title: 'Interactive Deck Plan — Disney Cruise Trivia',
  description: 'Browse Disney Cruise Line staterooms on an interactive deck plan.',
};

export default async function DeckPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ ship?: string; room?: string; deck?: string }>;
}) {
  const params = await searchParams;
  const initialShip = params.ship || undefined;
  const initialRoom = params.room ? parseInt(params.room, 10) : undefined;
  const initialDeck = params.deck ? parseInt(params.deck, 10) : undefined;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/stateroom"
          className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 text-sm mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Stateroom Lookup
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Interactive Deck Plan
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Browse staterooms visually across every ship and deck. Click a room for details.
        </p>
        <Link
          href="/stateroom/deck-plan/explore"
          className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
          View Official Deck Plans
        </Link>
      </div>

      <DeckPlanViewer
        initialShip={initialShip}
        initialRoom={isNaN(initialRoom as number) ? undefined : initialRoom}
        initialDeck={isNaN(initialDeck as number) ? undefined : initialDeck}
      />
    </div>
  );
}
