/**
 * Composite Snapshot Client
 *
 * Creates and sends composite snapshots from meeting UI.
 * Handles tile layout, downscaling, and efficient encoding.
 */

import type { BBox, LayoutType } from '../events/visual.js';
import type { DetectedRegion } from './vid.js';
import { generateFingerprint, averageColor, contentHash } from './fingerprint.js';

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------

export interface SnapshotConfig {
  /** Interval between snapshots in ms */
  intervalMs: number;
  /** Maximum width for composite image */
  maxWidth: number;
  /** JPEG/WebP quality (0-1) */
  quality: number;
  /** Preferred image format */
  format: 'image/jpeg' | 'image/webp';
  /** Enable debug overlay */
  debug: boolean;
}

export const DEFAULT_SNAPSHOT_CONFIG: SnapshotConfig = {
  intervalMs: 5000,
  maxWidth: 640,
  quality: 0.7,
  format: 'image/webp',
  debug: false,
};

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

/** Snapshot payload for API transmission */
export interface SnapshotPayload {
  ts_obs_ms: number;
  content_hash: string;
  mime: string;
  width: number;
  height: number;
  bytes_base64: string;
}

/** Tile source for composite building */
export interface TileSource {
  element: HTMLVideoElement | HTMLCanvasElement;
  isScreenShare: boolean;
  isActiveSpeaker?: boolean;
  handRaised?: boolean;
  cameraOn?: boolean;
}

/** Layout analysis result */
export interface LayoutAnalysis {
  layout: LayoutType;
  regions: DetectedRegion[];
  composite: ImageData;
}

// -----------------------------------------------------------------------------
// Snapshot Client
// -----------------------------------------------------------------------------

export class SnapshotClient {
  private config: SnapshotConfig;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private intervalId: number | null = null;
  private onSnapshot?: (payload: SnapshotPayload, analysis: LayoutAnalysis) => void;

  constructor(config: Partial<SnapshotConfig> = {}) {
    this.config = { ...DEFAULT_SNAPSHOT_CONFIG, ...config };
    this.canvas = document.createElement('canvas');
    const ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Failed to get 2D context');
    this.ctx = ctx;
  }

  /** Start periodic snapshot capture */
  start(
    getTiles: () => TileSource[],
    onSnapshot: (payload: SnapshotPayload, analysis: LayoutAnalysis) => void
  ): void {
    this.onSnapshot = onSnapshot;

    this.intervalId = window.setInterval(() => {
      const tiles = getTiles();
      this.captureAndSend(tiles);
    }, this.config.intervalMs);

    // Capture immediately
    const tiles = getTiles();
    this.captureAndSend(tiles);
  }

  /** Stop snapshot capture */
  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /** Update configuration */
  updateConfig(config: Partial<SnapshotConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /** Capture and analyze a single snapshot */
  capture(tiles: TileSource[]): { payload: SnapshotPayload; analysis: LayoutAnalysis } {
    const analysis = this.buildComposite(tiles);
    const payload = this.encodePayload(analysis.composite);
    return { payload, analysis };
  }

  /** Capture and send via callback */
  private captureAndSend(tiles: TileSource[]): void {
    if (!this.onSnapshot || tiles.length === 0) return;

    try {
      const { payload, analysis } = this.capture(tiles);
      this.onSnapshot(payload, analysis);
    } catch (err) {
      console.error('[SnapshotClient] Capture failed:', err);
    }
  }

  /**
   * Build composite image from tiles
   */
  private buildComposite(tiles: TileSource[]): LayoutAnalysis {
    const screenShares = tiles.filter((t) => t.isScreenShare);
    const participants = tiles.filter((t) => !t.isScreenShare);

    // Determine layout
    let layout: LayoutType = 'unknown';
    if (screenShares.length > 0) {
      layout = 'presentation';
    } else if (participants.length === 1) {
      layout = 'speaker';
    } else if (participants.length > 1) {
      layout = 'grid';
    }

    // Calculate composite dimensions
    const { width, height, tileLayout } = this.calculateLayout(
      participants.length,
      screenShares.length > 0
    );

    this.canvas.width = width;
    this.canvas.height = height;

    // Clear canvas
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, width, height);

    const regions: DetectedRegion[] = [];

    // Draw screen share if present
    if (screenShares.length > 0) {
      const screenTile = screenShares[0];
      const screenBBox = tileLayout.screenShare!;

      this.drawTile(screenTile.element, screenBBox, width, height);

      regions.push(this.analyzeRegion(screenBBox, screenTile, width, height));
    }

    // Draw participant tiles
    participants.forEach((tile, index) => {
      const bbox = tileLayout.participants[index];
      if (bbox) {
        this.drawTile(tile.element, bbox, width, height);
        regions.push(this.analyzeRegion(bbox, tile, width, height));
      }
    });

    // Debug overlay
    if (this.config.debug) {
      this.drawDebugOverlay(regions, width, height);
    }

    const composite = this.ctx.getImageData(0, 0, width, height);

    return { layout, regions, composite };
  }

