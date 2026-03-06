import type { ShipName } from '@/lib/stateroom-types';
import { SHIP_ORDER } from '@/lib/ship-order';

const SHIP_LOGOS: Record<string, string> = {
  'Disney Magic': '/ship-logos/magic.png',
  'Disney Wonder': '/ship-logos/wonder.png',
  'Disney Dream': '/ship-logos/dream.png',
  'Disney Fantasy': '/ship-logos/fantasy.png',
  'Disney Wish': '/ship-logos/wish.png',
  'Disney Treasure': '/ship-logos/treasure.png',
  'Disney Destiny': '/ship-logos/destiny.png',
  'Disney Adventure': '/ship-logos/adventure.png',
};

interface ShipStepProps {
  selected: ShipName | '';
  onSelect: (ship: ShipName) => void;
  onNext: () => void;
  onJumpToResults?: () => void;
}

export default function ShipStep({ selected, onSelect, onNext, onJumpToResults }: ShipStepProps) {
  return (
    <div className="animate-fade-in">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Which ship are you sailing?</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Select your Disney Cruise Line ship.</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {SHIP_ORDER.map((ship) => {
          const isSelected = selected === ship;
          const shortName = ship.replace('Disney ', '');
          return (
            <button
              key={ship}
              type="button"
              onClick={() => onSelect(ship as ShipName)}
              className={`relative rounded-2xl overflow-hidden border-2 transition-all ${
                isSelected
                  ? 'border-disney-blue dark:border-disney-gold ring-2 ring-disney-blue/30 dark:ring-disney-gold/30 scale-[1.02]'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500'
              }`}
            >
              <div className="aspect-square relative flex items-center justify-center p-3">
                <img
                  src={SHIP_LOGOS[ship]}
                  alt={ship}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className={`px-3 py-2 text-center text-sm font-semibold ${
                isSelected
                  ? 'bg-disney-blue dark:bg-disney-gold text-white dark:text-slate-900'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}>
                {shortName}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-end gap-3">
        {onJumpToResults && (
          <button
            type="button"
            onClick={onJumpToResults}
            className="text-sm text-disney-blue dark:text-disney-gold hover:underline"
          >
            Back to Results
          </button>
        )}
        <button
          type="button"
          onClick={onNext}
          disabled={!selected}
          className="btn-disney px-6 py-2.5 rounded-xl text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}
