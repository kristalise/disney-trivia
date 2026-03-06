import type { BudgetLevel } from '@/lib/stateroom-types';
import { BUDGET_OPTIONS } from '@/lib/stateroom-constants';

const BUDGET_TIERS: Record<BudgetLevel, string> = {
  budget: '$',
  reasonable: '$$',
  splurge: '$$$',
  concierge: '$$$$',
};

interface BudgetStepProps {
  selected: BudgetLevel[];
  onToggle: (budget: BudgetLevel) => void;
  onSetAll: (budgets: BudgetLevel[]) => void;
  onNext: () => void;
  onBack: () => void;
  onJumpToResults?: () => void;
}

export default function BudgetStep({ selected, onToggle, onSetAll, onNext, onBack, onJumpToResults }: BudgetStepProps) {
  const allKeys = BUDGET_OPTIONS.map(o => o.key);
  const allSelected = allKeys.every(k => selected.includes(k));

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">What&apos;s your budget?</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Choose one or more stateroom tiers.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onSetAll(allSelected ? [] : allKeys)}
          className="text-xs font-medium text-disney-blue dark:text-disney-gold hover:underline whitespace-nowrap ml-4"
        >
          {allSelected ? 'Unselect All' : 'Select All'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {BUDGET_OPTIONS.map((opt) => {
          const isSelected = selected.includes(opt.key);
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => onToggle(opt.key)}
              className={`relative rounded-2xl border-2 p-5 text-center transition-all ${
                isSelected
                  ? 'border-disney-blue dark:border-disney-gold bg-disney-blue/5 dark:bg-disney-gold/5'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 bg-white dark:bg-slate-800'
              }`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <svg className="w-5 h-5 text-disney-blue dark:text-disney-gold" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
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

      {selected.length > 1 && (
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 text-center">
          {selected.length} tiers selected — results will include all selected room types
        </p>
      )}

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
            disabled={selected.length === 0}
            className="btn-disney px-6 py-2.5 rounded-xl text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
