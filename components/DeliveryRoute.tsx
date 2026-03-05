'use client';

interface RouteStop {
  stateroom: number;
  deck: number;
  side?: 'port' | 'starboard';
  direction?: 'forward' | 'aft';
}

interface DeliveryRouteProps {
  route: RouteStop[];
  startStateroom: number;
  deliveredRooms?: Set<number>;
}

export default function DeliveryRoute({ route, startStateroom, deliveredRooms }: DeliveryRouteProps) {
  if (route.length === 0) return null;

  // Group by deck, preserving order
  const deckGroups: { deck: number; rooms: RouteStop[] }[] = [];
  let currentDeck = -1;

  for (const stop of route) {
    if (stop.deck !== currentDeck) {
      deckGroups.push({ deck: stop.deck, rooms: [stop] });
      currentDeck = stop.deck;
    } else {
      deckGroups[deckGroups.length - 1].rooms.push(stop);
    }
  }

  let stepNumber = 0;

  // Determine walking direction label for a deck group
  function getDeckDirection(rooms: RouteStop[]): string | null {
    if (rooms.length < 2) return null;
    const hasSideInfo = rooms.some(r => r.side);
    if (!hasSideInfo) return null;

    // Check if we walk one side then cross over
    const sides = rooms.map(r => r.side);
    const firstSide = sides[0];
    const switchIndex = sides.findIndex((s, i) => i > 0 && s !== firstSide);

    if (switchIndex > 0 && firstSide) {
      const sideLabel = (s: string) => s === 'port' ? 'Port' : 'Starboard';
      return `${sideLabel(firstSide)} side, then ${sideLabel(sides[switchIndex]!)} side`;
    }
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Start */}
      <div className="px-4 py-3 bg-disney-blue/5 dark:bg-disney-gold/5 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
        <span className="w-7 h-7 rounded-full bg-disney-blue dark:bg-disney-gold text-white dark:text-slate-900 text-xs font-bold flex items-center justify-center">
          GO
        </span>
        <span className="text-sm font-semibold text-slate-900 dark:text-white">
          Start: Room {startStateroom}
        </span>
      </div>

      {deckGroups.map((group, gi) => {
        const dirHint = getDeckDirection(group.rooms);
        return (
          <div key={`${group.deck}-${gi}`}>
            {/* Deck header */}
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Deck {group.deck}
                </span>
                {gi > 0 && (
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {group.deck > deckGroups[gi - 1].deck ? '(go up)' : '(go down)'}
                  </span>
                )}
                <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto">
                  {group.rooms.length} room{group.rooms.length !== 1 ? 's' : ''}
                </span>
              </div>
              {dirHint && (
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{dirHint}</p>
              )}
            </div>

            {/* Rooms on this deck */}
            {group.rooms.map((stop, si) => {
              stepNumber++;
              const isDelivered = deliveredRooms?.has(stop.stateroom);
              // Show side-switch indicator when switching from port to starboard or vice versa
              const prevStop = si > 0 ? group.rooms[si - 1] : null;
              const sideSwitch = prevStop?.side && stop.side && prevStop.side !== stop.side;

              return (
                <div key={stop.stateroom}>
                  {sideSwitch && (
                    <div className="px-4 py-1 flex items-center gap-2">
                      <div className="flex-1 border-t border-dashed border-slate-200 dark:border-slate-600" />
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">cross corridor</span>
                      <div className="flex-1 border-t border-dashed border-slate-200 dark:border-slate-600" />
                    </div>
                  )}
                  <div
                    className={`px-4 py-2.5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3 ${
                      isDelivered ? 'opacity-50' : ''
                    }`}
                  >
                    <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center justify-center flex-shrink-0">
                      {stepNumber}
                    </span>
                    <span className={`text-sm font-medium ${
                      isDelivered
                        ? 'line-through text-slate-400 dark:text-slate-500'
                        : 'text-slate-900 dark:text-white'
                    }`}>
                      Room {stop.stateroom}
                    </span>
                    {stop.side && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        stop.side === 'port'
                          ? 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400'
                          : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                      }`}>
                        {stop.side === 'port' ? 'Port' : 'Stbd'}
                      </span>
                    )}
                    {isDelivered && (
                      <span className="ml-auto text-xs text-green-600 dark:text-green-400 font-medium">Delivered</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {/* End */}
      <div className="px-4 py-3 bg-green-50 dark:bg-green-900/10 flex items-center gap-3">
        <span className="w-7 h-7 rounded-full bg-green-500 text-white text-xs font-bold flex items-center justify-center">
          END
        </span>
        <span className="text-sm font-semibold text-green-700 dark:text-green-400">
          Return to Room {startStateroom}
        </span>
      </div>
    </div>
  );
}
