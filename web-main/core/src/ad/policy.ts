/**
 * Audio Description Policy Gate
 *
 * Controls when and what audio descriptions are spoken.
 * Implements cooldowns, speech avoidance, and event filtering.
 */

import type { VisualEvent, VisualEventType } from '../events/visual.js';
import type { VisualState } from '../state/visual.js';

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------

export interface ADPolicyConfig {
  /** Whether AD is enabled */
  enabled: boolean;
  /** Verbosity level */
  verbosity: 'minimal' | 'normal';
  /** Avoid speaking over human speech */
  avoidSpeechOverlap: boolean;
  /** Minimum ms between AD announcements */
  globalCooldownMs: number;
  /** Per-event-type cooldowns */
  eventCooldownMs: Partial<Record<VisualEventType, number>>;
  /** Maximum pending announcements before dropping oldest */
  maxPendingAnnouncements: number;
}

export const DEFAULT_AD_POLICY_CONFIG: ADPolicyConfig = {
  enabled: false,
  verbosity: 'normal',
  avoidSpeechOverlap: true,
  globalCooldownMs: 2000,
  eventCooldownMs: {
    'visual.hand_raised': 5000,
    'visual.hand_lowered': 5000,
    'visual.slide_changed': 3000,
    'visual.layout_changed': 10000,
  },
  maxPendingAnnouncements: 5,
};

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

/** Allowed events for AD verbalization */
export type AllowedADEventType =
  | 'visual.hand_raised'
  | 'visual.hand_lowered'
  | 'visual.screen_share_started'
  | 'visual.screen_share_stopped'
  | 'visual.slide_changed'
  | 'visual.layout_changed'
  | 'visual.vid_appeared'
  | 'visual.vid_disappeared';

/** Events that can be verbalized */
export interface AllowedADEvent {
  event: VisualEvent;
  priority: number;
}

/** Audio activity signal interface */
export interface AudioActivitySignal {
  /** Whether human speech is currently detected */
  isSpeechActive: boolean;
  /** Confidence of speech detection */
  confidence: number;
  /** Timestamp of last speech detection */
  lastSpeechMs: number;
}

// -----------------------------------------------------------------------------
// Policy Gate
// -----------------------------------------------------------------------------

export class ADPolicyGate {
  private config: ADPolicyConfig;
  private lastAnnouncementMs: number = 0;
  private lastEventTypeMs: Map<VisualEventType, number> = new Map();
  private pendingAnnouncements: AllowedADEvent[] = [];

  constructor(config: Partial<ADPolicyConfig> = {}) {
    this.config = { ...DEFAULT_AD_POLICY_CONFIG, ...config };
  }

  /** Update configuration */
  updateConfig(config: Partial<ADPolicyConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /** Get current configuration */
  getConfig(): ADPolicyConfig {
    return { ...this.config };
  }

  /**
   * Determine if AD should speak given current state
   */
  shouldSpeakAD(
    worldState: VisualState,
    audioActivity?: AudioActivitySignal
  ): boolean {
    // Must be enabled
    if (!this.config.enabled) return false;

    // No pending announcements
    if (this.pendingAnnouncements.length === 0) return false;

    // Check global cooldown
    const now = Date.now();
    if (now - this.lastAnnouncementMs < this.config.globalCooldownMs) {
      return false;
    }

    // Check speech overlap avoidance
    if (this.config.avoidSpeechOverlap && audioActivity) {
      if (audioActivity.isSpeechActive && audioActivity.confidence > 0.5) {
        return false;
      }
      // Also avoid if speech was very recent (500ms buffer)
      if (now - audioActivity.lastSpeechMs < 500) {
        return false;
      }
    }

    return true;
  }

  /**
   * Select candidate events for AD from a batch
   * Returns prioritized, filtered, deduplicated events
   */
  selectADCandidates(events: VisualEvent[]): AllowedADEvent[] {
    const now = Date.now();
    const candidates: AllowedADEvent[] = [];

    for (const event of events) {
      // Check if event type is allowed for AD
      if (!this.isAllowedEventType(event.type)) continue;

      // Check per-event-type cooldown
      const cooldownMs = this.config.eventCooldownMs[event.type] ?? 0;
      const lastMs = this.lastEventTypeMs.get(event.type) ?? 0;
      if (now - lastMs < cooldownMs) continue;

      // Assign priority based on event type and verbosity
      const priority = this.calculatePriority(event);
      if (priority === 0) continue; // Filtered out by verbosity

      candidates.push({ event, priority });
    }

    // Sort by priority (higher first)
    candidates.sort((a, b) => b.priority - a.priority);

    return candidates;
  }

  /**
   * Add candidates to pending queue
   */
  queueAnnouncements(candidates: AllowedADEvent[]): void {
    this.pendingAnnouncements.push(...candidates);

    // Trim to max pending
    if (this.pendingAnnouncements.length > this.config.maxPendingAnnouncements) {
      // Drop oldest (lowest priority) announcements
      this.pendingAnnouncements = this.pendingAnnouncements
        .slice(-this.config.maxPendingAnnouncements);
    }
  }

  /**
   * Get next announcement to speak
   * Returns undefined if no announcements pending
   */
  getNextAnnouncement(): AllowedADEvent | undefined {
    if (this.pendingAnnouncements.length === 0) return undefined;

    // Get highest priority
    this.pendingAnnouncements.sort((a, b) => b.priority - a.priority);
    const next = this.pendingAnnouncements.shift();

    if (next) {
      const now = Date.now();
      this.lastAnnouncementMs = now;
      this.lastEventTypeMs.set(next.event.type, now);
    }

    return next;
  }

  /**
   * Clear all pending announcements
   */
  clearPending(): void {
    this.pendingAnnouncements = [];
  }

  /**
   * Check if event type is allowed for AD
   */
  private isAllowedEventType(type: VisualEventType): type is AllowedADEventType {
    const allowed: VisualEventType[] = [
      'visual.hand_raised',
      'visual.hand_lowered',
      'visual.screen_share_started',
      'visual.screen_share_stopped',
      'visual.slide_changed',
      'visual.layout_changed',
      'visual.vid_appeared',
      'visual.vid_disappeared',
    ];
    return allowed.includes(type);
  }

  /**
   * Calculate priority for an event based on type and verbosity
   * Returns 0 to filter out the event
   */
  private calculatePriority(event: VisualEvent): number {
    const { verbosity } = this.config;

    // Priority scale: 1-10 (10 = highest)
    const basePriorities: Record<AllowedADEventType, number> = {
      'visual.screen_share_started': 10,
      'visual.screen_share_stopped': 9,
      'visual.hand_raised': 8,
      'visual.hand_lowered': 5,
      'visual.slide_changed': 6,
      'visual.layout_changed': 4,
      'visual.vid_appeared': 3,
      'visual.vid_disappeared': 2,
    };

    const base = basePriorities[event.type as AllowedADEventType] ?? 0;

    // Minimal verbosity: only highest priority events
    if (verbosity === 'minimal') {
      // Only screen share and hand raises
      if (base >= 8) return base;
      return 0;
    }

    // Normal verbosity: all events
    return base;
  }
}
