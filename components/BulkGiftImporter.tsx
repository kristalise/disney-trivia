'use client';

import { useState } from 'react';
import { queueMutation, getPendingMutationCount } from '@/lib/offline-store';

interface ExistingGift {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

interface ParsedEntry {
  stateroom_number: number;
  recipient_name: string;
  notes: string;
  gift_name: string;
}

interface BulkGiftImporterProps {
  existingGifts: ExistingGift[];
  sailingId: string;
  onComplete: () => void;
  headers: () => HeadersInit;
  isOnline: boolean;
  onOfflinePendingChange?: (count: number) => void;
}

function parseBulkText(text: string, existingGifts: ExistingGift[]): { entries: ParsedEntry[]; invalidLines: string[] } {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length === 0) return { entries: [], invalidLines: [] };

  // Auto-skip header row
  const headerPatterns = /\b(room|stateroom|cabin|name|gift|notes)\b/i;
  const startIdx = headerPatterns.test(lines[0]) ? 1 : 0;

  const entries: ParsedEntry[] = [];
  const invalidLines: string[] = [];
  const defaultGiftName = existingGifts.length > 0 ? existingGifts[0].name : 'Gifts';

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Detect delimiter: tab first, then comma, then " - "
    let parts: string[];
    if (line.includes('\t')) {
      parts = line.split('\t').map(s => s.trim());
    } else if (line.includes(',')) {
      parts = line.split(',').map(s => s.trim());
    } else if (line.includes(' - ')) {
      parts = line.split(' - ').map(s => s.trim());
    } else {
      // Single value — try to extract room number
      parts = [line.trim()];
    }

    // Extract room number from first column
    const roomMatch = parts[0]?.match(/\b(\d{4,5})\b/);
    if (!roomMatch) {
      invalidLines.push(line);
      continue;
    }

    const room = Number(roomMatch[1]);
    if (room < 1000) {
      invalidLines.push(line);
      continue;
    }

    const name = parts[1]?.replace(/<[^>]*>/g, '').trim() || '';
    const notes = parts[2]?.replace(/<[^>]*>/g, '').trim() || '';
    const giftType = parts[3]?.replace(/<[^>]*>/g, '').trim() || defaultGiftName;

    entries.push({
      stateroom_number: room,
      recipient_name: name,
      notes,
      gift_name: giftType,
    });
  }

  return { entries, invalidLines };
}

