import type { ShipName, VerandahViewType } from '@/lib/stateroom-types';
import { THEME_COLORS, themeWithEmoji } from '@/lib/stateroom-constants';

interface PreferencesStepProps {
  ship: ShipName;
  noiseSensitive: boolean;
  needsAccessible: boolean;
  needsConnecting: boolean;
  noBunkBed: boolean;
  elderlyFriendly: boolean;
  childFriendly: boolean;
  requiresVerandah: boolean;
  verandahTypes: VerandahViewType[];
  selectedThemes: string[];
  selectedDecks: number[];
  selectedSections: string[];
  availableThemes: string[];
  availableDecks: number[];
  availableSections: string[];
  hasThemes: boolean;
  onNoiseSensitiveChange: (v: boolean) => void;
  onNeedsAccessibleChange: (v: boolean) => void;
  onNeedsConnectingChange: (v: boolean) => void;
  onNoBunkBedChange: (v: boolean) => void;
  onElderlyFriendlyChange: (v: boolean) => void;
  onChildFriendlyChange: (v: boolean) => void;
  onRequiresVerandahChange: (v: boolean) => void;
  onVerandahTypesChange: (v: VerandahViewType[]) => void;
  onThemesChange: (v: string[]) => void;
  onDecksChange: (v: number[]) => void;
  onSectionsChange: (v: string[]) => void;
  onShowResults: () => void;
  onSkip: () => void;
  onBack: () => void;
  onJumpToResults?: () => void;
}

const VERANDAH_VIEW_OPTIONS: { key: VerandahViewType; label: string; emoji: string; hint: string }[] = [
  { key: 'ocean', label: 'Ocean View', emoji: '🌊', hint: 'Overlooks the ocean' },
  { key: 'garden', label: 'Garden View', emoji: '🌿', hint: 'Overlooks Imagination Garden' },
  { key: 'reef', label: 'Reef View', emoji: '🐠', hint: 'Overlooks Discovery Reef' },
];

