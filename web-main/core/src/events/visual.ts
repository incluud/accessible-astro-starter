/**
 * Visual Delta Event Types and Schemas
 *
 * All events are append-only with stable IDs and explicit timestamps.
 * VID (Video SID) is a session-local visual continuity handle, NOT identity.
 */

// -----------------------------------------------------------------------------
// Core Types
// -----------------------------------------------------------------------------

/** Video Session ID - session-local visual continuity handle */
export type VID = `v${number}`;

/** Audio Session ID reference for cross-modal linking */
export type AudioSID = string;

/** Normalized bounding box [0..1] relative to composite */
export interface BBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Region classification */
export type RegionKind = 'tile' | 'screen_share' | 'unknown';

/** Meeting layout types */
export type LayoutType = 'grid' | 'speaker' | 'presentation' | 'unknown';

/** Confidence score 0..1 */
export type Confidence = number;

// -----------------------------------------------------------------------------
// Visual Signals
// -----------------------------------------------------------------------------

/** Observable signals for a visual region */
export interface VisualSignals {
  handRaised?: boolean;
  cameraOn?: boolean;
  isActiveSpeaker?: boolean;
  isPresenting?: boolean;
  slideHash?: string;
}

// -----------------------------------------------------------------------------
// Base Event
// -----------------------------------------------------------------------------

/** Common fields for all visual events */
export interface BaseVisualEvent {
  /** Monotonic event ID per session */
  id: number;
  /** Timestamp when event was emitted (ms since epoch) */
  ts_emit_ms: number;
  /** Timestamp when change was observed in snapshot (ms since epoch) */
  ts_obs_ms: number;
  /** Event source identifier */
  source: 'visual_delta';
  /** Confidence score 0..1 */
  confidence: Confidence;
}

// -----------------------------------------------------------------------------
// Event Types
// -----------------------------------------------------------------------------

export interface SnapshotReceivedEvent extends BaseVisualEvent {
  type: 'visual.snapshot_received';
  payload: {
    content_hash: string;
    width: number;
    height: number;
    region_count: number;
  };
}

export interface VIDAppearedEvent extends BaseVisualEvent {
  type: 'visual.vid_appeared';
  payload: {
    vid: VID;
    kind: RegionKind;
    bbox: BBox;
  };
}

export interface VIDDisappearedEvent extends BaseVisualEvent {
  type: 'visual.vid_disappeared';
  payload: {
    vid: VID;
  };
}

export interface HandRaisedEvent extends BaseVisualEvent {
  type: 'visual.hand_raised';
  payload: {
    vid: VID;
  };
}

export interface HandLoweredEvent extends BaseVisualEvent {
  type: 'visual.hand_lowered';
  payload: {
    vid: VID;
  };
}

export interface ScreenShareStartedEvent extends BaseVisualEvent {
  type: 'visual.screen_share_started';
  payload: {
    vid: VID;
  };
}

export interface ScreenShareStoppedEvent extends BaseVisualEvent {
  type: 'visual.screen_share_stopped';
  payload: {
    vid: VID;
  };
}

export interface SlideChangedEvent extends BaseVisualEvent {
  type: 'visual.slide_changed';
  payload: {
    vid: VID;
    fromHash?: string;
    toHash: string;
  };
}

export interface LayoutChangedEvent extends BaseVisualEvent {
  type: 'visual.layout_changed';
  payload: {
    from: LayoutType;
    to: LayoutType;
  };
}

export interface AudioVideoLinkEvent extends BaseVisualEvent {
  type: 'visual.audio_video_link';
  payload: {
    audio_sid: AudioSID;
    vid: VID;
    confidence: Confidence;
  };
}

/** Union of all visual event types */
export type VisualEvent =
  | SnapshotReceivedEvent
  | VIDAppearedEvent
  | VIDDisappearedEvent
  | HandRaisedEvent
  | HandLoweredEvent
  | ScreenShareStartedEvent
  | ScreenShareStoppedEvent
  | SlideChangedEvent
  | LayoutChangedEvent
  | AudioVideoLinkEvent;

