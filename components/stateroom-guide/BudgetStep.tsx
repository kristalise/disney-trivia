import type { BudgetLevel } from '@/lib/stateroom-types';
import { BUDGET_OPTIONS } from '@/lib/stateroom-constants';

const BUDGET_TIERS: Record<BudgetLevel, string> = {
  budget: '$',
  reasonable: '$$',
  splurge: '$$$',
  concierge: '$$$$',
};

interface BudgetStepProps {
  selected: BudgetLevel | '';
  onSelect: (budget: BudgetLevel) => void;
  onNext: () => void;
  onBack: () => void;
  onJumpToResults?: () => void;
}

export default function BudgetStep({ selected, onSelect, onNext, onBack, onJumpToResults }: BudgetStepProps) {
  return (
    <div className="animate-fade-in">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">What&apos;s your budget?</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Choose a stateroom category tier.</p>

      <div className="grid grid-cols-2 gap-3">
        {BUDGET_OPTIONS.map((opt) => {
          const isSelected = selected === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => onSelect(opt.key)}
              className={`relative rounded-2xl border-2 p-5 text-center transition-all ${
                isSelected
                  ? 'border-disney-blue dark:border-disney-gold bg-disney-blue/5 dark:bg-disney-gold/5'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 bg-white dark:bg-slate-800'
              }`}
            >
              <div className="text-3xl mb-2">{opt.emoji}</div>
              <div className={`text-base font-bold mb-1 ${
                isSelected ? 'text-disney-blue dark:text-disney-gold' : 'text-slate-900 dark:text-white'
              }`}>
                {opt.label}
              </div>
              <div className="text-xs text-slate-400 dark:text-slate-500 mb-2">
                {opt.types.join(' / ')}
              </div>
              <div className={`text-sm font-bold ${
                isSelected ? 'text-disney-blue dark:text-disney-gold' : 'text-slate-500 dark:text-slate-400'
              }`}>
                {BUDGET_TIERS[opt.key]}
              </div>
            </button>
          );
        })}
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
    </div>
  );
}
