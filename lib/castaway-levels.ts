export type CastawayLevel = 'none' | 'silver' | 'gold' | 'platinum' | 'pearl';

export interface CastawayInfo {
  level: CastawayLevel;
  label: string;
  emoji: string;
  checkInDays: number;
  activityDays: number;
  color: string;
}

export function getCastawayLevel(pastSailingCount: number): CastawayInfo {
  if (pastSailingCount >= 25) return { level: 'pearl', label: 'Pearl', emoji: '\u{1F90D}', checkInDays: 40, activityDays: 123, color: 'text-slate-100' };
  if (pastSailingCount >= 10) return { level: 'platinum', label: 'Platinum', emoji: '\u{1F48E}', checkInDays: 38, activityDays: 120, color: 'text-blue-200' };
  if (pastSailingCount >= 5) return { level: 'gold', label: 'Gold', emoji: '\u{1F947}', checkInDays: 35, activityDays: 105, color: 'text-yellow-300' };
  if (pastSailingCount >= 1) return { level: 'silver', label: 'Silver', emoji: '\u{1F948}', checkInDays: 33, activityDays: 90, color: 'text-slate-300' };
  return { level: 'none', label: 'New', emoji: '\u2693', checkInDays: 30, activityDays: 75, color: 'text-white' };
}
