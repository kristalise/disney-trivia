'use client';

import { useState } from 'react';

interface CompanionPlannerItem {
  item_type: string;
  item_id: string;
}

interface CompanionChecklistItem {
  category: string;
  label: string;
}

export interface CompanionPlan {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  handle: string | null;
  role: 'owner' | 'guest';
  planner_items: CompanionPlannerItem[];
  planner_summary: string;
  pre_cruise_items: CompanionChecklistItem[];
  pre_cruise_summary: string;
  adventure_rotation: number | null;
}

interface TravelPartyPanelProps {
  companions: CompanionPlan[];
  loading: boolean;
  isAdventure: boolean;
  onDuplicate: (sourceUserId: string, options: { planner: boolean; checklist: boolean; rotation: boolean }) => Promise<{ planner_items: number; checklist_items: number; rotation: number | null }>;
  duplicating: string | null;
  lookupItem: (itemType: string, itemId: string) => { name: string; category: string; emoji: string };
}

const CATEGORY_LABELS: Record<string, string> = {
  items_to_purchase: 'Items to Purchase',
  items_to_pack: 'Items to Pack',
  pixie_dust_prep: 'Pixie Dust Prep',
  fish_extender: 'Fish Extender',
};

export default function TravelPartyPanel({
  companions,
  loading,
  isAdventure,
  onDuplicate,
  duplicating,
  lookupItem,
}: TravelPartyPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copyModal, setCopyModal] = useState<CompanionPlan | null>(null);
  const [copyPlanner, setCopyPlanner] = useState(true);
  const [copyChecklist, setCopyChecklist] = useState(true);
  const [copyRotation, setCopyRotation] = useState(true);
  const [copyResult, setCopyResult] = useState<{ planner_items: number; checklist_items: number; rotation: number | null } | null>(null);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 mb-4">
        <div className="flex items-center gap-2 animate-pulse">
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      </div>
    );
  }

  if (companions.length === 0) return null;

  const expanded = companions.find(c => c.user_id === expandedId);

  // Group planner items by type for expanded view
  function groupByType(items: CompanionPlannerItem[]) {
    const groups: Record<string, CompanionPlannerItem[]> = {};
    for (const item of items) {
      if (!groups[item.item_type]) groups[item.item_type] = [];
      groups[item.item_type].push(item);
    }
    return groups;
  }

  // Group checklist items by category
  function groupByCategory(items: CompanionChecklistItem[]) {
    const groups: Record<string, CompanionChecklistItem[]> = {};
    for (const item of items) {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    }
    return groups;
  }

  const handleCopy = async () => {
    if (!copyModal) return;
    const result = await onDuplicate(copyModal.user_id, {
      planner: copyPlanner,
      checklist: copyChecklist,
      rotation: copyRotation,
    });
    setCopyResult(result);
  };

  const closeCopyModal = () => {
    setCopyModal(null);
    setCopyResult(null);
    setCopyPlanner(true);
    setCopyChecklist(true);
    setCopyRotation(true);
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-4 overflow-hidden">
        {/* Header — avatar row + label */}
        <div className="px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {companions.map(c => (
                <button
                  key={c.user_id}
                  type="button"
                  onClick={() => setExpandedId(expandedId === c.user_id ? null : c.user_id)}
                  className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${
                    expandedId === c.user_id
                      ? 'border-disney-blue dark:border-disney-gold ring-2 ring-disney-blue/30 dark:ring-disney-gold/30 z-10'
                      : 'border-white dark:border-slate-800 hover:scale-110'
                  } ${c.avatar_url ? '' : 'bg-disney-blue/10 dark:bg-disney-gold/10 text-disney-blue dark:text-disney-gold'}`}
                  title={c.display_name}
                >
                  {c.avatar_url ? (
                    <img src={c.avatar_url} alt={c.display_name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    c.display_name.charAt(0).toUpperCase()
                  )}
                </button>
              ))}
            </div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Travel Party ({companions.length})
            </span>
          </div>
        </div>

        {/* Expanded companion detail */}
        {expanded && (
          <div className="border-t border-slate-100 dark:border-slate-700 px-5 py-4">
            {/* Companion card header */}
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                expanded.avatar_url ? '' : 'bg-disney-blue/10 dark:bg-disney-gold/10 text-disney-blue dark:text-disney-gold'
              }`}>
                {expanded.avatar_url ? (
                  <img src={expanded.avatar_url} alt={expanded.display_name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  expanded.display_name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{expanded.display_name}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                    expanded.role === 'owner'
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}>
                    {expanded.role === 'owner' ? 'Owner' : 'Guest'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {expanded.planner_summary} &middot; {expanded.pre_cruise_summary}
                  {expanded.adventure_rotation !== null && ` \u00b7 Rotation ${expanded.adventure_rotation}`}
                </p>
              </div>
              <button
                type="button"
                disabled={expanded.planner_items.length === 0 && expanded.pre_cruise_items.length === 0 && expanded.adventure_rotation === null}
                onClick={() => {
                  setCopyModal(expanded);
                  setCopyResult(null);
                }}
                className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium bg-disney-blue/10 text-disney-blue dark:bg-disney-gold/10 dark:text-disney-gold hover:bg-disney-blue/20 dark:hover:bg-disney-gold/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Copy Plan
              </button>
            </div>

            {/* Items by type */}
            {expanded.planner_items.length > 0 || expanded.pre_cruise_items.length > 0 ? (
              <div className="space-y-3">
                {/* Planner items grouped by type */}
                {Object.entries(groupByType(expanded.planner_items)).map(([type, items]) => (
                  <div key={type}>
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 mb-1">
                      {lookupItem(type, '').category || type} ({items.length})
                    </p>
                    <div className="space-y-0.5">
                      {items.map((item, i) => {
                        const info = lookupItem(item.item_type, item.item_id);
                        return (
                          <div key={`${item.item_type}-${item.item_id}-${i}`} className="flex items-center gap-2 py-1">
                            <span className="text-xs">{info.emoji}</span>
                            <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{info.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Pre-cruise checklist grouped by category */}
                {Object.entries(groupByCategory(expanded.pre_cruise_items)).map(([cat, items]) => (
                  <div key={cat}>
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 mb-1">
                      {CATEGORY_LABELS[cat] || cat} ({items.length})
                    </p>
                    <div className="space-y-0.5">
                      {items.map((item, i) => (
                        <div key={`${cat}-${i}`} className="flex items-center gap-2 py-1">
                          <span className="text-xs">📋</span>
                          <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-2">No items planned yet</p>
            )}
          </div>
        )}
      </div>

      {/* Copy Confirmation Modal */}
      {copyModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-5">
              {copyResult ? (
                <>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
                    Plan Copied!
                  </h3>
                  <div className="space-y-2 mb-4">
                    {copyResult.planner_items > 0 && (
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        {copyResult.planner_items} planner item{copyResult.planner_items !== 1 ? 's' : ''} added
                      </p>
                    )}
                    {copyResult.checklist_items > 0 && (
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        {copyResult.checklist_items} checklist item{copyResult.checklist_items !== 1 ? 's' : ''} added
                      </p>
                    )}
                    {copyResult.rotation !== null && (
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        Dining rotation set to Rotation {copyResult.rotation}
                      </p>
                    )}
                    {copyResult.planner_items === 0 && copyResult.checklist_items === 0 && copyResult.rotation === null && (
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        All items were already in your plan — nothing new to copy.
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={closeCopyModal}
                    className="w-full px-4 py-2.5 rounded-xl text-sm font-medium btn-disney"
                  >
                    Done
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                    Copy {copyModal.display_name}&apos;s Plan
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                    Items already in your plan will be kept as-is. Copied items start unchecked.
                  </p>

                  <div className="space-y-3 mb-4">
                    {/* Planner items toggle */}
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">Planner Items</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">({copyModal.planner_items.length})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCopyPlanner(!copyPlanner)}
                        disabled={copyModal.planner_items.length === 0}
                        className={`relative w-10 h-6 rounded-full transition-colors disabled:opacity-40 ${
                          copyPlanner && copyModal.planner_items.length > 0
                            ? 'bg-disney-blue dark:bg-disney-gold'
                            : 'bg-slate-200 dark:bg-slate-600'
                        }`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                          copyPlanner && copyModal.planner_items.length > 0 ? 'translate-x-4' : ''
                        }`} />
                      </button>
                    </label>

                    {/* Checklist toggle */}
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">Pre-Cruise Checklist</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">({copyModal.pre_cruise_items.length})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCopyChecklist(!copyChecklist)}
                        disabled={copyModal.pre_cruise_items.length === 0}
                        className={`relative w-10 h-6 rounded-full transition-colors disabled:opacity-40 ${
                          copyChecklist && copyModal.pre_cruise_items.length > 0
                            ? 'bg-disney-blue dark:bg-disney-gold'
                            : 'bg-slate-200 dark:bg-slate-600'
                        }`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                          copyChecklist && copyModal.pre_cruise_items.length > 0 ? 'translate-x-4' : ''
                        }`} />
                      </button>
                    </label>

                    {/* Rotation toggle (Adventure only) */}
                    {isAdventure && (
                      <label className="flex items-center justify-between cursor-pointer">
                        <div>
                          <span className="text-sm font-medium text-slate-900 dark:text-white">Dining Rotation</span>
                          {copyModal.adventure_rotation !== null && (
                            <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">(Rotation {copyModal.adventure_rotation})</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setCopyRotation(!copyRotation)}
                          disabled={copyModal.adventure_rotation === null}
                          className={`relative w-10 h-6 rounded-full transition-colors disabled:opacity-40 ${
                            copyRotation && copyModal.adventure_rotation !== null
                              ? 'bg-disney-blue dark:bg-disney-gold'
                              : 'bg-slate-200 dark:bg-slate-600'
                          }`}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                            copyRotation && copyModal.adventure_rotation !== null ? 'translate-x-4' : ''
                          }`} />
                        </button>
                      </label>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={closeCopyModal}
                      className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={duplicating !== null}
                      onClick={handleCopy}
                      className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium btn-disney disabled:opacity-50"
                    >
                      {duplicating ? 'Copying...' : 'Copy Plan'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
