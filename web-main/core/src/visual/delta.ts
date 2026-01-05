/**
 * Visual Delta Detection
 *
 * Computes visual state deltas and emits events only when state changes.
 * Implements debouncing for low-confidence signals.
 */

import type {
  VID,
  LayoutType,
  VisualEvent,
  VisualSignals,
} from '../events/visual.js';
import { VisualEvents } from '../events/visual.js';
import type { VisualState, VIDState } from '../state/visual.js';
import type { DetectedRegion } from './vid.js';
import { VIDTracker, type VIDConfig } from './vid.js';

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------

export interface DeltaConfig {
  /** Number of snapshots a signal must persist before emitting event */
  debounceSnapshots: number;
  /** VID tracker configuration */
  vid: Partial<VIDConfig>;
}

export const DEFAULT_DELTA_CONFIG: DeltaConfig = {
  debounceSnapshots: 2,
  vid: {},
};

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

/** Result of delta computation */
export interface DeltaResult {
  nextState: VisualState;
  events: VisualEvent[];
}

/** Pending signal changes awaiting debounce */
interface PendingSignal {
  vid: VID;
  field: keyof VisualSignals;
  value: boolean | string;
  seenCount: number;
  firstSeenMs: number;
}

// -----------------------------------------------------------------------------
// Delta Detector
// -----------------------------------------------------------------------------

export class VisualDeltaDetector {
  private vidTracker: VIDTracker;
  private config: DeltaConfig;
  private pendingSignals: Map<string, PendingSignal> = new Map();
  private confirmedSignals: Map<string, boolean> = new Map(); // VID:field -> confirmed value
  private previousLayout: LayoutType = 'unknown';

  constructor(config: Partial<DeltaConfig> = {}) {
    this.config = { ...DEFAULT_DELTA_CONFIG, ...config };
    this.vidTracker = new VIDTracker(this.config.vid);
  }

  /** Reset detector state */
  reset(): void {
    this.vidTracker.reset();
    this.pendingSignals.clear();
    this.confirmedSignals.clear();
    this.previousLayout = 'unknown';
  }

  /**
   * Compute deltas between previous state and new detected regions
   */
  computeDeltas(
    prevState: VisualState,
    regions: DetectedRegion[],
    detectedLayout: LayoutType,
    nowMs: number,
    contentHash: string,
    width: number,
    height: number
  ): DeltaResult {
    const events: VisualEvent[] = [];

    // Emit snapshot received event
    events.push(
      VisualEvents.snapshotReceived(nowMs, contentHash, width, height, regions.length)
    );

    // Process regions through VID tracker
    const { assignments, appeared, expired } = this.vidTracker.processRegions(
      regions,
      nowMs
    );

    // Emit VID appeared events
    for (const vid of appeared) {
      const region = [...assignments.entries()].find(([, v]) => v === vid)?.[0];
      if (region) {
        events.push(
          VisualEvents.vidAppeared(nowMs, vid, region.kind, region.bbox)
        );
      }
    }

    // Emit VID disappeared events
    for (const vid of expired) {
      events.push(VisualEvents.vidDisappeared(nowMs, vid));
      // Clear any pending/confirmed signals for this VID
      this.clearSignalsForVID(vid);
    }

    // Check for signal changes
    for (const [region, vid] of assignments.entries()) {
      const signalEvents = this.checkSignalChanges(
        vid,
        region.signals,
        nowMs
      );
      events.push(...signalEvents);
    }

    // Check layout change
    if (detectedLayout !== 'unknown' && detectedLayout !== this.previousLayout) {
      events.push(
        VisualEvents.layoutChanged(nowMs, this.previousLayout, detectedLayout)
      );
      this.previousLayout = detectedLayout;
    }

    // Build next state from events
    const nextState = this.buildNextState(prevState, assignments, nowMs);

    return { nextState, events };
  }

  /**
   * Check for signal changes with debouncing
   * Uses confirmedSignals as source of truth, not prevState
   */
  private checkSignalChanges(
    vid: VID,
    newSignals: VisualSignals,
    nowMs: number
  ): VisualEvent[] {
    const events: VisualEvent[] = [];

    // Hand raised
    const handRaisedChanged = this.processSignalChange(
      vid,
      'handRaised',
      newSignals.handRaised ?? false,
      nowMs
    );
    if (handRaisedChanged !== null) {
      events.push(
        handRaisedChanged
          ? VisualEvents.handRaised(nowMs, vid)
          : VisualEvents.handLowered(nowMs, vid)
      );
    }

    // Screen share / presenting
    const presentingChanged = this.processSignalChange(
      vid,
      'isPresenting',
      newSignals.isPresenting ?? false,
      nowMs
    );
    if (presentingChanged !== null) {
      events.push(
        presentingChanged
          ? VisualEvents.screenShareStarted(nowMs, vid)
          : VisualEvents.screenShareStopped(nowMs, vid)
      );
    }

    // Slide hash change (no debounce for hash changes)
    const confirmedPresenting = this.confirmedSignals.get(`${vid}:isPresenting`);
    const prevSlideKey = `${vid}:slideHash`;
    const prevSlideHash = this.confirmedSignals.get(prevSlideKey) as unknown as string | undefined;

    if (
      confirmedPresenting &&
      newSignals.slideHash &&
      newSignals.slideHash !== prevSlideHash
    ) {
      // Update confirmed slide hash
      this.confirmedSignals.set(prevSlideKey, newSignals.slideHash as unknown as boolean);
      events.push(
        VisualEvents.slideChanged(
          nowMs,
          vid,
          newSignals.slideHash,
          prevSlideHash
        )
      );
    }

    return events;
  }

