'use client';

import { useState } from 'react';

interface RoomNumberParserProps {
  onConfirm: (rooms: number[]) => void;
  onCancel: () => void;
}

export default function RoomNumberParser({ onConfirm, onCancel }: RoomNumberParserProps) {
  const [rawText, setRawText] = useState('');
  const [parsed, setParsed] = useState<{ valid: number[]; invalid: string[] } | null>(null);

  const handleParse = () => {
    const matches = rawText.match(/\b\d{4,5}\b/g) || [];
    const unique = [...new Set(matches.map(Number))];

    // Separate valid (4-5 digits starting with reasonable deck numbers) from invalid
    const valid = unique.filter(n => n >= 1000 && n <= 99999);
    const invalidMatches = matches.filter(m => {
      const n = Number(m);
      return n < 1000 || n > 99999;
    });

    setParsed({ valid, invalid: [...new Set(invalidMatches)] });
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
      <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Paste Room Numbers</h4>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
        Paste a list of stateroom numbers from your FE group, Facebook post, or spreadsheet. We&apos;ll extract the room numbers automatically.
      </p>

      <textarea
        value={rawText}
        onChange={e => { setRawText(e.target.value); setParsed(null); }}
        rows={4}
        placeholder="e.g. Room 8512, 8514, 9022&#10;Or: Jane - 8512, Bob - 8514, Sue - 9022"
        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white resize-none mb-3"
      />

      {!parsed ? (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleParse}
            disabled={!rawText.trim()}
            className="px-4 py-2 rounded-xl text-sm font-medium btn-disney disabled:opacity-50"
          >
            Parse Numbers
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div>
          {parsed.valid.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">
                Found {parsed.valid.length} room{parsed.valid.length !== 1 ? 's' : ''}:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {parsed.valid.map(room => (
                  <span key={room} className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                    {room}
                  </span>
                ))}
              </div>
            </div>
          )}

          {parsed.invalid.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">
                Skipped {parsed.invalid.length} invalid:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {parsed.invalid.map(num => (
                  <span key={num} className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 line-through">
                    {num}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onConfirm(parsed.valid)}
              disabled={parsed.valid.length === 0}
              className="px-4 py-2 rounded-xl text-sm font-medium btn-disney disabled:opacity-50"
            >
              Add {parsed.valid.length} Room{parsed.valid.length !== 1 ? 's' : ''}
            </button>
            <button
              type="button"
              onClick={() => { setParsed(null); setRawText(''); }}
              className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Try Again
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
