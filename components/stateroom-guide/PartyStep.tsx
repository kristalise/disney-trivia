import type { TravelParty } from '@/lib/stateroom-types';
import { TRAVEL_PARTY_OPTIONS } from '@/lib/stateroom-constants';

interface PartyStepProps {
  numStaterooms: number;
  partySize: number;
  travelParty: TravelParty;
  onNumStateroomsChange: (n: number) => void;
  onPartySizeChange: (n: number) => void;
  onTravelPartyChange: (tp: TravelParty) => void;
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
  onJumpToResults?: () => void;
}

export default function PartyStep({
  numStaterooms, partySize, travelParty,
  onNumStateroomsChange, onPartySizeChange, onTravelPartyChange,
  onNext, onSkip, onBack, onJumpToResults,
}: PartyStepProps) {
  const maxPartyForRooms = numStaterooms * 5;

  const counterBtn = "w-9 h-9 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-lg";

  return (
    <div className="animate-fade-in">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Who&apos;s coming along?</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Tell us about your travel party.</p>

      {/* Staterooms & Party Size — side by side */}
      <div className="flex gap-4 mb-5">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Staterooms</label>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => onNumStateroomsChange(Math.max(1, numStaterooms - 1))} disabled={numStaterooms <= 1} className={counterBtn}>-</button>
            <span className="w-6 text-center text-lg font-bold text-slate-900 dark:text-white">{numStaterooms}</span>
            <button type="button" onClick={() => onNumStateroomsChange(Math.min(4, numStaterooms + 1))} disabled={numStaterooms >= 4} className={counterBtn}>+</button>
          </div>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Party Size</label>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => onPartySizeChange(Math.max(1, partySize - 1))} disabled={partySize <= 1} className={counterBtn}>-</button>
            <span className="w-6 text-center text-lg font-bold text-slate-900 dark:text-white">{partySize}</span>
            <button type="button" onClick={() => onPartySizeChange(Math.min(maxPartyForRooms, partySize + 1))} disabled={partySize >= maxPartyForRooms} className={counterBtn}>+</button>
          </div>
        </div>
      </div>
      {numStaterooms > 1 && (
        <p className="text-xs text-slate-400 dark:text-slate-500 -mt-4 mb-5">
          ~{Math.ceil(partySize / numStaterooms)} per room across {numStaterooms} staterooms
        </p>
      )}

      {/* Travel Party */}
      <div className="mb-2">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Who&apos;s Traveling?</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {TRAVEL_PARTY_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => onTravelPartyChange(travelParty === opt.key ? '' : opt.key)}
              className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors text-left ${
                travelParty === opt.key
                  ? 'bg-disney-blue text-white border-disney-blue dark:bg-disney-gold dark:text-slate-900 dark:border-disney-gold'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
              }`}
            >
              <span className="mr-1">{opt.emoji}</span> {opt.label}
              <span className={`block text-[10px] mt-0.5 ${
                travelParty === opt.key
                  ? 'text-white/70 dark:text-slate-900/60'
                  : 'text-slate-400 dark:text-slate-500'
              }`}>{opt.hint}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          Back
        </button>
        <div className="flex items-center gap-3">
          {!onJumpToResults && (
            <button
              type="button"
              onClick={onSkip}
              className="text-sm text-slate-500 dark:text-slate-400 hover:underline"
            >
              Skip
            </button>
          )}
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
            className="btn-disney px-6 py-2.5 rounded-xl text-sm font-medium"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
