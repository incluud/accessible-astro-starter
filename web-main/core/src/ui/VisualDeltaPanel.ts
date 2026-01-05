/**
 * Visual Delta Panel UI Component
 *
 * Provides a minimal UI for displaying visual state and events.
 * Framework-agnostic: renders to a container element.
 */

import type { VisualState, VIDState } from '../state/visual.js';
import type { VisualEvent } from '../events/visual.js';
import type { ADPolicyConfig } from '../ad/policy.js';
import type { SnapshotConfig } from '../visual/snapshot.js';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface VisualDeltaPanelConfig {
  /** Maximum events to display */
  maxEvents: number;
  /** Show developer controls */
  devMode: boolean;
  /** Initial AD enabled state */
  adEnabled: boolean;
  /** Initial AD verbosity */
  adVerbosity: 'minimal' | 'normal';
  /** Initial snapshot interval */
  snapshotIntervalMs: number;
}

export const DEFAULT_PANEL_CONFIG: VisualDeltaPanelConfig = {
  maxEvents: 20,
  devMode: false,
  adEnabled: false,
  adVerbosity: 'normal',
  snapshotIntervalMs: 5000,
};

export interface PanelCallbacks {
  onADToggle?: (enabled: boolean) => void;
  onVerbosityChange?: (verbosity: 'minimal' | 'normal') => void;
  onSnapshotIntervalChange?: (intervalMs: number) => void;
  onLLMToggle?: (enabled: boolean) => void;
}

// -----------------------------------------------------------------------------
// Panel State
// -----------------------------------------------------------------------------

