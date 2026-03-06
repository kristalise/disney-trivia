export type ShipName = 'Disney Magic' | 'Disney Wonder' | 'Disney Dream' | 'Disney Fantasy' | 'Disney Wish' | 'Disney Treasure' | 'Disney Destiny' | 'Disney Adventure';

export type BudgetLevel = 'budget' | 'reasonable' | 'splurge' | 'concierge';

export type TravelParty = '' | 'solo' | 'couple' | 'friends' | 'family-kids' | 'family-teens' | 'family-multi';

export interface Stateroom {
  stateroom: number;
  category: string | null;
  occupancy: number | null;
  connecting: string | null;
  accessible: string | null;
  verandahPartitions: string | null;
  bedding: string | null;
  assemblyStation: string | null;
  assemblyLocation: string | null;
  assemblySide: string | null;
  assemblySection: string | null;
  wishExtender?: string | null;
  theme?: string | null;
  notes: string | null;
}

export interface ScoreReason {
  label: string;
  points: number;
  detail: string;
}

export type TrafficLight = 'green' | 'yellow' | 'red';

export interface EnrichedRoom extends Stateroom {
  deck: number;
  section: string;
  type: string;
  typeEmoji: string;
  score: number;
  scoreReasons: ScoreReason[];
  sqft: number | null;
  sqftPerPax: number | null;
  trafficLight: TrafficLight;
}

export interface DeckGroup {
  deck: number;
  rooms: EnrichedRoom[];
  topScore: number;
}

export interface BedCount {
  doubleBeds: number;
  singleBeds: number;
  totalBeds: number;
  hasBunk: boolean;
  hasUpperBerth: boolean;
}

export type VerandahViewType = 'ocean' | 'garden' | 'reef';

export interface WizardState {
  selectedShip: ShipName | '';
  budgets: BudgetLevel[];
  numStaterooms: number;
  partySize: number;
  travelParty: TravelParty;
  noiseSensitive: boolean;
  needsAccessible: boolean;
  needsConnecting: boolean;
  noBunkBed: boolean;
  elderlyFriendly: boolean;
  childFriendly: boolean;
  requiresVerandah: boolean;
  verandahTypes: VerandahViewType[];
  selectedThemes: string[];
  selectedDecks: number[];
  selectedSections: string[];
  highlightRoom: number | null;
}

export interface FilterResult {
  filtered: EnrichedRoom[];
  deckGroups: DeckGroup[];
  availableDecks: number[];
  availableSections: string[];
}
