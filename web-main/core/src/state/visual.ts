/**
 * Visual State Reducer
 *
 * Manages the visual world-model slice using reducer-friendly immutable updates.
 * State is keyed by VID (Video Session ID) - session-local continuity handles.
 */

import type {
  VID,
  AudioSID,
  BBox,
  RegionKind,
  LayoutType,
  Confidence,
  VisualSignals,
  VisualEvent,
} from '../events/visual.js';

// -----------------------------------------------------------------------------
// State Types
// -----------------------------------------------------------------------------

/** State for a single VID (visual region) */
export interface VIDState {
  vid: VID;
  lastSeenMs: number;
  bbox: BBox;
  kind: RegionKind;
  signals: VisualSignals;
  confidence: Confidence;
  /** Optional link to audio stream */
  audioSid?: AudioSID;
  /** Fingerprint for continuity matching */
  fingerprint?: string;
}

/** Screen share state */
export interface ScreenShareState {
  active: boolean;
  vid?: VID;
  slideHash?: string;
}

/** Complete visual world-state slice */
export interface VisualState {
  /** All known VIDs keyed by ID */
  vids: Record<VID, VIDState>;
  /** Screen share status */
  screenShare: ScreenShareState;
  /** Current meeting layout */
  layout: LayoutType;
  /** Count of raised hands */
  handRaisedCount: number;
  /** Last snapshot timestamp */
  lastSnapshotMs: number;
  /** Total snapshots processed */
  snapshotCount: number;
}

// -----------------------------------------------------------------------------
// Initial State
// -----------------------------------------------------------------------------

/** Create initial empty visual state */
export function createInitialVisualState(): VisualState {
  return {
    vids: {},
    screenShare: { active: false },
    layout: 'unknown',
    handRaisedCount: 0,
    lastSnapshotMs: 0,
    snapshotCount: 0,
  };
}

// -----------------------------------------------------------------------------
// Reducer Actions (Immutable Updates)
// -----------------------------------------------------------------------------

/** Add or update a VID in state */
export function setVID(state: VisualState, vidState: VIDState): VisualState {
  return {
    ...state,
    vids: {
      ...state.vids,
      [vidState.vid]: vidState,
    },
  };
}

/** Remove a VID from state */
export function removeVID(state: VisualState, vid: VID): VisualState {
  const { [vid]: removed, ...rest } = state.vids;
  return {
    ...state,
    vids: rest,
  };
}

/** Update signals for a VID */
export function updateVIDSignals(
  state: VisualState,
  vid: VID,
  signals: Partial<VisualSignals>,
  lastSeenMs: number
): VisualState {
  const existing = state.vids[vid];
  if (!existing) return state;

  return setVID(state, {
    ...existing,
    signals: { ...existing.signals, ...signals },
    lastSeenMs,
  });
}

/** Update VID bounding box */
export function updateVIDBBox(
  state: VisualState,
  vid: VID,
  bbox: BBox,
  lastSeenMs: number
): VisualState {
  const existing = state.vids[vid];
  if (!existing) return state;

  return setVID(state, {
    ...existing,
    bbox,
    lastSeenMs,
  });
}

/** Set screen share state */
export function setScreenShare(
  state: VisualState,
  screenShare: ScreenShareState
): VisualState {
  return {
    ...state,
    screenShare,
  };
}

/** Set layout */
export function setLayout(state: VisualState, layout: LayoutType): VisualState {
  return {
    ...state,
    layout,
  };
}

/** Update hand raised count */
export function updateHandRaisedCount(state: VisualState): VisualState {
  const count = Object.values(state.vids).filter(
    (v) => v.signals.handRaised === true
  ).length;
  return {
    ...state,
    handRaisedCount: count,
  };
}

/** Record snapshot metadata */
export function recordSnapshot(state: VisualState, timestampMs: number): VisualState {
  return {
    ...state,
    lastSnapshotMs: timestampMs,
    snapshotCount: state.snapshotCount + 1,
  };
}

