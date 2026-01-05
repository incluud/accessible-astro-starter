/**
 * AD Policy Gate Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ADPolicyGate } from '../ad/policy.js';
import { VisualEvents, resetEventIdCounter, type VID } from '../events/visual.js';
import { createInitialVisualState } from '../state/visual.js';

describe('ADPolicyGate', () => {
  let policy: ADPolicyGate;

  beforeEach(() => {
    resetEventIdCounter();
    policy = new ADPolicyGate({
      enabled: true,
      globalCooldownMs: 1000,
      eventCooldownMs: {},
    });
  });

  describe('shouldSpeakAD', () => {
    it('should return false when disabled', () => {
      policy.updateConfig({ enabled: false });
      const state = createInitialVisualState();

      expect(policy.shouldSpeakAD(state)).toBe(false);
    });

    it('should return false when no pending announcements', () => {
      const state = createInitialVisualState();

      expect(policy.shouldSpeakAD(state)).toBe(false);
    });

    it('should return true when enabled with pending announcements', () => {
      const state = createInitialVisualState();
      const event = VisualEvents.handRaised(1000, 'v1' as VID);

      policy.queueAnnouncements([{ event, priority: 8 }]);

      expect(policy.shouldSpeakAD(state)).toBe(true);
    });

    it('should respect speech overlap avoidance', () => {
      const state = createInitialVisualState();
      const event = VisualEvents.handRaised(1000, 'v1' as VID);

      policy.queueAnnouncements([{ event, priority: 8 }]);

      const audioActivity = {
        isSpeechActive: true,
        confidence: 0.9,
        lastSpeechMs: Date.now(),
      };

      expect(policy.shouldSpeakAD(state, audioActivity)).toBe(false);
    });
  });

  describe('selectADCandidates', () => {
    it('should filter out non-AD event types', () => {
      const events = [
        VisualEvents.snapshotReceived(1000, 'hash', 640, 360, 3),
        VisualEvents.handRaised(1000, 'v1' as VID),
      ];

      const candidates = policy.selectADCandidates(events);

      expect(candidates).toHaveLength(1);
      expect(candidates[0].event.type).toBe('visual.hand_raised');
    });

    it('should respect event type cooldowns', () => {
      policy.updateConfig({
        eventCooldownMs: { 'visual.hand_raised': 10000 },
      });

      const events1 = [VisualEvents.handRaised(1000, 'v1' as VID)];
      const candidates1 = policy.selectADCandidates(events1);
      expect(candidates1).toHaveLength(1);

      // Mark as announced
      policy.queueAnnouncements(candidates1);
      policy.getNextAnnouncement();

      // Immediate second event should be filtered
      const events2 = [VisualEvents.handRaised(2000, 'v2' as VID)];
      const candidates2 = policy.selectADCandidates(events2);
      expect(candidates2).toHaveLength(0);
    });

    it('should prioritize events correctly', () => {
      const events = [
        VisualEvents.handRaised(1000, 'v1' as VID),
        VisualEvents.screenShareStarted(1000, 'v2' as VID),
        VisualEvents.slideChanged(1000, 'v2' as VID, 'slide2', 'slide1'),
      ];

      const candidates = policy.selectADCandidates(events);

      // Screen share should be highest priority
      expect(candidates[0].event.type).toBe('visual.screen_share_started');
      expect(candidates[1].event.type).toBe('visual.hand_raised');
      expect(candidates[2].event.type).toBe('visual.slide_changed');
    });
  });

  describe('verbosity filtering', () => {
    it('should filter low-priority events in minimal mode', () => {
      policy.updateConfig({ verbosity: 'minimal' });

      const events = [
        VisualEvents.handRaised(1000, 'v1' as VID),
        VisualEvents.slideChanged(1000, 'v2' as VID, 'slide2'),
        VisualEvents.layoutChanged(1000, 'grid', 'speaker'),
      ];

      const candidates = policy.selectADCandidates(events);

      // Only hand raised (priority >= 8) should pass
      expect(candidates).toHaveLength(1);
      expect(candidates[0].event.type).toBe('visual.hand_raised');
    });

    it('should allow all allowed events in normal mode', () => {
      policy.updateConfig({ verbosity: 'normal' });

      const events = [
        VisualEvents.handRaised(1000, 'v1' as VID),
        VisualEvents.slideChanged(1000, 'v2' as VID, 'slide2'),
        VisualEvents.layoutChanged(1000, 'grid', 'speaker'),
      ];

      const candidates = policy.selectADCandidates(events);

      expect(candidates).toHaveLength(3);
    });
  });

  describe('queue management', () => {
    it('should limit pending announcements', () => {
      policy.updateConfig({ maxPendingAnnouncements: 3 });

      const events = [];
      for (let i = 0; i < 5; i++) {
        events.push(VisualEvents.handRaised(1000 + i, `v${i}` as VID));
      }

      const candidates = policy.selectADCandidates(events);
      policy.queueAnnouncements(candidates);

      // Should only have 3 announcements
      let count = 0;
      while (policy.getNextAnnouncement()) {
        count++;
      }

      expect(count).toBe(3);
    });

    it('should clear pending on clearPending()', () => {
      const event = VisualEvents.handRaised(1000, 'v1' as VID);
      policy.queueAnnouncements([{ event, priority: 8 }]);

      policy.clearPending();

      expect(policy.getNextAnnouncement()).toBeUndefined();
    });
  });
});