export default function BulkGiftImporter({ existingGifts, sailingId, onComplete, headers, isOnline, onOfflinePendingChange }: BulkGiftImporterProps) {
  const [rawText, setRawText] = useState('');
  const [parsed, setParsed] = useState<{ entries: ParsedEntry[]; invalidLines: string[] } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ gifts_created: number; recipients_added: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);

  const handleParse = () => {
    setError(null);
    const { entries, invalidLines } = parseBulkText(rawText, existingGifts);
    setParsed({ entries, invalidLines });
    setConfirming(false);
  };

  const handleConfirm = async () => {
    if (!parsed || parsed.entries.length === 0) return;
    setImporting(true);
    setError(null);

    const payload = {
      sailing_id: sailingId,
      bulk_import: parsed.entries.map(e => ({
        stateroom_number: e.stateroom_number,
        recipient_name: e.recipient_name,
        notes: e.notes,
        gift_name: e.gift_name,
      })),
    };

    try {
      if (!isOnline) {
        await queueMutation({
          type: 'pixie-bulk-import',
          url: '/api/pixie-gifts',
          method: 'POST',
          body: payload,
        });
        if (onOfflinePendingChange) {
          getPendingMutationCount().then(onOfflinePendingChange).catch(() => {});
        }
        setResult({ gifts_created: 0, recipients_added: parsed.entries.length });
        return;
      }

      const res = await fetch('/api/pixie-gifts', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        setResult({ gifts_created: data.gifts_created ?? 0, recipients_added: data.recipients_added ?? 0 });
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Import failed. Please try again.');
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setImporting(false);
    }
  };

  // Group entries by gift name for preview
  const groupedByGift = parsed?.entries.reduce((acc, e) => {
    if (!acc[e.gift_name]) acc[e.gift_name] = [];
    acc[e.gift_name].push(e);
    return acc;
  }, {} as Record<string, ParsedEntry[]>);

  const matchGift = (giftName: string) =>
    existingGifts.find(g => g.name.toLowerCase() === giftName.toLowerCase());

  if (result) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800 text-center">
        <div className="text-2xl mb-2">✅</div>
        <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-1">
          {!isOnline ? 'Queued for sync!' : 'Import complete!'}
        </p>
        <p className="text-xs text-green-600 dark:text-green-500">
          {result.recipients_added} recipient{result.recipients_added !== 1 ? 's' : ''} {!isOnline ? 'queued' : 'added'}
          {result.gifts_created > 0 && <>, {result.gifts_created} new gift{result.gifts_created !== 1 ? 's' : ''} created</>}
          {!isOnline && <><br/>Will sync when you&apos;re back online.</>}
        </p>
        <button
          type="button"
          onClick={onComplete}
          className="mt-3 px-4 py-2 rounded-xl text-sm font-medium btn-disney"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
      {/* Collapsible how-to guide */}
      <button
        type="button"
        onClick={() => setGuideOpen(!guideOpen)}
        className="w-full flex items-center justify-between mb-3"
      >
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">How it works</span>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform ${guideOpen ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {guideOpen && (
        <div className="mb-4 text-xs text-slate-500 dark:text-slate-400 space-y-2 border-b border-slate-200 dark:border-slate-700 pb-3">
          <p>Paste from a spreadsheet or notes app. Each row should have up to 4 columns:</p>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-2 font-mono text-[11px] leading-relaxed border border-slate-200 dark:border-slate-700">
            <span className="text-slate-400">Column 1</span> <span className="text-blue-600 dark:text-blue-400">Room Number</span> | <span className="text-slate-400">Column 2</span> <span className="text-blue-600 dark:text-blue-400">Name</span> | <span className="text-slate-400">Column 3</span> <span className="text-blue-600 dark:text-blue-400">Notes</span> | <span className="text-slate-400">Column 4</span> <span className="text-blue-600 dark:text-blue-400">Gift Type</span>
          </div>
          <p><strong className="text-slate-700 dark:text-slate-300">Accepted formats:</strong> tab-separated (spreadsheet), comma-separated, or dash-separated</p>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-2 font-mono text-[11px] leading-relaxed border border-slate-200 dark:border-slate-700">
            8512, Jane Smith, 2 kids, Candy Bags<br/>
            8514, Bob, Loves Disney, Keychains<br/>
            9022, Sue, , Door Magnets
          </div>
          <p>Gift type matches your existing gifts (case-insensitive). New gift types are auto-created. Columns 2-4 are optional.</p>
        </div>
      )}

      {!parsed ? (
        <>
          <textarea
            value={rawText}
            onChange={e => { setRawText(e.target.value); setError(null); }}
            rows={6}
            placeholder={"8512\tJane Smith\t2 kids\tCandy Bags\n8514\tBob\tLoves Disney\tKeychains\n9022\tSue\t\tDoor Magnets"}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white resize-none mb-3 font-mono"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleParse}
              disabled={!rawText.trim()}
              className="px-4 py-2 rounded-xl text-sm font-medium btn-disney disabled:opacity-50"
            >
              Preview Import
            </button>
          </div>
        </>
      ) : confirming ? (
        <div className="text-center py-4">
          <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">
            <strong>{parsed.entries.length}</strong> entr{parsed.entries.length !== 1 ? 'ies' : 'y'} across{' '}
            <strong>{Object.keys(groupedByGift ?? {}).length}</strong> gift{Object.keys(groupedByGift ?? {}).length !== 1 ? 's' : ''} will be added. Continue?
          </p>
          {error && (
            <p className="text-xs text-red-600 dark:text-red-400 mb-3">{error}</p>
          )}
          <div className="flex gap-2 justify-center">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={importing}
              className="px-4 py-2 rounded-xl text-sm font-medium btn-disney disabled:opacity-50"
            >
              {importing ? 'Importing...' : 'Add'}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={importing}
              className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div>
          {/* Preview table grouped by gift type */}
          {groupedByGift && Object.entries(groupedByGift).map(([giftName, entries]) => {
            const match = matchGift(giftName);
            return (
              <div key={giftName} className="mb-3">
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-t-lg text-xs font-bold"
                  style={{ backgroundColor: match ? `${match.color}20` : '#f1f5f920', color: match?.color || '#64748b' }}
                >
                  <span>{match?.emoji || '🎁'}</span>
                  <span>{giftName}</span>
                  <span className="opacity-60">({entries.length})</span>
                  {!match && (
                    <span className="ml-auto text-[10px] font-normal text-amber-600 dark:text-amber-400">New gift — will be created</span>
                  )}
                </div>
                <table className="w-full text-xs border border-slate-200 dark:border-slate-700 border-t-0">
                  <thead>
                    <tr className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                      <th className="px-3 py-1.5 text-left text-slate-500 dark:text-slate-400 font-medium w-20">Room</th>
                      <th className="px-3 py-1.5 text-left text-slate-500 dark:text-slate-400 font-medium">Name</th>
                      <th className="px-3 py-1.5 text-left text-slate-500 dark:text-slate-400 font-medium">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((e, idx) => (
                      <tr key={idx} className="border-b border-slate-100 dark:border-slate-700/50 last:border-0">
                        <td className="px-3 py-1.5 font-mono text-slate-900 dark:text-white">{e.stateroom_number}</td>
                        <td className="px-3 py-1.5 text-slate-700 dark:text-slate-300">{e.recipient_name || <span className="text-slate-300 dark:text-slate-600">—</span>}</td>
                        <td className="px-3 py-1.5 text-slate-500 dark:text-slate-400">{e.notes || <span className="text-slate-300 dark:text-slate-600">—</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}

          {/* Invalid lines */}
          {parsed.invalidLines.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">
                Could not parse {parsed.invalidLines.length} line{parsed.invalidLines.length !== 1 ? 's' : ''}:
              </p>
              <div className="space-y-1">
                {parsed.invalidLines.map((line, idx) => (
                  <p key={idx} className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded px-2 py-1 font-mono truncate">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-600 dark:text-red-400 mb-3">{error}</p>
          )}

          <div className="flex gap-2">
            {parsed.entries.length > 0 && (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="px-4 py-2 rounded-xl text-sm font-medium btn-disney"
              >
                Confirm {parsed.entries.length} Entr{parsed.entries.length !== 1 ? 'ies' : 'y'}
              </button>
            )}
            <button
              type="button"
              onClick={() => { setParsed(null); setRawText(''); }}
              className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Start Over
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
