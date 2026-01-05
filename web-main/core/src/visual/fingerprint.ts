/**
 * Visual Fingerprinting
 *
 * Generates coarse, non-biometric fingerprints for visual continuity matching.
 * Uses position buckets and low-res color averages - NOT face embeddings.
 */

import type { BBox } from '../events/visual.js';

// -----------------------------------------------------------------------------
// Fingerprint Generation
// -----------------------------------------------------------------------------

/**
 * Generate a fingerprint from bbox and optional pixel data
 * Format: "POS:XX-YY-WW-HH|CLR:RRGGBB"
 *
 * Position bucket uses 10x10 grid (0-9 for each dimension)
 * Color is optional average RGB from region center
 */
export function generateFingerprint(
  bbox: BBox,
  colorHex?: string
): string {
  // Position buckets (0-9)
  const px = Math.floor(bbox.x * 10);
  const py = Math.floor(bbox.y * 10);
  const pw = Math.floor(bbox.w * 10);
  const ph = Math.floor(bbox.h * 10);

  const posStr = `POS:${px}${py}${pw}${ph}`;

  if (colorHex) {
    return `${posStr}|CLR:${colorHex}`;
  }

  return posStr;
}

/**
 * Generate a perceptual hash for slide content
 * Uses a simple downsampling approach
 *
 * This is a placeholder - in production, use a proper
 * perceptual hash algorithm (pHash, dHash, etc.)
 */
export function generateSlideHash(
  imageData: Uint8ClampedArray,
  width: number,
  height: number
): string {
  // Downsample to 8x8 grid
  const gridSize = 8;
  const cellWidth = Math.floor(width / gridSize);
  const cellHeight = Math.floor(height / gridSize);

  let hash = '';

  for (let gy = 0; gy < gridSize; gy++) {
    for (let gx = 0; gx < gridSize; gx++) {
      // Sample center of each cell
      const cx = gx * cellWidth + Math.floor(cellWidth / 2);
      const cy = gy * cellHeight + Math.floor(cellHeight / 2);
      const idx = (cy * width + cx) * 4;

      // Average RGB to grayscale
      const gray = Math.floor(
        (imageData[idx] + imageData[idx + 1] + imageData[idx + 2]) / 3
      );

      // Quantize to hex digit (0-F)
      hash += Math.floor(gray / 16).toString(16);
    }
  }

  return hash;
}

/**
 * Simple content hash using string hashing
 * For when we don't have raw pixel access
 */
export function contentHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Calculate average color from image data region
 * Returns hex string like "A0B0C0"
 */
export function averageColor(
  imageData: Uint8ClampedArray,
  width: number,
  bbox: BBox
): string {
  const startX = Math.floor(bbox.x * width);
  const startY = Math.floor(bbox.y * (imageData.length / 4 / width));
  const regionWidth = Math.floor(bbox.w * width);
  const regionHeight = Math.floor(bbox.h * (imageData.length / 4 / width));

  let r = 0,
    g = 0,
    b = 0,
    count = 0;

  // Sample every 4th pixel for performance
  for (let y = startY; y < startY + regionHeight; y += 4) {
    for (let x = startX; x < startX + regionWidth; x += 4) {
      const idx = (y * width + x) * 4;
      if (idx + 2 < imageData.length) {
        r += imageData[idx];
        g += imageData[idx + 1];
        b += imageData[idx + 2];
        count++;
      }
    }
  }

  if (count === 0) return '808080';

  const avgR = Math.floor(r / count)
    .toString(16)
    .padStart(2, '0');
  const avgG = Math.floor(g / count)
    .toString(16)
    .padStart(2, '0');
  const avgB = Math.floor(b / count)
    .toString(16)
    .padStart(2, '0');

  return `${avgR}${avgG}${avgB}`;
}

/**
 * Compare two hashes and return similarity (0..1)
 */
export function hashSimilarity(a: string, b: string): number {
  if (a === b) return 1.0;
  if (!a || !b) return 0;

  // For position-based fingerprints, parse and compare
  if (a.startsWith('POS:') && b.startsWith('POS:')) {
    const aParts = a.split('|');
    const bParts = b.split('|');

    // Compare position part
    const aPos = aParts[0].slice(4);
    const bPos = bParts[0].slice(4);

    let posScore = 0;
    for (let i = 0; i < Math.min(aPos.length, bPos.length); i++) {
      const diff = Math.abs(parseInt(aPos[i], 10) - parseInt(bPos[i], 10));
      posScore += 1 - diff / 10;
    }
    posScore /= 4; // 4 dimensions

    // Compare color if present
    let colorScore = 0.5; // Default neutral
    const aColor = aParts.find((p) => p.startsWith('CLR:'));
    const bColor = bParts.find((p) => p.startsWith('CLR:'));

    if (aColor && bColor) {
      const aHex = aColor.slice(4);
      const bHex = bColor.slice(4);
      colorScore = hexColorSimilarity(aHex, bHex);
    }

    return 0.6 * posScore + 0.4 * colorScore;
  }

  // For raw hashes, character comparison
  const maxLen = Math.max(a.length, b.length);
  let matches = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] === b[i]) matches++;
  }
  return matches / maxLen;
}

/**
 * Compare two hex color strings
 */
function hexColorSimilarity(a: string, b: string): number {
  if (a.length !== 6 || b.length !== 6) return 0.5;

  const aR = parseInt(a.slice(0, 2), 16);
  const aG = parseInt(a.slice(2, 4), 16);
  const aB = parseInt(a.slice(4, 6), 16);

  const bR = parseInt(b.slice(0, 2), 16);
  const bG = parseInt(b.slice(2, 4), 16);
  const bB = parseInt(b.slice(4, 6), 16);

  // Euclidean distance in RGB space, normalized
  const dist = Math.sqrt(
    Math.pow(aR - bR, 2) + Math.pow(aG - bG, 2) + Math.pow(aB - bB, 2)
  );
  const maxDist = Math.sqrt(3 * 255 * 255);

  return 1 - dist / maxDist;
}
