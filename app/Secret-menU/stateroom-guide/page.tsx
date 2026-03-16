'use client';

import { useState, useMemo, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import stateroomData from '@/data/stateroom-data.json';
import { getCategoryType } from '@/lib/stateroom-utils';
import { SHIP_ORDER } from '@/lib/ship-order';
import { isValidStateroomForShip } from '@/lib/stateroom-utils';
import { BUDGET_OPTIONS } from '@/lib/stateroom-constants';
import { filterAndScore } from '@/lib/stateroom-scoring';
import type { ShipName, BudgetLevel, TravelParty, Stateroom, VerandahViewType } from '@/lib/stateroom-types';
import WizardStepper from '@/components/stateroom-guide/WizardStepper';
import ShipStep from '@/components/stateroom-guide/ShipStep';
import BudgetStep from '@/components/stateroom-guide/BudgetStep';
import PartyStep from '@/components/stateroom-guide/PartyStep';
import PreferencesStep from '@/components/stateroom-guide/PreferencesStep';
import ResultsView from '@/components/stateroom-guide/ResultsView';
import FilterSummary from '@/components/stateroom-guide/FilterSummary';

const data = stateroomData as Record<ShipName, Stateroom[]>;

const VALID_BUDGETS: BudgetLevel[] = ['budget', 'reasonable', 'splurge', 'concierge'];

export default function StateroomGuidePageWrapper() {
  return (
    <Suspense>
      <StateroomGuidePage />
    </Suspense>
  );
}

function StateroomGuidePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Wizard state from URL
  const [selectedShip, setSelectedShip] = useState<ShipName | ''>(() => {
    const sp = searchParams.get('ship');
    return sp && SHIP_ORDER.includes(sp as ShipName) ? sp as ShipName : '';
  });

  // Multi-budget (backward compat: parse old 'budget=' single param too)
  const [budgets, setBudgets] = useState<BudgetLevel[]>(() => {
    const multi = searchParams.get('budgets');
    if (multi) return multi.split(',').filter(b => VALID_BUDGETS.includes(b as BudgetLevel)) as BudgetLevel[];
    // Backward compat: old single budget= param
    const single = searchParams.get('budget');
    if (single && VALID_BUDGETS.includes(single as BudgetLevel)) return [single as BudgetLevel];
    return [];
  });

  const [partySize, setPartySize] = useState(() => {
    const sp = searchParams.get('party');
    const n = sp ? parseInt(sp, 10) : NaN;
    return !isNaN(n) && n >= 1 && n <= 20 ? n : 2;
  });
  const [numStaterooms, setNumStaterooms] = useState(1);
  const [travelParty, setTravelParty] = useState<TravelParty>(() => {
    const sp = searchParams.get('travel');
    return sp && ['couple', 'family-kids', 'family-teens', 'family-multi', 'friends', 'solo'].includes(sp) ? sp as TravelParty : '';
  });
  const [noiseSensitive, setNoiseSensitive] = useState(() => searchParams.get('noise') === '1');
  const [needsAccessible, setNeedsAccessible] = useState(() => searchParams.get('accessible') === '1');
  const [needsConnecting, setNeedsConnecting] = useState(() => searchParams.get('connecting') === '1');
  const [noBunkBed, setNoBunkBed] = useState(() => searchParams.get('nobunk') === '1');
  const [elderlyFriendly, setElderlyFriendly] = useState(() => searchParams.get('elderly') === '1');
  const [childFriendly, setChildFriendly] = useState(() => searchParams.get('child') === '1');
  const [requiresVerandah, setRequiresVerandah] = useState(() => searchParams.get('verandah') === '1');
  const [verandahTypes, setVerandahTypes] = useState<VerandahViewType[]>(() => {
    const sp = searchParams.get('vtypes');
    if (sp) return sp.split(',').filter(v => ['ocean', 'garden', 'garden-stage', 'reef'].includes(v)) as VerandahViewType[];
    // Backward compat: old single vtype= param
    const single = searchParams.get('vtype');
    if (single && ['ocean', 'garden', 'garden-stage', 'reef'].includes(single)) return [single as VerandahViewType];
    return [];
  });

  // Multi-select themes (backward compat: parse both 'theme=' and 'themes=')
  const [selectedThemes, setSelectedThemes] = useState<string[]>(() => {
    const themesParam = searchParams.get('themes');
    if (themesParam) return themesParam.split(',').filter(Boolean);
    // Backward compat: old single theme= param
    const themeParam = searchParams.get('theme');
    if (themeParam) return [themeParam];
    return [];
  });

  // Multi-select deck/section
  const [selectedDecks, setSelectedDecks] = useState<number[]>(() => {
    const sp = searchParams.get('decks');
    if (!sp) return [];
    return sp.split(',').map(Number).filter(n => !isNaN(n));
  });
  const [selectedSections, setSelectedSections] = useState<string[]>(() => {
    const sp = searchParams.get('sections');
    if (!sp) return [];
    return sp.split(',').filter(Boolean);
  });

  const highlightRoom = useMemo(() => {
    const sp = searchParams.get('highlight');
    const n = sp ? parseInt(sp, 10) : NaN;
    return !isNaN(n) ? n : null;
  }, [searchParams]);

  // Track whether the user has ever reached results (to enable "Back to Results" shortcuts)
  const [hasSeenResults, setHasSeenResults] = useState(() => {
    return searchParams.get('step') === '5' || !!searchParams.get('highlight');
  });

  // Wizard step
  const [currentStep, setCurrentStep] = useState<number>(() => {
    const sp = searchParams.get('step');
    const n = sp ? parseInt(sp, 10) : NaN;
    if (!isNaN(n) && n >= 1 && n <= 5) return n;
    if (searchParams.get('highlight') && searchParams.get('ship') && (searchParams.get('budgets') || searchParams.get('budget'))) return 5;
    return 1;
  });

  // Stateroom lookup
  const [lookupShip, setLookupShip] = useState<ShipName | ''>('');
  const [lookupRoom, setLookupRoom] = useState('');
  const [lookupNotFound, setLookupNotFound] = useState(false);

  const hasThemes = selectedShip ? ['Disney Wish', 'Disney Treasure', 'Disney Destiny', 'Disney Adventure'].includes(selectedShip) : false;

  // Available themes for current ship + budget
  const availableThemes = useMemo(() => {
    if (!selectedShip || budgets.length === 0 || !hasThemes) return [];
    // Combine types from all selected budgets
    const budgetTypes: string[] = [];
    for (const b of budgets) {
      const types = BUDGET_OPTIONS.find(opt => opt.key === b)?.types ?? [];
      for (const t of types) {
        if (!budgetTypes.includes(t)) budgetTypes.push(t);
      }
    }
    const rooms = data[selectedShip] || [];
    const themeSet = new Set<string>();
    rooms.forEach(r => {
      const type = getCategoryType(r.category);
      if (budgetTypes.includes(type) && r.theme) themeSet.add(r.theme);
    });
    return Array.from(themeSet).sort();
  }, [selectedShip, budgets, hasThemes]);

  // Scoring & filtering
  const results = useMemo(() => {
    if (!selectedShip || budgets.length === 0) return { filtered: [], deckGroups: [], availableDecks: [] as number[], availableSections: [] as string[] };
    return filterAndScore({
      selectedShip, budgets, partySize, numStaterooms, travelParty,
      noiseSensitive, needsAccessible, needsConnecting, noBunkBed, elderlyFriendly, childFriendly,
      requiresVerandah, verandahTypes,
      selectedThemes, selectedDecks, selectedSections,
    });
  }, [selectedShip, budgets, partySize, numStaterooms, travelParty, noiseSensitive, needsAccessible, needsConnecting, noBunkBed, elderlyFriendly, childFriendly, requiresVerandah, verandahTypes, selectedThemes, selectedDecks, selectedSections]);

  // URL sync
  const syncUrl = useCallback((step: number) => {
    const params = new URLSearchParams();
    if (selectedShip) params.set('ship', selectedShip);
    if (budgets.length > 0) params.set('budgets', budgets.join(','));
    if (partySize !== 2) params.set('party', String(partySize));
    if (travelParty) params.set('travel', travelParty);
    if (noiseSensitive) params.set('noise', '1');
    if (needsAccessible) params.set('accessible', '1');
    if (needsConnecting) params.set('connecting', '1');
    if (noBunkBed) params.set('nobunk', '1');
    if (elderlyFriendly) params.set('elderly', '1');
    if (childFriendly) params.set('child', '1');
    if (requiresVerandah) params.set('verandah', '1');
    if (verandahTypes.length > 0) params.set('vtypes', verandahTypes.join(','));
    if (selectedThemes.length > 0) params.set('themes', selectedThemes.join(','));
    if (selectedDecks.length > 0) params.set('decks', selectedDecks.join(','));
    if (selectedSections.length > 0) params.set('sections', selectedSections.join(','));
    params.set('step', String(step));
    const qs = params.toString();
    window.history.replaceState({}, '', `${window.location.pathname}${qs ? '?' + qs : ''}`);
  }, [selectedShip, budgets, partySize, travelParty, noiseSensitive, needsAccessible, needsConnecting, noBunkBed, elderlyFriendly, childFriendly, requiresVerandah, verandahTypes, selectedThemes, selectedDecks, selectedSections]);

  // Generate shareable URL (without step param so recipients see results)
  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams();
    if (selectedShip) params.set('ship', selectedShip);
    if (budgets.length > 0) params.set('budgets', budgets.join(','));
    if (partySize !== 2) params.set('party', String(partySize));
    if (travelParty) params.set('travel', travelParty);
    if (noiseSensitive) params.set('noise', '1');
    if (needsAccessible) params.set('accessible', '1');
    if (needsConnecting) params.set('connecting', '1');
    if (noBunkBed) params.set('nobunk', '1');
    if (elderlyFriendly) params.set('elderly', '1');
    if (childFriendly) params.set('child', '1');
    if (requiresVerandah) params.set('verandah', '1');
    if (verandahTypes.length > 0) params.set('vtypes', verandahTypes.join(','));
    if (selectedThemes.length > 0) params.set('themes', selectedThemes.join(','));
    if (selectedDecks.length > 0) params.set('decks', selectedDecks.join(','));
    if (selectedSections.length > 0) params.set('sections', selectedSections.join(','));
    params.set('step', '5');
    const qs = params.toString();
    return `${window.location.origin}${window.location.pathname}${qs ? '?' + qs : ''}`;
  }, [selectedShip, budgets, partySize, travelParty, noiseSensitive, needsAccessible, needsConnecting, noBunkBed, elderlyFriendly, childFriendly, requiresVerandah, verandahTypes, selectedThemes, selectedDecks, selectedSections]);

  const goToStep = useCallback((step: number) => {
    setCurrentStep(step);
    if (step === 5) setHasSeenResults(true);
    syncUrl(step);
  }, [syncUrl]);

  const jumpToResults = useCallback(() => {
    if (selectedShip && budgets.length > 0) {
      goToStep(5);
    }
  }, [selectedShip, budgets, goToStep]);

  const handleShipSelect = useCallback((ship: ShipName) => {
    setSelectedShip(ship);
    setBudgets([]);
    setSelectedThemes([]);
    setSelectedDecks([]);
    setSelectedSections([]);
    setVerandahTypes([]);
  }, []);

  const handleBudgetToggle = useCallback((b: BudgetLevel) => {
    setBudgets(prev => {
      if (prev.includes(b)) return prev.filter(x => x !== b);
      return [...prev, b];
    });
    setSelectedThemes([]);
    setSelectedDecks([]);
    setSelectedSections([]);
  }, []);

  const handleNumStateroomsChange = useCallback((n: number) => {
    setNumStaterooms(n);
    if (partySize > n * 5) setPartySize(n * 5);
  }, [partySize]);

  const clearPreferences = useCallback(() => {
    setSelectedShip('');
    setBudgets([]);
    setNumStaterooms(1);
    setPartySize(2);
    setTravelParty('');
    setNoiseSensitive(false);
    setNeedsAccessible(false);
    setNeedsConnecting(false);
    setNoBunkBed(false);
    setElderlyFriendly(false);
    setChildFriendly(false);
    setRequiresVerandah(false);
    setVerandahTypes([]);
    setSelectedThemes([]);
    setSelectedDecks([]);
    setSelectedSections([]);
    setCurrentStep(1);
    setHasSeenResults(false);
    window.history.replaceState({}, '', window.location.pathname);
  }, []);

  const handleLookup = useCallback(() => {
    setLookupNotFound(false);
    const num = parseInt(lookupRoom, 10);
    if (!lookupShip || isNaN(num)) return;
    if (isValidStateroomForShip(num, lookupShip)) {
      router.push(`/Secret-menU/stateroom?ship=${encodeURIComponent(lookupShip)}&room=${num}`);
    } else {
      setLookupNotFound(true);
    }
  }, [lookupShip, lookupRoom, router]);

  const canJumpToResults = hasSeenResults && !!(selectedShip && budgets.length > 0);

  const selectCls = "w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold focus:border-transparent";

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/Secret-menU"
          className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 text-sm mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Cruise Guide
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
          Stateroom Intelligence
        </h1>
        <p className="text-sm font-medium text-disney-blue dark:text-disney-gold">
          Smart recommendations powered by our stateroom intelligence engine
        </p>
      </div>

      {/* Stateroom Lookup */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 mb-6">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">Stateroom Lookup</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Already eyeing a room? Look it up below.</p>
        <div className="flex gap-3">
          <select
            value={lookupShip}
            onChange={(e) => { setLookupShip(e.target.value as ShipName | ''); setLookupNotFound(false); }}
            className={selectCls + ' flex-1'}
          >
            <option value="">Select Ship</option>
            {SHIP_ORDER.map((ship) => (
              <option key={ship} value={ship}>{ship.replace('Disney ', '')}</option>
            ))}
          </select>
          <input
            type="text"
            inputMode="numeric"
            value={lookupRoom}
            onChange={(e) => { setLookupRoom(e.target.value.replace(/\D/g, '').slice(0, 5)); setLookupNotFound(false); }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleLookup(); }}
            placeholder="Room #"
            className="w-28 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold focus:border-transparent text-center font-mono"
          />
          <button
            type="button"
            onClick={handleLookup}
            disabled={!lookupShip || !lookupRoom}
            className="btn-disney px-4 py-3 rounded-xl whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Look Up
          </button>
        </div>
        {lookupNotFound && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">
            Room {lookupRoom} not found on {lookupShip}.
          </p>
        )}
      </div>

      {/* Wizard steps 1-4 */}
      {currentStep < 5 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 mb-6">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">Stateroom Magic</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Starting from scratch? Our wizard scores every cabin on your ship to find your perfect match — just answer a few quick questions and tell us what stateroom is available.</p>
          </div>
          <WizardStepper currentStep={currentStep} onStepClick={goToStep} />

          {currentStep === 1 && (
            <ShipStep
              selected={selectedShip}
              onSelect={handleShipSelect}
              onNext={() => goToStep(2)}
              onJumpToResults={canJumpToResults ? jumpToResults : undefined}
            />
          )}

          {currentStep === 2 && (
            <BudgetStep
              selected={budgets}
              onToggle={handleBudgetToggle}
              onSetAll={(b) => { setBudgets(b); setSelectedThemes([]); setSelectedDecks([]); setSelectedSections([]); }}
              onNext={() => goToStep(3)}
              onBack={() => goToStep(1)}
              onJumpToResults={canJumpToResults ? jumpToResults : undefined}
            />
          )}

          {currentStep === 3 && (
            <PartyStep
              numStaterooms={numStaterooms}
              partySize={partySize}
              travelParty={travelParty}
              onNumStateroomsChange={handleNumStateroomsChange}
              onPartySizeChange={setPartySize}
              onTravelPartyChange={setTravelParty}
              onNext={() => goToStep(4)}
              onSkip={() => goToStep(4)}
              onBack={() => goToStep(2)}
              onJumpToResults={canJumpToResults ? jumpToResults : undefined}
            />
          )}

          {currentStep === 4 && selectedShip && (
            <PreferencesStep
              ship={selectedShip}
              noiseSensitive={noiseSensitive}
              needsAccessible={needsAccessible}
              needsConnecting={needsConnecting}
              noBunkBed={noBunkBed}
              elderlyFriendly={elderlyFriendly}
              childFriendly={childFriendly}
              requiresVerandah={requiresVerandah}
              verandahTypes={verandahTypes}
              selectedThemes={selectedThemes}
              selectedDecks={selectedDecks}
              selectedSections={selectedSections}
              availableThemes={availableThemes}
              availableDecks={results.availableDecks}
              availableSections={results.availableSections}
              hasThemes={hasThemes}
              onNoiseSensitiveChange={setNoiseSensitive}
              onNeedsAccessibleChange={setNeedsAccessible}
              onNeedsConnectingChange={setNeedsConnecting}
              onNoBunkBedChange={setNoBunkBed}
              onElderlyFriendlyChange={setElderlyFriendly}
              onChildFriendlyChange={setChildFriendly}
              onRequiresVerandahChange={setRequiresVerandah}
              onVerandahTypesChange={setVerandahTypes}
              onThemesChange={setSelectedThemes}
              onDecksChange={setSelectedDecks}
              onSectionsChange={setSelectedSections}
              onShowResults={() => goToStep(5)}
              onSkip={() => goToStep(5)}
              onBack={() => goToStep(3)}
              onJumpToResults={canJumpToResults ? jumpToResults : undefined}
            />
          )}
        </div>
      )}

      {/* Results (step 5) */}
      {currentStep === 5 && selectedShip && budgets.length > 0 && (
        <>
          <FilterSummary
            ship={selectedShip}
            budgets={budgets}
            partySize={partySize}
            numStaterooms={numStaterooms}
            travelParty={travelParty}
            noiseSensitive={noiseSensitive}
            needsAccessible={needsAccessible}
            needsConnecting={needsConnecting}
            noBunkBed={noBunkBed}
            elderlyFriendly={elderlyFriendly}
            childFriendly={childFriendly}
            requiresVerandah={requiresVerandah}
            verandahTypes={verandahTypes}
            selectedThemes={selectedThemes}
            selectedDecks={selectedDecks}
            selectedSections={selectedSections}
            filteredCount={results.filtered.length}
            totalShipRooms={(data[selectedShip] || []).length}
            onEditStep={goToStep}
            onClear={clearPreferences}
          />

          <ResultsView
            filtered={results.filtered}
            deckGroups={results.deckGroups}
            selectedShip={selectedShip}
            highlightRoom={highlightRoom}
            shareUrl={shareUrl}
            onClearPreferences={clearPreferences}
            onEditStep={goToStep}
            budgets={budgets}
            partySize={partySize}
            numStaterooms={numStaterooms}
            travelParty={travelParty}
            noiseSensitive={noiseSensitive}
            needsAccessible={needsAccessible}
            needsConnecting={needsConnecting}
            noBunkBed={noBunkBed}
            elderlyFriendly={elderlyFriendly}
            childFriendly={childFriendly}
            selectedThemes={selectedThemes}
          />
        </>
      )}

      {/* Fallback: if on step 5 but missing ship/budget, go back */}
      {currentStep === 5 && (!selectedShip || budgets.length === 0) && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-700 text-center">
          <div className="text-4xl mb-3">🚢</div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Let&apos;s get started</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Select a ship and budget to see recommendations.</p>
          <button
            type="button"
            onClick={() => goToStep(1)}
            className="btn-disney px-6 py-2.5 rounded-xl text-sm font-medium"
          >
            Start Wizard
          </button>
        </div>
      )}

    </div>
  );
}