/** All visual event type strings */
export type VisualEventType = VisualEvent['type'];

// -----------------------------------------------------------------------------
// Event Factory
// -----------------------------------------------------------------------------

let eventIdCounter = 0;

/** Reset event ID counter (for testing) */
export function resetEventIdCounter(): void {
  eventIdCounter = 0;
}

/** Create base event fields */
function createBaseEvent(ts_obs_ms: number, confidence: Confidence): BaseVisualEvent {
  return {
    id: ++eventIdCounter,
    ts_emit_ms: Date.now(),
    ts_obs_ms,
    source: 'visual_delta',
    confidence,
  };
}

/** Event factory functions */
export const VisualEvents = {
  snapshotReceived(
    ts_obs_ms: number,
    content_hash: string,
    width: number,
    height: number,
    region_count: number,
    confidence: Confidence = 1.0
  ): SnapshotReceivedEvent {
    return {
      ...createBaseEvent(ts_obs_ms, confidence),
      type: 'visual.snapshot_received',
      payload: { content_hash, width, height, region_count },
    };
  },

  vidAppeared(
    ts_obs_ms: number,
    vid: VID,
    kind: RegionKind,
    bbox: BBox,
    confidence: Confidence = 1.0
  ): VIDAppearedEvent {
    return {
      ...createBaseEvent(ts_obs_ms, confidence),
      type: 'visual.vid_appeared',
      payload: { vid, kind, bbox },
    };
  },

  vidDisappeared(ts_obs_ms: number, vid: VID, confidence: Confidence = 1.0): VIDDisappearedEvent {
    return {
      ...createBaseEvent(ts_obs_ms, confidence),
      type: 'visual.vid_disappeared',
      payload: { vid },
    };
  },

  handRaised(ts_obs_ms: number, vid: VID, confidence: Confidence = 1.0): HandRaisedEvent {
    return {
      ...createBaseEvent(ts_obs_ms, confidence),
      type: 'visual.hand_raised',
      payload: { vid },
    };
  },

  handLowered(ts_obs_ms: number, vid: VID, confidence: Confidence = 1.0): HandLoweredEvent {
    return {
      ...createBaseEvent(ts_obs_ms, confidence),
      type: 'visual.hand_lowered',
      payload: { vid },
    };
  },

  screenShareStarted(
    ts_obs_ms: number,
    vid: VID,
    confidence: Confidence = 1.0
  ): ScreenShareStartedEvent {
    return {
      ...createBaseEvent(ts_obs_ms, confidence),
      type: 'visual.screen_share_started',
      payload: { vid },
    };
  },

  screenShareStopped(
    ts_obs_ms: number,
    vid: VID,
    confidence: Confidence = 1.0
  ): ScreenShareStoppedEvent {
    return {
      ...createBaseEvent(ts_obs_ms, confidence),
      type: 'visual.screen_share_stopped',
      payload: { vid },
    };
  },

  slideChanged(
    ts_obs_ms: number,
    vid: VID,
    toHash: string,
    fromHash?: string,
    confidence: Confidence = 1.0
  ): SlideChangedEvent {
    return {
      ...createBaseEvent(ts_obs_ms, confidence),
      type: 'visual.slide_changed',
      payload: { vid, fromHash, toHash },
    };
  },

  layoutChanged(
    ts_obs_ms: number,
    from: LayoutType,
    to: LayoutType,
    confidence: Confidence = 1.0
  ): LayoutChangedEvent {
    return {
      ...createBaseEvent(ts_obs_ms, confidence),
      type: 'visual.layout_changed',
      payload: { from, to },
    };
  },

  audioVideoLink(
    ts_obs_ms: number,
    audio_sid: AudioSID,
    vid: VID,
    confidence: Confidence
  ): AudioVideoLinkEvent {
    return {
      ...createBaseEvent(ts_obs_ms, confidence),
      type: 'visual.audio_video_link',
      payload: { audio_sid, vid, confidence },
    };
  },
};
