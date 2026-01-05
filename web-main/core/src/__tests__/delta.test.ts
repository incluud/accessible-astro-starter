/**
 * Delta Detection Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { VisualDeltaDetector } from '../visual/delta.js';
import { createInitialVisualState, type VisualState } from '../state/visual.js';
import type { DetectedRegion } from '../visual/vid.js';
import { resetEventIdCounter } from '../events/visual.js';

describe('VisualDeltaDetector', () => {
  let detector: VisualDeltaDetector;
  let initialState: VisualState;

  beforeEach(() => {
    detector = new VisualDeltaDetector({ debounceSnapshots: 2 });
    detector.reset();
    initialState = createInitialVisualState();
    resetEventIdCounter();
  });

  describe('hand raise detection', () => {
    it('should emit hand_raised after debounce threshold', () => {
      const regions: DetectedRegion[] = [
        {
          bbox: { x: 0, y: 0, w: 0.5, h: 0.5 },
          kind: 'tile',
          fingerprint: 'POS:0044',
          signals: { handRaised: true },
        },
      ];

      // First snapshot - creates VID, starts pending for hand_raised (count=1)
      const result1 = detector.computeDeltas(
        initialState,
        regions,
        'grid',
        1000,
        'hash1',
        640,
        360
      );

      // Should have vid_appeared but not hand_raised (first observation, count=1)
      const appearedEvents = result1.events.filter((e) => e.type === 'visual.vid_appeared');
      expect(appearedEvents).toHaveLength(1);

      const handRaisedEvents1 = result1.events.filter((e) => e.type === 'visual.hand_raised');
      expect(handRaisedEvents1).toHaveLength(0);

      // Second snapshot - debounce threshold met (count=2 >= 2)
      const result2 = detector.computeDeltas(
        result1.nextState,
        regions,
        'grid',
        2000,
        'hash2',
        640,
        360
      );

      const handRaisedEvents2 = result2.events.filter((e) => e.type === 'visual.hand_raised');
      expect(handRaisedEvents2).toHaveLength(1);
    });

    it('should emit hand_lowered when hand goes down after being raised', () => {
      const regionsUp: DetectedRegion[] = [
        {
          bbox: { x: 0, y: 0, w: 0.5, h: 0.5 },
          kind: 'tile',
          fingerprint: 'POS:0044',
          signals: { handRaised: true },
        },
      ];

      const regionsDown: DetectedRegion[] = [
        {
          bbox: { x: 0, y: 0, w: 0.5, h: 0.5 },
          kind: 'tile',
          fingerprint: 'POS:0044',
          signals: { handRaised: false },
        },
      ];

      // Raise hand through debounce (2 snapshots)
      const result1 = detector.computeDeltas(initialState, regionsUp, 'grid', 1000, 'hash1', 640, 360);
      const result2 = detector.computeDeltas(result1.nextState, regionsUp, 'grid', 2000, 'hash2', 640, 360);

      // Verify hand is now raised
      const handRaisedEvents = result2.events.filter((e) => e.type === 'visual.hand_raised');
      expect(handRaisedEvents).toHaveLength(1);

      // Lower hand (2 snapshots to confirm)
      const result3 = detector.computeDeltas(result2.nextState, regionsDown, 'grid', 3000, 'hash3', 640, 360);
      const result4 = detector.computeDeltas(result3.nextState, regionsDown, 'grid', 4000, 'hash4', 640, 360);

      const handLoweredEvents = result4.events.filter((e) => e.type === 'visual.hand_lowered');
      expect(handLoweredEvents).toHaveLength(1);
    });

    it('should emit exactly one hand_raised event per raise', () => {
      const regionsUp: DetectedRegion[] = [
        {
          bbox: { x: 0, y: 0, w: 0.5, h: 0.5 },
          kind: 'tile',
          fingerprint: 'POS:0044',
          signals: { handRaised: true },
        },
      ];

      let state = initialState;
      let totalHandRaised = 0;

      // Multiple snapshots with hand raised
      for (let i = 0; i < 10; i++) {
        const result = detector.computeDeltas(state, regionsUp, 'grid', 1000 + i * 1000, `hash${i}`, 640, 360);
        totalHandRaised += result.events.filter((e) => e.type === 'visual.hand_raised').length;
        state = result.nextState;
      }

      // Should only emit once (on 2nd snapshot when threshold is met)
      expect(totalHandRaised).toBe(1);
    });
  });

  describe('slide change detection', () => {
    it('should emit slide_changed when hash changes', () => {
      // First we need to establish isPresenting through debounce
      const regions1: DetectedRegion[] = [
        {
          bbox: { x: 0, y: 0, w: 0.7, h: 1 },
          kind: 'screen_share',
          fingerprint: 'POS:0071',
          signals: { isPresenting: true, slideHash: 'slide001' },
        },
      ];

      // First two snapshots to confirm isPresenting (debounce threshold = 2)
      const result1 = detector.computeDeltas(
        initialState,
        regions1,
        'presentation',
        1000,
        'hash1',
        640,
        360
      );

      const result2 = detector.computeDeltas(
        result1.nextState,
        regions1,
        'presentation',
        2000,
        'hash2',
        640,
        360
      );

      // Now isPresenting is confirmed, and slide001 is tracked

      // Change slide hash
      const regions2: DetectedRegion[] = [
        {
          bbox: { x: 0, y: 0, w: 0.7, h: 1 },
          kind: 'screen_share',
          fingerprint: 'POS:0071',
          signals: { isPresenting: true, slideHash: 'slide002' },
        },
      ];

      const result3 = detector.computeDeltas(
        result2.nextState,
        regions2,
        'presentation',
        3000,
        'hash3',
        640,
        360
      );

      const slideChangedEvents = result3.events.filter((e) => e.type === 'visual.slide_changed');
      expect(slideChangedEvents).toHaveLength(1);
      if (slideChangedEvents[0].type === 'visual.slide_changed') {
        expect(slideChangedEvents[0].payload.toHash).toBe('slide002');
      }
    });
  });

  describe('VID lifecycle', () => {
    it('should emit vid_disappeared when VID expires', () => {
      const detector = new VisualDeltaDetector({
        debounceSnapshots: 2,
        vid: { expireMs: 5000 },
      });
      detector.reset();

      const regions: DetectedRegion[] = [
        {
          bbox: { x: 0, y: 0, w: 0.5, h: 0.5 },
          kind: 'tile',
          fingerprint: 'POS:0044',
          signals: {},
        },
      ];

      const result1 = detector.computeDeltas(
        initialState,
        regions,
        'grid',
        1000,
        'hash1',
        640,
        360
      );

      // Empty regions after expiry
      const result2 = detector.computeDeltas(
        result1.nextState,
        [],
        'grid',
        10000,
        'hash2',
        640,
        360
      );

      const disappearedEvents = result2.events.filter((e) => e.type === 'visual.vid_disappeared');
      expect(disappearedEvents).toHaveLength(1);
    });
  });

  describe('layout change detection', () => {
    it('should emit layout_changed when layout changes', () => {
      const regions: DetectedRegion[] = [
        {
          bbox: { x: 0, y: 0, w: 0.5, h: 0.5 },
          kind: 'tile',
          fingerprint: 'POS:0044',
          signals: {},
        },
      ];

      const result1 = detector.computeDeltas(
        initialState,
        regions,
        'grid',
        1000,
        'hash1',
        640,
        360
      );

      const result2 = detector.computeDeltas(
        result1.nextState,
        regions,
        'speaker',
        2000,
        'hash2',
        640,
        360
      );

      const layoutEvents = result2.events.filter((e) => e.type === 'visual.layout_changed');
      expect(layoutEvents).toHaveLength(1);
      if (layoutEvents[0].type === 'visual.layout_changed') {
        expect(layoutEvents[0].payload.from).toBe('grid');
        expect(layoutEvents[0].payload.to).toBe('speaker');
      }
    });
  });
});
