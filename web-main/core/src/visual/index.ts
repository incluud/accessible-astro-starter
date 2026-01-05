/**
 * Visual Delta Pipeline
 *
 * Exports for composite snapshot ingestion, VID tracking, and delta detection.
 */

// VID tracking
export { VIDTracker, DEFAULT_VID_CONFIG } from './vid.js';
export type { VIDConfig, VIDEntry, VIDMatch, DetectedRegion } from './vid.js';

// Fingerprinting
export {
  generateFingerprint,
  generateSlideHash,
  contentHash,
  averageColor,
  hashSimilarity,
} from './fingerprint.js';

// Delta detection
export {
  VisualDeltaDetector,
  computeVisualDeltas,
  DEFAULT_DELTA_CONFIG,
} from './delta.js';
export type { DeltaConfig, DeltaResult } from './delta.js';

// Snapshot client
export {
  SnapshotClient,
  LocalSnapshotAnalyzer,
  DEFAULT_SNAPSHOT_CONFIG,
} from './snapshot.js';
export type {
  SnapshotConfig,
  SnapshotPayload,
  TileSource,
  LayoutAnalysis,
  SnapshotAnalyzer,
} from './snapshot.js';