  /**
   * Process a boolean signal change with debouncing
   * Returns: true = turned on, false = turned off, null = no change
   */
  private processSignalChange(
    vid: VID,
    field: keyof VisualSignals,
    newValue: boolean,
    nowMs: number
  ): boolean | null {
    const key = `${vid}:${field}`;
    const confirmedValue = this.confirmedSignals.get(key) ?? false;

    if (newValue === confirmedValue) {
      // No change from confirmed state - clear any pending
      this.pendingSignals.delete(key);
      return null;
    }

    // Value is different from confirmed state
    const pending = this.pendingSignals.get(key);

    if (!pending || pending.value !== newValue) {
      // Start new pending change
      this.pendingSignals.set(key, {
        vid,
        field,
        value: newValue,
        seenCount: 1,
        firstSeenMs: nowMs,
      });
      return null;
    }

    // Increment seen count
    pending.seenCount++;

    if (pending.seenCount >= this.config.debounceSnapshots) {
      // Debounce threshold met - confirm the change
      this.pendingSignals.delete(key);
      this.confirmedSignals.set(key, newValue);
      return newValue;
    }

    return null;
  }

  /**
   * Clear signals for a VID
   */
  private clearSignalsForVID(vid: VID): void {
    const prefix = `${vid}:`;

    for (const key of [...this.pendingSignals.keys()]) {
      if (key.startsWith(prefix)) {
        this.pendingSignals.delete(key);
      }
    }

    for (const key of [...this.confirmedSignals.keys()]) {
      if (key.startsWith(prefix)) {
        this.confirmedSignals.delete(key);
      }
    }
  }

  /**
   * Build next state from current assignments
   */
  private buildNextState(
    prevState: VisualState,
    assignments: Map<DetectedRegion, VID>,
    nowMs: number
  ): VisualState {
    const vids: Record<VID, VIDState> = {};

    for (const [region, vid] of assignments.entries()) {
      const prevVidState = prevState.vids[vid];
      const entry = this.vidTracker.getEntry(vid);

      // Build signals from confirmed state
      const confirmedHandRaised = this.confirmedSignals.get(`${vid}:handRaised`) ?? false;
      const confirmedPresenting = this.confirmedSignals.get(`${vid}:isPresenting`) ?? false;

      vids[vid] = {
        vid,
        lastSeenMs: nowMs,
        bbox: region.bbox,
        kind: region.kind,
        signals: {
          handRaised: confirmedHandRaised,
          isPresenting: confirmedPresenting,
          cameraOn: region.signals.cameraOn,
          isActiveSpeaker: region.signals.isActiveSpeaker,
          slideHash: confirmedPresenting ? region.signals.slideHash : undefined,
        },
        confidence: entry?.confidence ?? 1.0,
        fingerprint: region.fingerprint,
        audioSid: prevVidState?.audioSid,
      };
    }

    // Determine screen share state
    const presentingVid = Object.values(vids).find((v) => v.signals.isPresenting);
    const screenShare = presentingVid
      ? {
          active: true,
          vid: presentingVid.vid,
          slideHash: presentingVid.signals.slideHash,
        }
      : { active: false };

    // Count raised hands
    const handRaisedCount = Object.values(vids).filter(
      (v) => v.signals.handRaised
    ).length;

    return {
      vids,
      screenShare,
      layout: this.previousLayout,
      handRaisedCount,
      lastSnapshotMs: nowMs,
      snapshotCount: prevState.snapshotCount + 1,
    };
  }
}

/**
 * Standalone function for single delta computation
 */
export function computeVisualDeltas(
  prevState: VisualState,
  regions: DetectedRegion[],
  layout: LayoutType,
  nowMs: number,
  contentHash: string,
  width: number,
  height: number,
  detector?: VisualDeltaDetector
): DeltaResult {
  const det = detector ?? new VisualDeltaDetector();
  return det.computeDeltas(
    prevState,
    regions,
    layout,
    nowMs,
    contentHash,
    width,
    height
  );
}
