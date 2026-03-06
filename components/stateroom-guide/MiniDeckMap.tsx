import { useMemo } from 'react';
import { getVenuesByDeck } from '@/lib/unified-data';
import { SECTION_X } from '@/lib/stateroom-constants';

interface MiniDeckMapProps {
  ship: string;
  deck: number;
  section: 'Forward' | 'Midship' | 'Aft' | string;
  stateroom: number;
}

const SECTION_RANGES: Record<string, [number, number]> = {
  Forward: [40, 200],
  Midship: [200, 400],
  Aft: [400, 560],
};

export default function MiniDeckMap({ ship, deck, section, stateroom }: MiniDeckMapProps) {
  const side = stateroom % 2 === 0 ? 'port' : 'starboard';

  const venueLabels = useMemo(() => {
    const current = getVenuesByDeck(ship, deck);
    const above = getVenuesByDeck(ship, deck + 1);

    const format = (items: typeof current, deckNum: number) => {
      // Group by position to avoid overlapping labels
      const byPos: Record<string, string[]> = {};
      for (const { venue, instance } of items) {
        if (!instance.position.length) continue;
        for (const pos of instance.position) {
          const key = pos.toLowerCase();
          const section = key.includes('fwd') || key.includes('forward') ? 'Forward'
            : key.includes('mid') ? 'Midship'
            : key.includes('aft') ? 'Aft'
            : 'Midship';
          if (!byPos[section]) byPos[section] = [];
          byPos[section].push(venue.name);
        }
      }
      return Object.entries(byPos).map(([sec, names]) => ({
        section: sec,
        x: SECTION_X[sec] || 300,
        names: names.slice(0, 3), // Limit to 3 per section
        deckNum,
      }));
    };

    return {
      current: format(current, deck),
      above: format(above, deck + 1),
    };
  }, [ship, deck]);

  const roomX = SECTION_X[section] || 300;
  const roomY = side === 'port' ? 38 : 72;

  return (
    <div className="w-full">
      <svg viewBox="0 0 600 120" className="w-full h-auto" role="img" aria-label={`Deck map showing room ${stateroom} location`}>
        {/* Ship hull outline */}
        <path
          d="M 30 55 Q 10 55 5 55 Q 0 55 5 55 L 30 35 Q 35 30 40 35 L 40 75 Q 35 80 30 75 Z"
          fill="none"
          className="stroke-slate-300 dark:stroke-slate-600"
          strokeWidth="1.5"
        />
        <path
          d="M 570 55 Q 590 55 595 55 Q 600 52 595 48 L 570 35 Q 565 30 560 35 L 560 75 Q 565 80 570 75 Z"
          fill="none"
          className="stroke-slate-300 dark:stroke-slate-600"
          strokeWidth="1.5"
        />

        {/* Deck strips */}
        {/* Current deck */}
        <rect x="40" y="30" width="520" height="50" rx="4"
          className="fill-slate-50 dark:fill-slate-700/50 stroke-slate-200 dark:stroke-slate-600"
          strokeWidth="1"
        />

        {/* Section dividers */}
        <line x1="200" y1="30" x2="200" y2="80" className="stroke-slate-200 dark:stroke-slate-600" strokeWidth="1" strokeDasharray="4,4" />
        <line x1="400" y1="30" x2="400" y2="80" className="stroke-slate-200 dark:stroke-slate-600" strokeWidth="1" strokeDasharray="4,4" />

        {/* Center line (port/starboard divide) */}
        <line x1="40" y1="55" x2="560" y2="55" className="stroke-slate-200 dark:stroke-slate-600" strokeWidth="0.5" strokeDasharray="2,4" />

        {/* Section labels */}
        <text x="120" y="25" textAnchor="middle" className="fill-slate-400 dark:fill-slate-500" fontSize="9" fontWeight="500">FWD</text>
        <text x="300" y="25" textAnchor="middle" className="fill-slate-400 dark:fill-slate-500" fontSize="9" fontWeight="500">MID</text>
        <text x="480" y="25" textAnchor="middle" className="fill-slate-400 dark:fill-slate-500" fontSize="9" fontWeight="500">AFT</text>

        {/* Side labels */}
        <text x="35" y="42" textAnchor="end" className="fill-slate-300 dark:fill-slate-600" fontSize="7">Port</text>
        <text x="35" y="73" textAnchor="end" className="fill-slate-300 dark:fill-slate-600" fontSize="7">Stbd</text>

        {/* Room position marker */}
        <circle cx={roomX} cy={roomY} r="6"
          className="fill-disney-gold stroke-white dark:stroke-slate-800"
          strokeWidth="2"
        />
        <circle cx={roomX} cy={roomY} r="10"
          fill="none"
          className="stroke-disney-gold"
          strokeWidth="1"
          opacity="0.4"
        />

        {/* Room number label */}
        <text x={roomX} y={roomY > 55 ? roomY + 18 : roomY - 12} textAnchor="middle"
          className="fill-slate-700 dark:fill-slate-300" fontSize="9" fontWeight="700"
        >
          {stateroom}
        </text>

        {/* Venue labels for current deck */}
        {venueLabels.current.map((group, i) => {
          const labelY = 95;
          return (
            <text key={`cur-${i}`} x={group.x} y={labelY} textAnchor="middle"
              className="fill-slate-500 dark:fill-slate-400" fontSize="7"
            >
              {group.names.join(', ')}
            </text>
          );
        })}

        {/* Deck above venue labels (if relevant) */}
        {venueLabels.above.length > 0 && (
          <>
            {venueLabels.above.map((group, i) => {
              // Show deck-above venues that are in the same section as the room
              if (group.section !== section) return null;
              return (
                <text key={`above-${i}`} x={group.x} y={108} textAnchor="middle"
                  className="fill-amber-500 dark:fill-amber-400" fontSize="7"
                >
                  Deck {deck + 1}: {group.names.join(', ')}
                </text>
              );
            })}
          </>
        )}

        {/* Deck label */}
        <text x="580" y="59" textAnchor="end" className="fill-slate-500 dark:fill-slate-400" fontSize="10" fontWeight="600">
          Dk {deck}
        </text>
      </svg>
    </div>
  );
}
