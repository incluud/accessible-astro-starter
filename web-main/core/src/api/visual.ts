/**
 * Visual Snapshot API
 *
 * Client methods and types for visual snapshot communication.
 * Defines payload types and handler signatures for DO integration.
 */

import type { VisualEvent, LayoutType } from '../events/visual.js';
import type { VisualState } from '../state/visual.js';
import type { SnapshotPayload, DetectedRegion } from '../visual/index.js';

// -----------------------------------------------------------------------------
// API Types
// -----------------------------------------------------------------------------

/** Request payload for snapshot submission */
export interface VisualSnapshotRequest {
  callId: string;
  payload: SnapshotPayload;
  /** Client-side analysis (optional, for backend validation) */
  clientAnalysis?: {
    regions: DetectedRegion[];
    layout: LayoutType;
  };
}

/** Response from snapshot submission */
export interface VisualSnapshotResponse {
  success: boolean;
  /** Events emitted from this snapshot */
  events: VisualEvent[];
  /** Current visual state (optional, for sync) */
  state?: VisualState;
  /** Error message if failed */
  error?: string;
}

/** WebSocket message types for visual events */
export type VisualWSMessage =
  | { type: 'visual_events'; events: VisualEvent[] }
  | { type: 'visual_state_sync'; state: VisualState }
  | { type: 'visual_error'; error: string };

// -----------------------------------------------------------------------------
// Client Methods
// -----------------------------------------------------------------------------

export interface VisualAPIClient {
  /** Send a visual snapshot to the backend */
  sendVisualSnapshot(request: VisualSnapshotRequest): Promise<VisualSnapshotResponse>;

  /** Subscribe to visual events via WebSocket */
  subscribeVisualEvents(
    callId: string,
    onMessage: (msg: VisualWSMessage) => void
  ): () => void;
}

/**
 * Create a visual API client
 */
export function createVisualAPIClient(
  baseUrl: string,
  getAuthToken?: () => string | undefined
): VisualAPIClient {
  return {
    async sendVisualSnapshot(request: VisualSnapshotRequest): Promise<VisualSnapshotResponse> {
      const { callId, payload, clientAnalysis } = request;
      const url = `${baseUrl}/v1/calls/${callId}/visual/snapshot`;

      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        const token = getAuthToken?.();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            ts_obs_ms: payload.ts_obs_ms,
            content_hash: payload.content_hash,
            mime: payload.mime,
            width: payload.width,
            height: payload.height,
            bytes_base64: payload.bytes_base64,
            client_analysis: clientAnalysis,
          }),
        });

        if (!response.ok) {
          return {
            success: false,
            events: [],
            error: `HTTP ${response.status}: ${response.statusText}`,
          };
        }

        return await response.json();
      } catch (err) {
        return {
          success: false,
          events: [],
          error: err instanceof Error ? err.message : 'Unknown error',
        };
      }
    },

    subscribeVisualEvents(
      callId: string,
      onMessage: (msg: VisualWSMessage) => void
    ): () => void {
      // WebSocket URL (replace http with ws)
      const wsUrl = baseUrl.replace(/^http/, 'ws') + `/v1/calls/${callId}/visual/events`;

      let ws: WebSocket | null = null;
      let reconnectTimeout: number | null = null;
      let isActive = true;

      const connect = () => {
        if (!isActive) return;

        try {
          ws = new WebSocket(wsUrl);

          ws.onopen = () => {
            console.log('[VisualAPI] WebSocket connected');
          };

          ws.onmessage = (event) => {
            try {
              const msg = JSON.parse(event.data) as VisualWSMessage;
              onMessage(msg);
            } catch (err) {
              console.error('[VisualAPI] Failed to parse message:', err);
            }
          };

          ws.onclose = () => {
            if (isActive) {
              // Reconnect after delay
              reconnectTimeout = window.setTimeout(connect, 3000);
            }
          };

          ws.onerror = (err) => {
            console.error('[VisualAPI] WebSocket error:', err);
          };
        } catch (err) {
          console.error('[VisualAPI] Failed to connect:', err);
          if (isActive) {
            reconnectTimeout = window.setTimeout(connect, 3000);
          }
        }
      };

      connect();

      // Return unsubscribe function
      return () => {
        isActive = false;
        if (reconnectTimeout !== null) {
          clearTimeout(reconnectTimeout);
        }
        if (ws) {
          ws.close();
        }
      };
    },
  };
}

// -----------------------------------------------------------------------------
// Backend Handler Interfaces (for DO implementation)
// -----------------------------------------------------------------------------

/**
 * Handler interface for Durable Object implementation
 * Implement these methods in your Call DO
 */
export interface VisualSnapshotHandler {
  /** Process incoming snapshot and emit events */
  handleSnapshot(
    payload: SnapshotPayload,
    clientAnalysis?: { regions: DetectedRegion[]; layout: LayoutType }
  ): Promise<VisualSnapshotResponse>;

  /** Get current visual state */
  getVisualState(): VisualState;

  /** Subscribe to visual events */
  onVisualEvents(callback: (events: VisualEvent[]) => void): () => void;
}

/**
 * Mock handler for local testing
 */
export class MockVisualSnapshotHandler implements VisualSnapshotHandler {
  private state: VisualState = {
    vids: {},
    screenShare: { active: false },
    layout: 'unknown',
    handRaisedCount: 0,
    lastSnapshotMs: 0,
    snapshotCount: 0,
  };
  private listeners: Set<(events: VisualEvent[]) => void> = new Set();

  async handleSnapshot(
    payload: SnapshotPayload,
    clientAnalysis?: { regions: DetectedRegion[]; layout: LayoutType }
  ): Promise<VisualSnapshotResponse> {
    // For mock, just update state with timestamp
    this.state = {
      ...this.state,
      lastSnapshotMs: payload.ts_obs_ms,
      snapshotCount: this.state.snapshotCount + 1,
      layout: clientAnalysis?.layout ?? this.state.layout,
    };

    // No events in mock
    return {
      success: true,
      events: [],
      state: this.state,
    };
  }

  getVisualState(): VisualState {
    return this.state;
  }

  onVisualEvents(callback: (events: VisualEvent[]) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /** Emit events to listeners (for testing) */
  emitEvents(events: VisualEvent[]): void {
    for (const listener of this.listeners) {
      listener(events);
    }
  }
}
