export function getReviewType(url: string): string {
  if (url.includes('/venue-reviews')) return 'venue';
  if (url.includes('/foodie-reviews')) return 'foodie';
  if (url.includes('/dining-reviews')) return 'dining';
  if (url.includes('/activity-reviews')) return 'activity';
  if (url.includes('/stateroom-reviews')) return 'stateroom';
  if (url.includes('/movie-reviews')) return 'movie';
  if (url.includes('/sailing-reviews')) return 'sailing';
  if (url.includes('/cruise-hack-reviews') || url.includes('/hack-reviews')) return 'hack';
  return 'unknown';
}

export const REVIEW_TYPE_LABELS: Record<string, string> = {
  venue: 'Venue',
  foodie: 'Foodie',
  dining: 'Dining',
  activity: 'Activity',
  stateroom: 'Stateroom',
  movie: 'Movie',
  sailing: 'Sailing',
  hack: 'Hack',
};

export const REVIEW_TYPE_EMOJI: Record<string, string> = {
  venue: '🎪',
  foodie: '🍔',
  dining: '🍽',
  activity: '🎭',
  stateroom: '🛏',
  movie: '🎬',
  sailing: '🚢',
  hack: '🏴‍☠️',
};