/** Link audio SID to VID */
export function linkAudioToVID(
  state: VisualState,
  vid: VID,
  audioSid: AudioSID
): VisualState {
  const existing = state.vids[vid];
  if (!existing) return state;

  return setVID(state, {
    ...existing,
    audioSid,
  });
}

// -----------------------------------------------------------------------------
// Event-Based Reducer
// -----------------------------------------------------------------------------

/**
 * Apply a visual event to state, returning new state
 * This is the main reducer function for external consumption
 */
export function visualStateReducer(
  state: VisualState,
  event: VisualEvent
): VisualState {
  switch (event.type) {
    case 'visual.snapshot_received':
      return recordSnapshot(state, event.ts_obs_ms);

    case 'visual.vid_appeared': {
      const { vid, kind, bbox } = event.payload;
      return setVID(state, {
        vid,
        lastSeenMs: event.ts_obs_ms,
        bbox,
        kind,
        signals: {},
        confidence: event.confidence,
      });
    }

    case 'visual.vid_disappeared': {
      const { vid } = event.payload;
      let newState = removeVID(state, vid);
      // Clear screen share if this VID was presenting
      if (state.screenShare.vid === vid) {
        newState = setScreenShare(newState, { active: false });
      }
      return updateHandRaisedCount(newState);
    }

    case 'visual.hand_raised': {
      const { vid } = event.payload;
      const newState = updateVIDSignals(state, vid, { handRaised: true }, event.ts_obs_ms);
      return updateHandRaisedCount(newState);
    }

    case 'visual.hand_lowered': {
      const { vid } = event.payload;
      const newState = updateVIDSignals(state, vid, { handRaised: false }, event.ts_obs_ms);
      return updateHandRaisedCount(newState);
    }

    case 'visual.screen_share_started': {
      const { vid } = event.payload;
      let newState = updateVIDSignals(state, vid, { isPresenting: true }, event.ts_obs_ms);
      newState = setScreenShare(newState, { active: true, vid });
      return newState;
    }

    case 'visual.screen_share_stopped': {
      const { vid } = event.payload;
      let newState = updateVIDSignals(state, vid, { isPresenting: false }, event.ts_obs_ms);
      newState = setScreenShare(newState, { active: false });
      return newState;
    }

    case 'visual.slide_changed': {
      const { vid, toHash } = event.payload;
      let newState = updateVIDSignals(state, vid, { slideHash: toHash }, event.ts_obs_ms);
      if (state.screenShare.vid === vid) {
        newState = setScreenShare(newState, {
          ...state.screenShare,
          slideHash: toHash,
        });
      }
      return newState;
    }

    case 'visual.layout_changed': {
      return setLayout(state, event.payload.to);
    }

    case 'visual.audio_video_link': {
      const { vid, audio_sid } = event.payload;
      return linkAudioToVID(state, vid, audio_sid);
    }

    default:
      return state;
  }
}

/**
 * Apply multiple events in order
 */
export function applyEvents(state: VisualState, events: VisualEvent[]): VisualState {
  return events.reduce(visualStateReducer, state);
}

// -----------------------------------------------------------------------------
// Selectors
// -----------------------------------------------------------------------------

/** Get all active VIDs */
export function getActiveVIDs(state: VisualState): VIDState[] {
  return Object.values(state.vids);
}

/** Get VIDs with raised hands */
export function getVIDsWithHandsRaised(state: VisualState): VIDState[] {
  return Object.values(state.vids).filter((v) => v.signals.handRaised);
}

/** Get presenting VID if any */
export function getPresentingVID(state: VisualState): VIDState | undefined {
  if (!state.screenShare.active || !state.screenShare.vid) return undefined;
  return state.vids[state.screenShare.vid];
}

/** Get VIDs not seen since a given timestamp */
export function getStaleVIDs(state: VisualState, olderThanMs: number): VIDState[] {
  return Object.values(state.vids).filter((v) => v.lastSeenMs < olderThanMs);
}

/** Count active participants (tiles only) */
export function getParticipantCount(state: VisualState): number {
  return Object.values(state.vids).filter((v) => v.kind === 'tile').length;
}
