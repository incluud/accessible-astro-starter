/**
 * VID (Video Session ID) Tracking
 *
 * VID is a session-local visual continuity handle - NOT identity.
 * Minted when a new visual region appears, expires when region disappears.
 */

import type { VID, BBox, RegionKind, Confidence } from '../events/visual.js';

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------

export interface VIDConfig {
  /** Milliseconds before a VID expires if not seen */
  expireMs: number;
  /** Maximum bbox distance for matching (normalized 0..1) */
  bboxDistanceThreshold: number;
  /** Minimum fingerprint similarity for matching (0..1) */
  fingerprintSimilarityThreshold: number;
  /** Weight for bbox matching vs fingerprint matching */
  bboxWeight: number;
}

export const DEFAULT_VID_CONFIG: VIDConfig = {
  expireMs: 15000,
  bboxDistanceThreshold: 0.15,
  fingerprintSimilarityThreshold: 0.6,
  bboxWeight: 0.4,
};

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

/** A detected visual region from snapshot analysis */
export interface DetectedRegion {
  bbox: BBox;
  kind: RegionKind;
  fingerprint: string;
  signals: {
    handRaised?: boolean;
    cameraOn?: boolean;
    isActiveSpeaker?: boolean;
    isPresenting?: boolean;
    slideHash?: string;
  };
}

/** VID tracking entry */
export interface VIDEntry {
  vid: VID;
  bbox: BBox;
  kind: RegionKind;
  fingerprint: string;
  lastSeenMs: number;
  confidence: Confidence;
}

/** Match result between region and VID */
export interface VIDMatch {
  vid: VID;
  score: Confidence;
  bboxDistance: number;
  fingerprintSimilarity: number;
}

// -----------------------------------------------------------------------------
// VID Tracker
// -----------------------------------------------------------------------------

export class VIDTracker {
  private nextVidNum = 1;
  private entries: Map<VID, VIDEntry> = new Map();
  private config: VIDConfig;

  constructor(config: Partial<VIDConfig> = {}) {
    this.config = { ...DEFAULT_VID_CONFIG, ...config };
  }

  /** Reset tracker state (for testing) */
  reset(): void {
    this.nextVidNum = 1;
    this.entries.clear();
  }

  /** Mint a new VID */
  private mintVID(): VID {
    return `v${this.nextVidNum++}` as VID;
  }

  /** Calculate normalized Euclidean distance between bbox centers */
  private bboxDistance(a: BBox, b: BBox): number {
    const aCenterX = a.x + a.w / 2;
    const aCenterY = a.y + a.h / 2;
    const bCenterX = b.x + b.w / 2;
    const bCenterY = b.y + b.h / 2;

    const dx = aCenterX - bCenterX;
    const dy = aCenterY - bCenterY;

    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Calculate fingerprint similarity (0..1)
   * Uses simple character comparison for coarse matching
   * NOT biometric - just position/color bucket hashing
   */
  private fingerprintSimilarity(a: string, b: string): number {
    if (a === b) return 1.0;
    if (!a || !b) return 0;

    const maxLen = Math.max(a.length, b.length);
    const minLen = Math.min(a.length, b.length);

    let matches = 0;
    for (let i = 0; i < minLen; i++) {
      if (a[i] === b[i]) matches++;
    }

    return matches / maxLen;
  }

  /** Find best matching VID for a region */
  private findBestMatch(region: DetectedRegion): VIDMatch | null {
    let bestMatch: VIDMatch | null = null;

    for (const entry of this.entries.values()) {
      // Kind must match
      if (entry.kind !== region.kind) continue;

      const bboxDist = this.bboxDistance(entry.bbox, region.bbox);
      const fpSim = this.fingerprintSimilarity(entry.fingerprint, region.fingerprint);

      // Skip if bbox too far
      if (bboxDist > this.config.bboxDistanceThreshold) continue;

      // Skip if fingerprint too different
      if (fpSim < this.config.fingerprintSimilarityThreshold) continue;

      // Calculate combined score (higher is better)
      const bboxScore = 1 - bboxDist / this.config.bboxDistanceThreshold;
      const fpScore = fpSim;
      const score =
        this.config.bboxWeight * bboxScore + (1 - this.config.bboxWeight) * fpScore;

      if (!bestMatch || score > bestMatch.score) {
        bestMatch = {
          vid: entry.vid,
          score,
          bboxDistance: bboxDist,
          fingerprintSimilarity: fpSim,
        };
      }
    }

    return bestMatch;
  }

  /**
   * Process detected regions and return VID assignments
   * Also returns newly minted VIDs and expired VIDs
   */
  processRegions(
    regions: DetectedRegion[],
    nowMs: number
  ): {
    assignments: Map<DetectedRegion, VID>;
    appeared: VID[];
    updated: VID[];
    expired: VID[];
  } {
    const assignments = new Map<DetectedRegion, VID>();
    const appeared: VID[] = [];
    const updated: VID[] = [];
    const usedVids = new Set<VID>();

    // Match regions to existing VIDs
    for (const region of regions) {
      const match = this.findBestMatch(region);

      if (match && !usedVids.has(match.vid)) {
        // Matched to existing VID
        assignments.set(region, match.vid);
        usedVids.add(match.vid);
        updated.push(match.vid);

        // Update entry
        const entry = this.entries.get(match.vid)!;
        entry.bbox = region.bbox;
        entry.fingerprint = region.fingerprint;
        entry.lastSeenMs = nowMs;
        entry.confidence = match.score;
      } else {
        // Mint new VID
        const vid = this.mintVID();
        assignments.set(region, vid);
        appeared.push(vid);

        this.entries.set(vid, {
          vid,
          bbox: region.bbox,
          kind: region.kind,
          fingerprint: region.fingerprint,
          lastSeenMs: nowMs,
          confidence: 1.0,
        });
      }
    }

    // Find expired VIDs (not seen for too long)
    const expired: VID[] = [];
    const expiryThreshold = nowMs - this.config.expireMs;

    for (const entry of this.entries.values()) {
      if (!usedVids.has(entry.vid) && entry.lastSeenMs < expiryThreshold) {
        expired.push(entry.vid);
      }
    }

    // Remove expired entries
    for (const vid of expired) {
      this.entries.delete(vid);
    }

    return { assignments, appeared, updated, expired };
  }

  /** Get current VID entry */
  getEntry(vid: VID): VIDEntry | undefined {
    return this.entries.get(vid);
  }

  /** Get all current entries */
  getAllEntries(): VIDEntry[] {
    return Array.from(this.entries.values());
  }

  /** Get entry count */
  get size(): number {
    return this.entries.size;
  }
}
