/**
 * VID Tracker Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { VIDTracker, type DetectedRegion } from '../visual/vid.js';
import type { BBox } from '../events/visual.js';

describe('VIDTracker', () => {
  let tracker: VIDTracker;

  beforeEach(() => {
    tracker = new VIDTracker();
    tracker.reset();
  });

  describe('VID minting', () => {
    it('should mint new VIDs for new regions', () => {
      const regions: DetectedRegion[] = [
        {
          bbox: { x: 0, y: 0, w: 0.5, h: 0.5 },
          kind: 'tile',
          fingerprint: 'POS:0044',
          signals: {},
        },
      ];

      const result = tracker.processRegions(regions, 1000);

      expect(result.appeared).toHaveLength(1);
      expect(result.appeared[0]).toBe('v1');
      expect(result.assignments.get(regions[0])).toBe('v1');
    });

    it('should mint sequential VIDs', () => {
      const regions: DetectedRegion[] = [
        { bbox: { x: 0, y: 0, w: 0.5, h: 0.5 }, kind: 'tile', fingerprint: 'POS:0044', signals: {} },
        { bbox: { x: 0.5, y: 0, w: 0.5, h: 0.5 }, kind: 'tile', fingerprint: 'POS:5044', signals: {} },
      ];

      const result = tracker.processRegions(regions, 1000);

      expect(result.appeared).toContain('v1');
      expect(result.appeared).toContain('v2');
    });
  });

  describe('VID matching', () => {
    it('should match regions to existing VIDs with similar bbox', () => {
      // First snapshot
      const regions1: DetectedRegion[] = [
        { bbox: { x: 0, y: 0, w: 0.5, h: 0.5 }, kind: 'tile', fingerprint: 'POS:0044', signals: {} },
      ];
      tracker.processRegions(regions1, 1000);

      // Second snapshot with slightly moved bbox
      const regions2: DetectedRegion[] = [
        { bbox: { x: 0.02, y: 0.01, w: 0.5, h: 0.5 }, kind: 'tile', fingerprint: 'POS:0044', signals: {} },
      ];
      const result = tracker.processRegions(regions2, 2000);

      expect(result.appeared).toHaveLength(0);
      expect(result.updated).toContain('v1');
      expect(result.assignments.get(regions2[0])).toBe('v1');
    });

    it('should NOT match regions with different kinds', () => {
      const regions1: DetectedRegion[] = [
        { bbox: { x: 0, y: 0, w: 0.5, h: 0.5 }, kind: 'tile', fingerprint: 'POS:0044', signals: {} },
      ];
      tracker.processRegions(regions1, 1000);

      // Same position but different kind
      const regions2: DetectedRegion[] = [
        { bbox: { x: 0, y: 0, w: 0.5, h: 0.5 }, kind: 'screen_share', fingerprint: 'POS:0044', signals: {} },
      ];
      const result = tracker.processRegions(regions2, 2000);

      expect(result.appeared).toContain('v2');
    });

    it('should mint new VID when bbox drifts too far', () => {
      const regions1: DetectedRegion[] = [
        { bbox: { x: 0, y: 0, w: 0.5, h: 0.5 }, kind: 'tile', fingerprint: 'POS:0044', signals: {} },
      ];
      tracker.processRegions(regions1, 1000);

      // Large position change
      const regions2: DetectedRegion[] = [
        { bbox: { x: 0.5, y: 0.5, w: 0.5, h: 0.5 }, kind: 'tile', fingerprint: 'POS:5544', signals: {} },
      ];
      const result = tracker.processRegions(regions2, 2000);

      expect(result.appeared).toContain('v2');
    });
  });

  describe('VID expiration', () => {
    it('should expire VIDs not seen for expireMs', () => {
      const tracker = new VIDTracker({ expireMs: 5000 });

      const regions1: DetectedRegion[] = [
        { bbox: { x: 0, y: 0, w: 0.5, h: 0.5 }, kind: 'tile', fingerprint: 'POS:0044', signals: {} },
      ];
      tracker.processRegions(regions1, 1000);

      // Empty regions after expiry period
      const result = tracker.processRegions([], 7000);

      expect(result.expired).toContain('v1');
      expect(tracker.size).toBe(0);
    });

    it('should NOT expire VIDs before expireMs', () => {
      const tracker = new VIDTracker({ expireMs: 10000 });

      const regions1: DetectedRegion[] = [
        { bbox: { x: 0, y: 0, w: 0.5, h: 0.5 }, kind: 'tile', fingerprint: 'POS:0044', signals: {} },
      ];
      tracker.processRegions(regions1, 1000);

      // Check before expiry
      const result = tracker.processRegions([], 5000);

      expect(result.expired).toHaveLength(0);
      expect(tracker.size).toBe(1);
    });
  });
});
