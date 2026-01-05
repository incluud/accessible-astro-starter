/**
 * Stokoe Core - Visual Delta Pipeline
 *
 * Delta-based visual event pipeline for meetings and calls.
 * Privacy-first, session-scoped, append-only event architecture.
 */

// Events
export * from './events/visual.js';

// State
export * from './state/visual.js';

// Visual pipeline
export * from './visual/index.js';

// Audio description
export * from './ad/index.js';

// API
export * from './api/visual.js';

// UI
export { VisualDeltaPanel, DEFAULT_PANEL_CONFIG } from './ui/VisualDeltaPanel.js';
export type { VisualDeltaPanelConfig, PanelCallbacks } from './ui/VisualDeltaPanel.js';