interface PanelState {
  visualState: VisualState | null;
  events: VisualEvent[];
  adEnabled: boolean;
  adVerbosity: 'minimal' | 'normal';
  useLLM: boolean;
  snapshotIntervalMs: number;
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export class VisualDeltaPanel {
  private container: HTMLElement;
  private config: VisualDeltaPanelConfig;
  private callbacks: PanelCallbacks;
  private state: PanelState;

  constructor(
    container: HTMLElement,
    config: Partial<VisualDeltaPanelConfig> = {},
    callbacks: PanelCallbacks = {}
  ) {
    this.container = container;
    this.config = { ...DEFAULT_PANEL_CONFIG, ...config };
    this.callbacks = callbacks;
    this.state = {
      visualState: null,
      events: [],
      adEnabled: this.config.adEnabled,
      adVerbosity: this.config.adVerbosity,
      useLLM: false,
      snapshotIntervalMs: this.config.snapshotIntervalMs,
    };

    this.render();
  }

  /** Update visual state */
  updateVisualState(state: VisualState): void {
    this.state.visualState = state;
    this.render();
  }

  /** Add events */
  addEvents(events: VisualEvent[]): void {
    this.state.events = [...events, ...this.state.events].slice(
      0,
      this.config.maxEvents
    );
    this.render();
  }

  /** Clear events */
  clearEvents(): void {
    this.state.events = [];
    this.render();
  }

  /** Render the panel */
  private render(): void {
    const { visualState, events, adEnabled, adVerbosity, useLLM, snapshotIntervalMs } =
      this.state;

    this.container.innerHTML = `
      <div class="visual-delta-panel" style="${this.panelStyles()}">
        <h3 style="${this.headingStyles()}">Visual Deltas</h3>

        ${this.renderStateSummary(visualState)}

        <div style="${this.sectionStyles()}">
          <h4 style="${this.subheadingStyles()}">Controls</h4>
          ${this.renderControls(adEnabled, adVerbosity, useLLM, snapshotIntervalMs)}
        </div>

        <div style="${this.sectionStyles()}">
          <h4 style="${this.subheadingStyles()}">Recent Events (${events.length})</h4>
          ${this.renderEventList(events)}
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  /** Render state summary */
  private renderStateSummary(state: VisualState | null): string {
    if (!state) {
      return `<div style="${this.summaryStyles()}">No visual state available</div>`;
    }

    const vids = Object.values(state.vids);
    const tiles = vids.filter((v) => v.kind === 'tile').length;
    const screenShares = vids.filter((v) => v.kind === 'screen_share').length;

    return `
      <div style="${this.summaryStyles()}">
        <div style="${this.statRowStyles()}">
          <span>Participants:</span>
          <span>${tiles}</span>
        </div>
        <div style="${this.statRowStyles()}">
          <span>Screen Shares:</span>
          <span>${screenShares}</span>
        </div>
        <div style="${this.statRowStyles()}">
          <span>Hands Raised:</span>
          <span>${state.handRaisedCount}</span>
        </div>
        <div style="${this.statRowStyles()}">
          <span>Layout:</span>
          <span>${state.layout}</span>
        </div>
        <div style="${this.statRowStyles()}">
          <span>Snapshots:</span>
          <span>${state.snapshotCount}</span>
        </div>
      </div>
    `;
  }

  /** Render controls */
  private renderControls(
    adEnabled: boolean,
    adVerbosity: 'minimal' | 'normal',
    useLLM: boolean,
    snapshotIntervalMs: number
  ): string {
    const devControls = this.config.devMode
      ? `
        <div style="${this.controlRowStyles()}">
          <label style="${this.labelStyles()}">Snapshot Interval:</label>
          <input
            type="range"
            id="vdp-snapshot-interval"
            min="1000"
            max="15000"
            step="1000"
            value="${snapshotIntervalMs}"
            style="${this.sliderStyles()}"
          />
          <span style="${this.valueStyles()}">${snapshotIntervalMs / 1000}s</span>
        </div>
        <div style="${this.controlRowStyles()}">
          <label style="${this.labelStyles()}">
            <input
              type="checkbox"
              id="vdp-llm-toggle"
              ${useLLM ? 'checked' : ''}
              style="margin-right: 8px;"
            />
            Use LLM Verbalizer (dev)
          </label>
        </div>
      `
      : '';

    return `
      <div style="${this.controlsStyles()}">
        <div style="${this.controlRowStyles()}">
          <label style="${this.labelStyles()}">
            <input
              type="checkbox"
              id="vdp-ad-toggle"
              ${adEnabled ? 'checked' : ''}
              style="margin-right: 8px;"
            />
            Audio Description (AD)
          </label>
        </div>
        <div style="${this.controlRowStyles()}">
          <label style="${this.labelStyles()}">Verbosity:</label>
          <select id="vdp-verbosity" style="${this.selectStyles()}" ${!adEnabled ? 'disabled' : ''}>
            <option value="minimal" ${adVerbosity === 'minimal' ? 'selected' : ''}>Minimal</option>
            <option value="normal" ${adVerbosity === 'normal' ? 'selected' : ''}>Normal</option>
          </select>
        </div>
        ${devControls}
      </div>
    `;
  }

  /** Render event list */
  private renderEventList(events: VisualEvent[]): string {
    if (events.length === 0) {
      return `<div style="${this.emptyStyles()}">No events yet</div>`;
    }

    const eventItems = events
      .map(
        (event) => `
        <div style="${this.eventItemStyles()}">
          <span style="${this.eventTypeStyles()}">${this.formatEventType(event.type)}</span>
          <span style="${this.eventTimeStyles()}">${this.formatTime(event.ts_obs_ms)}</span>
        </div>
      `
      )
      .join('');

    return `<div style="${this.eventListStyles()}">${eventItems}</div>`;
  }

  /** Format event type for display */
  private formatEventType(type: string): string {
    return type
      .replace('visual.', '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  /** Format timestamp */
  private formatTime(ms: number): string {
    const date = new Date(ms);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  /** Attach event listeners */
  private attachEventListeners(): void {
    const adToggle = this.container.querySelector('#vdp-ad-toggle') as HTMLInputElement;
    const verbosity = this.container.querySelector('#vdp-verbosity') as HTMLSelectElement;
    const intervalSlider = this.container.querySelector('#vdp-snapshot-interval') as HTMLInputElement;
    const llmToggle = this.container.querySelector('#vdp-llm-toggle') as HTMLInputElement;

    if (adToggle) {
      adToggle.addEventListener('change', () => {
        this.state.adEnabled = adToggle.checked;
        this.callbacks.onADToggle?.(adToggle.checked);
        this.render();
      });
    }

    if (verbosity) {
      verbosity.addEventListener('change', () => {
        const value = verbosity.value as 'minimal' | 'normal';
        this.state.adVerbosity = value;
        this.callbacks.onVerbosityChange?.(value);
      });
    }

    if (intervalSlider) {
      intervalSlider.addEventListener('input', () => {
        const value = parseInt(intervalSlider.value, 10);
        this.state.snapshotIntervalMs = value;
        this.render();
      });
      intervalSlider.addEventListener('change', () => {
        this.callbacks.onSnapshotIntervalChange?.(this.state.snapshotIntervalMs);
      });
    }

    if (llmToggle) {
      llmToggle.addEventListener('change', () => {
        this.state.useLLM = llmToggle.checked;
        this.callbacks.onLLMToggle?.(llmToggle.checked);
      });
    }
  }

  // Inline styles (for framework-agnostic rendering)
  private panelStyles(): string {
    return `
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #1C1C1F;
      border: 1px solid #2C2C2E;
      border-radius: 8px;
      padding: 16px;
      color: #FFFFFF;
      font-size: 14px;
    `;
  }

  private headingStyles(): string {
    return `
      margin: 0 0 16px 0;
      font-size: 16px;
      font-weight: 600;
      color: #FFFFFF;
    `;
  }

  private subheadingStyles(): string {
    return `
      margin: 0 0 8px 0;
      font-size: 12px;
      font-weight: 600;
      color: #A1A1A6;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    `;
  }

  private sectionStyles(): string {
    return `
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #2C2C2E;
    `;
  }

  private summaryStyles(): string {
    return `
      display: flex;
      flex-direction: column;
      gap: 4px;
    `;
  }

  private statRowStyles(): string {
    return `
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
    `;
  }

  private controlsStyles(): string {
    return `
      display: flex;
      flex-direction: column;
      gap: 12px;
    `;
  }

  private controlRowStyles(): string {
    return `
      display: flex;
      align-items: center;
      gap: 8px;
    `;
  }

  private labelStyles(): string {
    return `
      display: flex;
      align-items: center;
      color: #A1A1A6;
      cursor: pointer;
    `;
  }

  private selectStyles(): string {
    return `
      background: #0F0F10;
      border: 1px solid #2C2C2E;
      border-radius: 4px;
      color: #FFFFFF;
      padding: 4px 8px;
      font-size: 14px;
    `;
  }

  private sliderStyles(): string {
    return `
      flex: 1;
      accent-color: #0A84FF;
    `;
  }

  private valueStyles(): string {
    return `
      min-width: 40px;
      text-align: right;
      color: #A1A1A6;
    `;
  }

  private eventListStyles(): string {
    return `
      max-height: 200px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 4px;
    `;
  }

  private eventItemStyles(): string {
    return `
      display: flex;
      justify-content: space-between;
      padding: 6px 8px;
      background: #0F0F10;
      border-radius: 4px;
      font-size: 12px;
    `;
  }

  private eventTypeStyles(): string {
    return `
      color: #0A84FF;
    `;
  }

  private eventTimeStyles(): string {
    return `
      color: #6E6E73;
      font-family: 'SF Mono', Consolas, monospace;
    `;
  }

  private emptyStyles(): string {
    return `
      color: #6E6E73;
      font-style: italic;
      padding: 8px;
    `;
  }
}
