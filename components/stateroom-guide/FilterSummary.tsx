import type { ShipName, BudgetLevel, TravelParty } from '@/lib/stateroom-types';
import { BUDGET_OPTIONS, TRAVEL_PARTY_OPTIONS } from '@/lib/stateroom-constants';

interface FilterSummaryProps {
  ship: ShipName;
  budget: BudgetLevel;
  partySize: number;
  numStaterooms: number;
  travelParty: TravelParty;
  noiseSensitive: boolean;
  needsAccessible: boolean;
  needsConnecting: boolean;
  noBunkBed: boolean;
  elderlyFriendly: boolean;
  childFriendly: boolean;
  selectedThemes: string[];
  selectedDecks: number[];
  selectedSections: string[];
  onEditStep: (step: number) => void;
  onClear: () => void;
}

function EditIcon() {
  return (
    <svg className="w-3 h-3 ml-1 opacity-50 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  );
}

export default function FilterSummary({
  ship, budget, partySize, numStaterooms, travelParty,
  noiseSensitive, needsAccessible, needsConnecting,
  noBunkBed, elderlyFriendly, childFriendly,
  selectedThemes, selectedDecks, selectedSections,
  onEditStep, onClear,
}: FilterSummaryProps) {
  const budgetOpt = BUDGET_OPTIONS.find(b => b.key === budget);
  const partyOpt = TRAVEL_PARTY_OPTIONS.find(tp => tp.key === travelParty);

  const prefPills: string[] = [];
  if (noiseSensitive) prefPills.push('Quiet');
  if (needsAccessible) prefPills.push('Accessible');
  if (needsConnecting) prefPills.push('Connecting');
  if (noBunkBed) prefPills.push('No Bunks');
  if (elderlyFriendly) prefPills.push('Elderly');
  if (childFriendly) prefPills.push('Child');
  if (selectedThemes.length === 1) prefPills.push(selectedThemes[0]);
  else if (selectedThemes.length > 1) prefPills.push(`${selectedThemes.length} Themes`);
  if (selectedDecks.length > 0) {
    prefPills.push(selectedDecks.length === 1 ? `Deck ${selectedDecks[0]}` : `${selectedDecks.length} Decks`);
  }
  if (selectedSections.length > 0) {
    prefPills.push(selectedSections.join(', '));
  }

  const pillCls = "group inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-disney-blue dark:hover:border-disney-gold hover:text-disney-blue dark:hover:text-disney-gold transition-colors cursor-pointer";
  const prefPillCls = "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-disney-blue/10 dark:bg-disney-gold/10 text-disney-blue dark:text-disney-gold";

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-lg border border-slate-200 dark:border-slate-700 mb-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Your Selections</span>
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
        >
          Start Over
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Ship */}
        <button type="button" onClick={() => onEditStep(1)} className={pillCls}>
          🚢 {ship.replace('Disney ', '')}
          <EditIcon />
        </button>

        {/* Budget */}
        <button type="button" onClick={() => onEditStep(2)} className={pillCls}>
          {budgetOpt?.emoji} {budgetOpt?.label}
          <EditIcon />
        </button>

        {/* Party */}
        <button type="button" onClick={() => onEditStep(3)} className={pillCls}>
          {partyOpt ? `${partyOpt.emoji} ` : ''}{partySize} guest{partySize !== 1 ? 's' : ''}{numStaterooms > 1 ? `, ${numStaterooms} rooms` : ''}
          {partyOpt ? ` · ${partyOpt.label}` : ''}
          <EditIcon />
        </button>

        {/* Preferences */}
        {prefPills.length > 0 ? (
          <button type="button" onClick={() => onEditStep(4)} className={pillCls}>
            {prefPills.map(p => (
              <span key={p} className={prefPillCls}>{p}</span>
            ))}
            <EditIcon />
          </button>
        ) : (
          <button type="button" onClick={() => onEditStep(4)} className={pillCls}>
            + Add preferences
          </button>
        )}
      </div>
    </div>
  );
}