export default function PreferencesStep({
  ship,
  noiseSensitive, needsAccessible, needsConnecting,
  noBunkBed, elderlyFriendly, childFriendly,
  requiresVerandah, verandahTypes,
  selectedThemes, selectedDecks, selectedSections,
  availableThemes, availableDecks, availableSections, hasThemes,
  onNoiseSensitiveChange, onNeedsAccessibleChange, onNeedsConnectingChange,
  onNoBunkBedChange, onElderlyFriendlyChange, onChildFriendlyChange,
  onRequiresVerandahChange, onVerandahTypesChange,
  onThemesChange, onDecksChange, onSectionsChange,
  onShowResults, onSkip, onBack, onJumpToResults,
}: PreferencesStepProps) {
  const toggleDeck = (d: number) => {
    if (selectedDecks.includes(d)) {
      onDecksChange(selectedDecks.filter(x => x !== d));
    } else {
      onDecksChange([...selectedDecks, d].sort((a, b) => a - b));
    }
  };

  const toggleSection = (s: string) => {
    if (selectedSections.includes(s)) {
      onSectionsChange(selectedSections.filter(x => x !== s));
    } else {
      onSectionsChange([...selectedSections, s]);
    }
  };

  const toggleTheme = (theme: string) => {
    if (selectedThemes.includes(theme)) {
      onThemesChange(selectedThemes.filter(t => t !== theme));
    } else {
      onThemesChange([...selectedThemes, theme]);
    }
  };

  const defaultThemeColor = { bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-700 dark:text-purple-300' };

  return (
    <div className="animate-fade-in">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Any preferences?</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Fine-tune your results (optional).</p>

      {/* Checkboxes */}
      <div className="mb-5 space-y-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={noiseSensitive}
            onChange={(e) => onNoiseSensitiveChange(e.target.checked)}
            className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-disney-blue dark:text-disney-gold focus:ring-disney-blue dark:focus:ring-disney-gold"
          />
          <div>
            <span className="text-sm font-medium text-slate-900 dark:text-white">Noise sensitive</span>
            <span className="block text-xs text-slate-500 dark:text-slate-400">Prefer midship, middle deck rooms</span>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={needsAccessible}
            onChange={(e) => onNeedsAccessibleChange(e.target.checked)}
            className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-disney-blue dark:text-disney-gold focus:ring-disney-blue dark:focus:ring-disney-gold"
          />
          <div>
            <span className="text-sm font-medium text-slate-900 dark:text-white">Accessible room needed</span>
            <span className="block text-xs text-slate-500 dark:text-slate-400">Wheelchair accessible staterooms only</span>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={needsConnecting}
            onChange={(e) => onNeedsConnectingChange(e.target.checked)}
            className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-disney-blue dark:text-disney-gold focus:ring-disney-blue dark:focus:ring-disney-gold"
          />
          <div>
            <span className="text-sm font-medium text-slate-900 dark:text-white">Connecting room needed</span>
            <span className="block text-xs text-slate-500 dark:text-slate-400">Rooms that connect to an adjacent stateroom</span>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={noBunkBed}
            onChange={(e) => onNoBunkBedChange(e.target.checked)}
            className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-disney-blue dark:text-disney-gold focus:ring-disney-blue dark:focus:ring-disney-gold"
          />
          <div>
            <span className="text-sm font-medium text-slate-900 dark:text-white">No bunk beds</span>
            <span className="block text-xs text-slate-500 dark:text-slate-400">Exclude rooms with bunk beds</span>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={elderlyFriendly}
            onChange={(e) => onElderlyFriendlyChange(e.target.checked)}
            className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-disney-blue dark:text-disney-gold focus:ring-disney-blue dark:focus:ring-disney-gold"
          />
          <div>
            <span className="text-sm font-medium text-slate-900 dark:text-white">Elderly friendly</span>
            <span className="block text-xs text-slate-500 dark:text-slate-400">Prefer midship, lower decks, no upper berths</span>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={childFriendly}
            onChange={(e) => onChildFriendlyChange(e.target.checked)}
            className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-disney-blue dark:text-disney-gold focus:ring-disney-blue dark:focus:ring-disney-gold"
          />
          <div>
            <span className="text-sm font-medium text-slate-900 dark:text-white">Child friendly</span>
            <span className="block text-xs text-slate-500 dark:text-slate-400">Near kids areas, safer room types, themed rooms</span>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={requiresVerandah}
            onChange={(e) => {
              onRequiresVerandahChange(e.target.checked);
              if (!e.target.checked) onVerandahTypesChange([]);
            }}
            className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-disney-blue dark:text-disney-gold focus:ring-disney-blue dark:focus:ring-disney-gold"
          />
          <div>
            <span className="text-sm font-medium text-slate-900 dark:text-white">Requires verandah</span>
            <span className="block text-xs text-slate-500 dark:text-slate-400">Only show rooms with a private verandah (balcony)</span>
          </div>
        </label>
      </div>

      {/* Disney Adventure verandah view type (multi-select) */}
      {requiresVerandah && ship === 'Disney Adventure' && (
        <div className="mb-5">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Verandah view type
            {verandahTypes.length > 0
              ? <span className="text-xs font-normal text-slate-400 dark:text-slate-500 ml-1">({verandahTypes.length} selected)</span>
              : <span className="text-xs font-normal text-slate-400 dark:text-slate-500 ml-1">(all views)</span>
            }
          </label>
          <div className="grid grid-cols-3 gap-2">
            {VERANDAH_VIEW_OPTIONS.map((opt) => {
              const isSelected = verandahTypes.includes(opt.key as VerandahViewType);
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      onVerandahTypesChange(verandahTypes.filter(v => v !== opt.key));
                    } else {
                      onVerandahTypesChange([...verandahTypes, opt.key as VerandahViewType]);
                    }
                  }}
                  className={`px-3 py-3 rounded-xl text-xs font-medium border transition-colors text-center ${
                    isSelected
                      ? 'bg-disney-blue text-white border-disney-blue dark:bg-disney-gold dark:text-slate-900 dark:border-disney-gold'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
                  }`}
                >
                  <span className="text-lg block mb-1">{opt.emoji}</span>
                  {opt.label}
                  <span className={`block text-[10px] mt-0.5 ${
                    isSelected ? 'text-white/70 dark:text-slate-900/60' : 'text-slate-400 dark:text-slate-500'
                  }`}>{opt.hint}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Theme multi-select toggle buttons */}
      {hasThemes && availableThemes.length > 0 && (
        <div className="mb-5">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Theme {selectedThemes.length > 0
              ? <span className="text-xs font-normal text-slate-400 dark:text-slate-500">({selectedThemes.length} selected)</span>
              : <span className="text-xs font-normal text-slate-400 dark:text-slate-500">(all themes)</span>
            }
          </label>
          <div className="flex flex-wrap gap-1.5">
            {availableThemes.map((theme) => {
              const isSelected = selectedThemes.includes(theme);
              const colors = THEME_COLORS[theme] || defaultThemeColor;
              return (
                <button
                  key={theme}
                  type="button"
                  onClick={() => toggleTheme(theme)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                    isSelected
                      ? `${colors.bg} ${colors.text} border-current`
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
                  }`}
                >
                  {themeWithEmoji(theme)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Deck multi-select */}
      {availableDecks.length > 0 && (
        <div className="mb-5">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Deck {selectedDecks.length > 0 && <span className="text-xs font-normal text-slate-400 dark:text-slate-500">({selectedDecks.length} selected)</span>}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {availableDecks.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => toggleDeck(d)}
                className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                  selectedDecks.includes(d)
                    ? 'bg-disney-blue text-white border-disney-blue dark:bg-disney-gold dark:text-slate-900 dark:border-disney-gold'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Section multi-select */}
      {availableSections.length > 0 && (
        <div className="mb-5">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Section</label>
          <div className="flex gap-1.5">
            {availableSections.map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => toggleSection(sec)}
                className={`flex-1 px-2 py-3 rounded-xl text-xs font-medium border transition-colors ${
                  selectedSections.includes(sec)
                    ? 'bg-disney-blue text-white border-disney-blue dark:bg-disney-gold dark:text-slate-900 dark:border-disney-gold'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
                }`}
              >
                {sec}
              </button>
            ))}
          </div>
        </div>
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
          {!onJumpToResults && (
            <button
              type="button"
              onClick={onSkip}
              className="text-sm text-slate-500 dark:text-slate-400 hover:underline"
            >
              Skip
            </button>
          )}
          <button
            type="button"
            onClick={onJumpToResults || onShowResults}
            className="btn-disney px-6 py-2.5 rounded-xl text-sm font-medium"
          >
            {onJumpToResults ? 'Update Results' : 'Show Results'}
          </button>
        </div>
      </div>
    </div>
  );
}
