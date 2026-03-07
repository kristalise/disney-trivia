// Backward-compatible wrapper: delegates to the unified offline-store
// Existing character page imports continue to work unchanged.

export type { PendingUpload } from './offline-store';

export {
  queueUpload,
  getPendingUploads,
  removePendingUpload,
  getPendingCount,
} from './offline-store';
