/**
 * Friendship utilities — mutual follow detection + overlapping sailing helpers
 */

interface SailingRecord {
  id: string;
  user_id: string;
  ship_name: string;
  sail_start_date: string;
  sail_end_date: string;
}

interface SailingOverlap {
  sailing_a: SailingRecord;
  sailing_b: SailingRecord;
  ship_name: string;
  overlap_start: string;
  overlap_end: string;
}

/**
 * Find overlapping sailings between two users' sailing records.
 * Both must be on the same ship with overlapping date ranges.
 */
export function findOverlappingSailings(
  sailingsA: SailingRecord[],
  sailingsB: SailingRecord[]
): SailingOverlap[] {
  const overlaps: SailingOverlap[] = [];

  for (const a of sailingsA) {
    for (const b of sailingsB) {
      if (a.ship_name !== b.ship_name) continue;

      const startA = new Date(a.sail_start_date);
      const endA = new Date(a.sail_end_date);
      const startB = new Date(b.sail_start_date);
      const endB = new Date(b.sail_end_date);

      const overlapStart = startA > startB ? startA : startB;
      const overlapEnd = endA < endB ? endA : endB;

      if (overlapStart <= overlapEnd) {
        overlaps.push({
          sailing_a: a,
          sailing_b: b,
          ship_name: a.ship_name,
          overlap_start: overlapStart.toISOString().split('T')[0],
          overlap_end: overlapEnd.toISOString().split('T')[0],
        });
      }
    }
  }

  return overlaps;
}

/**
 * Returns canonical user ordering (user_a < user_b) for met_on_ship table.
 */
export function canonicalUserOrder(userId1: string, userId2: string): { user_a: string; user_b: string } {
  return userId1 < userId2
    ? { user_a: userId1, user_b: userId2 }
    : { user_a: userId2, user_b: userId1 };
}