  /**
   * Calculate tile layout positions
   */
  private calculateLayout(
    participantCount: number,
    hasScreenShare: boolean
  ): {
    width: number;
    height: number;
    tileLayout: {
      screenShare?: BBox;
      participants: BBox[];
    };
  } {
    const maxW = this.config.maxWidth;
    const aspectRatio = 16 / 9;

    if (hasScreenShare) {
      // Presentation layout: screen share takes 70%, participants in sidebar
      const height = Math.round(maxW / aspectRatio);
      const screenW = 0.7;
      const sidebarW = 0.3;

      const participants: BBox[] = [];
      const thumbH = 1 / Math.max(participantCount, 1);

      for (let i = 0; i < participantCount; i++) {
        participants.push({
          x: screenW,
          y: i * thumbH,
          w: sidebarW,
          h: thumbH,
        });
      }

      return {
        width: maxW,
        height,
        tileLayout: {
          screenShare: { x: 0, y: 0, w: screenW, h: 1 },
          participants,
        },
      };
    }

    // Grid layout
    const cols = Math.ceil(Math.sqrt(participantCount));
    const rows = Math.ceil(participantCount / cols);
    const tileW = 1 / cols;
    const tileH = 1 / rows;
    const height = Math.round(maxW / aspectRatio);

    const participants: BBox[] = [];
    for (let i = 0; i < participantCount; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      participants.push({
        x: col * tileW,
        y: row * tileH,
        w: tileW,
        h: tileH,
      });
    }

    return {
      width: maxW,
      height,
      tileLayout: { participants },
    };
  }

  /**
   * Draw a tile onto the composite
   */
  private drawTile(
    element: HTMLVideoElement | HTMLCanvasElement,
    bbox: BBox,
    compositeW: number,
    compositeH: number
  ): void {
    const x = Math.round(bbox.x * compositeW);
    const y = Math.round(bbox.y * compositeH);
    const w = Math.round(bbox.w * compositeW);
    const h = Math.round(bbox.h * compositeH);

    try {
      this.ctx.drawImage(element, x, y, w, h);
    } catch {
      // Draw placeholder if video not available
      this.ctx.fillStyle = '#333';
      this.ctx.fillRect(x, y, w, h);
    }
  }

  /**
   * Analyze a region for signals
   */
  private analyzeRegion(
    bbox: BBox,
    tile: TileSource,
    width: number,
    height: number
  ): DetectedRegion {
    // Get image data for fingerprinting
    const x = Math.round(bbox.x * width);
    const y = Math.round(bbox.y * height);
    const w = Math.round(bbox.w * width);
    const h = Math.round(bbox.h * height);

    let colorHex: string | undefined;
    try {
      const regionData = this.ctx.getImageData(x, y, w, h);
      colorHex = averageColor(
        regionData.data,
        w,
        { x: 0.3, y: 0.3, w: 0.4, h: 0.4 } // Center region
      );
    } catch {
      // Ignore if can't read pixel data
    }

    const fingerprint = generateFingerprint(bbox, colorHex);

    return {
      bbox,
      kind: tile.isScreenShare ? 'screen_share' : 'tile',
      fingerprint,
      signals: {
        handRaised: tile.handRaised,
        cameraOn: tile.cameraOn,
        isActiveSpeaker: tile.isActiveSpeaker,
        isPresenting: tile.isScreenShare,
      },
    };
  }

  /**
   * Draw debug overlay with bbox outlines
   */
  private drawDebugOverlay(regions: DetectedRegion[], width: number, height: number): void {
    this.ctx.strokeStyle = '#0f0';
    this.ctx.lineWidth = 2;
    this.ctx.font = '12px monospace';

    for (const region of regions) {
      const x = region.bbox.x * width;
      const y = region.bbox.y * height;
      const w = region.bbox.w * width;
      const h = region.bbox.h * height;

      this.ctx.strokeRect(x, y, w, h);

      // Label
      this.ctx.fillStyle = '#0f0';
      this.ctx.fillText(region.kind, x + 4, y + 14);

      // Signal indicators
      const signals: string[] = [];
      if (region.signals.handRaised) signals.push('HAND');
      if (region.signals.isActiveSpeaker) signals.push('SPEAK');
      if (signals.length > 0) {
        this.ctx.fillText(signals.join(' '), x + 4, y + 28);
      }
    }
  }

  /**
   * Encode composite to payload
   */
  private encodePayload(composite: ImageData): SnapshotPayload {
    // Put image data back on canvas for encoding
    this.ctx.putImageData(composite, 0, 0);

    const dataUrl = this.canvas.toDataURL(this.config.format, this.config.quality);
    const base64 = dataUrl.split(',')[1] || '';
    const hash = contentHash(base64.substring(0, 1000)); // Hash first 1KB

    return {
      ts_obs_ms: Date.now(),
      content_hash: hash,
      mime: this.config.format,
      width: composite.width,
      height: composite.height,
      bytes_base64: base64,
    };
  }
}

// -----------------------------------------------------------------------------
// Mock Analyzer Interface
// -----------------------------------------------------------------------------

/**
 * Interface for snapshot analysis (to be implemented by backend)
 * Used for local testing and offline mode
 */
export interface SnapshotAnalyzer {
  analyze(payload: SnapshotPayload): Promise<{
    regions: DetectedRegion[];
    layout: LayoutType;
  }>;
}

/**
 * Mock analyzer that returns the client-side analysis
 * Use this when backend analysis is not available
 */
export class LocalSnapshotAnalyzer implements SnapshotAnalyzer {
  private lastAnalysis: LayoutAnalysis | null = null;

  setLastAnalysis(analysis: LayoutAnalysis): void {
    this.lastAnalysis = analysis;
  }

  async analyze(_payload: SnapshotPayload): Promise<{
    regions: DetectedRegion[];
    layout: LayoutType;
  }> {
    if (!this.lastAnalysis) {
      return { regions: [], layout: 'unknown' };
    }
    return {
      regions: this.lastAnalysis.regions,
      layout: this.lastAnalysis.layout,
    };
  }
}
