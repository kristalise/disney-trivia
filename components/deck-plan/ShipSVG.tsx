'use client';

import { type RoomPosition, CATEGORY_COLORS, getCategoryClass } from '@/lib/deck-plan-utils';

interface ShipSVGProps {
  positions: RoomPosition[];
  selectedRoom: number | null;
  onRoomClick: (room: RoomPosition, event: React.MouseEvent<SVGElement>) => void;
  isFallback: boolean;
}

// Ship outline path: pointed bow (left), rectangular body, rounded stern (right)
const SHIP_OUTLINE =
  'M 40,120 ' +
  'L 140,30 L 900,30 Q 960,30 960,70 L 960,170 Q 960,210 900,210 L 140,210 Z';

export default function ShipSVG({ positions, selectedRoom, onRoomClick, isFallback }: ShipSVGProps) {
  return (
    <svg
      viewBox="0 0 1000 240"
      width="100%"
      preserveAspectRatio="xMidYMid meet"
      className="block"
      role="img"
      aria-label="Ship deck plan"
    >
      {/* Ship outline */}
      <path
        d={SHIP_OUTLINE}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-slate-400 dark:text-slate-500"
      />

      {/* Centerline */}
      <line
        x1="80"
        y1="120"
        x2="950"
        y2="120"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="6,4"
        className="text-slate-300 dark:text-slate-600"
      />

      {!isFallback && (
        <>
          {/* Zone divider lines */}
          <line x1="370" y1="35" x2="370" y2="205" stroke="currentColor" strokeWidth="1" strokeDasharray="4,4" className="text-slate-300 dark:text-slate-600" />
          <line x1="700" y1="35" x2="700" y2="205" stroke="currentColor" strokeWidth="1" strokeDasharray="4,4" className="text-slate-300 dark:text-slate-600" />

          {/* Zone labels */}
          <text x="255" y="18" textAnchor="middle" fontSize="10" fontWeight="600" fill="currentColor" className="text-slate-400 dark:text-slate-500">FORWARD</text>
          <text x="535" y="18" textAnchor="middle" fontSize="10" fontWeight="600" fill="currentColor" className="text-slate-400 dark:text-slate-500">MIDSHIP</text>
          <text x="785" y="18" textAnchor="middle" fontSize="10" fontWeight="600" fill="currentColor" className="text-slate-400 dark:text-slate-500">AFT</text>

          {/* Side labels */}
          <text x="975" y="75" textAnchor="start" fontSize="9" fill="currentColor" className="text-slate-400 dark:text-slate-500">PORT</text>
          <text x="975" y="175" textAnchor="start" fontSize="9" fill="currentColor" className="text-slate-400 dark:text-slate-500">STBD</text>
        </>
      )}

      {/* Bow/Stern labels */}
      <text x="30" y="125" textAnchor="end" fontSize="9" fontWeight="500" fill="currentColor" className="text-slate-400 dark:text-slate-500">BOW</text>
      <text x="970" y="125" textAnchor="start" fontSize="9" fontWeight="500" fill="currentColor" className="text-slate-400 dark:text-slate-500">STERN</text>

      {/* Room rectangles */}
      {positions.map((pos) => {
        const isSelected = pos.room.stateroom === selectedRoom;
        const color = CATEGORY_COLORS[getCategoryClass(pos.room.category)];

        return (
          <g key={pos.room.stateroom}>
            {/* Visible room rect */}
            <rect
              x={pos.x}
              y={pos.y}
              width={8}
              height={12}
              rx={1}
              fill={isSelected ? '#f97316' : color}
              stroke={isSelected ? '#c2410c' : 'none'}
              strokeWidth={isSelected ? 1.5 : 0}
              className="cursor-pointer"
            />
            {/* Expanded invisible hit area for mobile */}
            <rect
              x={pos.x - 3}
              y={pos.y - 2}
              width={14}
              height={16}
              fill="transparent"
              className="cursor-pointer"
              onClick={(e) => onRoomClick(pos, e)}
            >
              <title>Room {pos.room.stateroom}</title>
            </rect>
            {/* Selected room star */}
            {isSelected && (
              <text
                x={pos.x + 4}
                y={pos.y - 3}
                textAnchor="middle"
                fontSize="10"
                fill="#f97316"
              >
                ★
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
