/**
 * Audio Description Verbalizer
 *
 * Converts visual events to spoken descriptions.
 * Two strategies: deterministic templates and optional LLM enhancement.
 */

import type { VisualEvent, VID, LayoutType } from '../events/visual.js';
import type { VisualState } from '../state/visual.js';
import type { AllowedADEvent } from './policy.js';

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------

export interface VerbalizerConfig {
  /** Use LLM for verbalization (feature flag) */
  useLLM: boolean;
  /** Maximum output length in characters */
  maxLength: number;
  /** Verbosity style */
  verbosity: 'minimal' | 'normal';
}

export const DEFAULT_VERBALIZER_CONFIG: VerbalizerConfig = {
  useLLM: false,
  maxLength: 120,
  verbosity: 'normal',
};

// -----------------------------------------------------------------------------
// Prohibited Terms
// -----------------------------------------------------------------------------

/**
 * Terms that must NEVER appear in AD output
 * These would imply identity, appearance, or emotion inference
 */
const PROHIBITED_TERMS = [
  // Identity
  'man', 'woman', 'boy', 'girl', 'person named', 'user named',
  // Appearance
  'wearing', 'dressed', 'hair', 'face', 'eyes', 'skin', 'looks like',
  'attractive', 'young', 'old', 'tall', 'short', 'glasses',
  // Emotion
  'happy', 'sad', 'angry', 'excited', 'bored', 'confused', 'frustrated',
  'smiling', 'frowning', 'laughing', 'crying',
  // Race/ethnicity
  'white', 'black', 'asian', 'latino', 'hispanic', 'african',
  // Age
  'elderly', 'teenager', 'child', 'adult',
];

// -----------------------------------------------------------------------------
// Template Verbalizer
// -----------------------------------------------------------------------------

/** Template strings for each event type */
const TEMPLATES = {
  'visual.hand_raised': {
    minimal: 'Hand raised',
    normal: 'Participant ${position} raised their hand',
  },
  'visual.hand_lowered': {
    minimal: 'Hand lowered',
    normal: 'Participant ${position} lowered their hand',
  },
  'visual.screen_share_started': {
    minimal: 'Screen sharing started',
    normal: 'Screen sharing has started',
  },
  'visual.screen_share_stopped': {
    minimal: 'Screen sharing ended',
    normal: 'Screen sharing has ended',
  },
  'visual.slide_changed': {
    minimal: 'Slide changed',
    normal: 'The presentation has moved to a new slide',
  },
  'visual.layout_changed': {
    minimal: 'Layout: ${to}',
    normal: 'View changed to ${to} layout',
  },
  'visual.vid_appeared': {
    minimal: 'Participant joined',
    normal: 'A new participant has appeared',
  },
  'visual.vid_disappeared': {
    minimal: 'Participant left',
    normal: 'A participant is no longer visible',
  },
} as const;

/**
 * Get position description for a VID (non-identifying)
 */
function getPositionDescription(vid: VID, state: VisualState): string {
  const vidState = state.vids[vid];
  if (!vidState) return 'unknown position';

  // Use grid position only
  const { bbox } = vidState;
  const col = Math.floor(bbox.x * 3); // 3 columns
  const row = Math.floor(bbox.y * 3); // 3 rows

  const colNames = ['left', 'center', 'right'];
  const rowNames = ['top', 'middle', 'bottom'];

  return `${rowNames[row] ?? 'middle'} ${colNames[col] ?? 'center'}`;
}

/**
 * Format layout name for speech
 */
function formatLayoutName(layout: LayoutType): string {
  const names: Record<LayoutType, string> = {
    grid: 'grid',
    speaker: 'speaker',
    presentation: 'presentation',
    unknown: 'default',
  };
  return names[layout] ?? 'default';
}

/**
 * Template-based verbalizer (deterministic, always available)
 */
export function templateVerbalize(
  event: VisualEvent,
  state: VisualState,
  verbosity: 'minimal' | 'normal' = 'normal'
): string {
  const templates = TEMPLATES[event.type as keyof typeof TEMPLATES];
  if (!templates) return '';

  let template = templates[verbosity];

  // Substitute variables
  if (event.type === 'visual.layout_changed') {
    const to = formatLayoutName(event.payload.to);
    template = template.replace('${to}', to);
  }

  if (
    event.type === 'visual.hand_raised' ||
    event.type === 'visual.hand_lowered'
  ) {
    const position = getPositionDescription(event.payload.vid, state);
    template = template.replace('${position}', position);
  }

  return template;
}

// -----------------------------------------------------------------------------
// LLM Verbalizer
// -----------------------------------------------------------------------------

/** Context for LLM verbalization */
export interface LLMVerbalizerContext {
  eventType: string;
  eventData: Record<string, unknown>;
  participantCount: number;
  handRaisedCount: number;
  isScreenSharing: boolean;
  currentLayout: LayoutType;
  verbosity: 'minimal' | 'normal';
}

/**
 * Build context for LLM (NO raw images or identifying info)
 */
export function buildLLMContext(
  event: VisualEvent,
  state: VisualState,
  verbosity: 'minimal' | 'normal'
): LLMVerbalizerContext {
  // Extract only allowed, structured data
  const eventData: Record<string, unknown> = {};

  // Position info only (not identity)
  if ('vid' in event.payload) {
    const vid = event.payload.vid as VID;
    const vidState = state.vids[vid];
    if (vidState) {
      eventData.position = getPositionDescription(vid, state);
      eventData.kind = vidState.kind;
    }
  }

  // Layout change specifics
  if (event.type === 'visual.layout_changed') {
    eventData.fromLayout = formatLayoutName(event.payload.from);
    eventData.toLayout = formatLayoutName(event.payload.to);
  }

  return {
    eventType: event.type,
    eventData,
    participantCount: Object.keys(state.vids).filter(
      (v) => state.vids[v as VID].kind === 'tile'
    ).length,
    handRaisedCount: state.handRaisedCount,
    isScreenSharing: state.screenShare.active,
    currentLayout: state.layout,
    verbosity,
  };
}

/**
 * System prompt for LLM verbalization
 */
export const LLM_SYSTEM_PROMPT = `You are an audio description assistant for video calls.
Your role is to convert structured visual events into brief spoken announcements.

RULES:
1. Output ONE sentence, max 120 characters
2. Be factual and concise
3. NEVER describe appearance, clothing, age, gender, race, or emotions
4. NEVER infer or mention identity
5. Use position-based descriptions only (e.g., "participant in top-left")
6. Use present tense
7. Do not include the event type name

You receive structured event data, NOT images. Simply phrase the event naturally.`;

/**
 * Validate LLM output for prohibited content
 */
export function validateLLMOutput(output: string, maxLength: number): {
  valid: boolean;
  reason?: string;
} {
  // Check length
  if (output.length > maxLength) {
    return { valid: false, reason: 'Output exceeds maximum length' };
  }

  // Check for prohibited terms
  const lowerOutput = output.toLowerCase();
  for (const term of PROHIBITED_TERMS) {
    if (lowerOutput.includes(term.toLowerCase())) {
      return { valid: false, reason: `Contains prohibited term: "${term}"` };
    }
  }

  // Check for empty output
  if (output.trim().length === 0) {
    return { valid: false, reason: 'Empty output' };
  }

  return { valid: true };
}

// -----------------------------------------------------------------------------
// Main Verbalizer
// -----------------------------------------------------------------------------

export class Verbalizer {
  private config: VerbalizerConfig;
  private llmHandler?: (context: LLMVerbalizerContext) => Promise<string>;

  constructor(config: Partial<VerbalizerConfig> = {}) {
    this.config = { ...DEFAULT_VERBALIZER_CONFIG, ...config };
  }

  /** Update configuration */
  updateConfig(config: Partial<VerbalizerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /** Set LLM handler function */
  setLLMHandler(handler: (context: LLMVerbalizerContext) => Promise<string>): void {
    this.llmHandler = handler;
  }

  /**
   * Verbalize an event
   * Uses LLM if enabled and handler available, otherwise templates
   */
  async verbalize(
    allowedEvent: AllowedADEvent,
    state: VisualState
  ): Promise<string> {
    const { event } = allowedEvent;

    // Try LLM first if enabled
    if (this.config.useLLM && this.llmHandler) {
      try {
        const context = buildLLMContext(event, state, this.config.verbosity);
        const llmOutput = await this.llmHandler(context);

        // Validate output
        const validation = validateLLMOutput(llmOutput, this.config.maxLength);
        if (validation.valid) {
          return llmOutput;
        }

        console.warn('[Verbalizer] LLM output rejected:', validation.reason);
        // Fall through to template
      } catch (err) {
        console.warn('[Verbalizer] LLM failed, using template:', err);
        // Fall through to template
      }
    }

    // Template fallback (always works)
    return templateVerbalize(event, state, this.config.verbosity);
  }

  /**
   * Verbalize multiple events (batched)
   */
  async verbalizeAll(
    events: AllowedADEvent[],
    state: VisualState
  ): Promise<string[]> {
    const results: string[] = [];
    for (const event of events) {
      const text = await this.verbalize(event, state);
      if (text) results.push(text);
    }
    return results;
  }
}

/**
 * Standalone function for simple verbalization
 */
export function verbalize(
  events: AllowedADEvent[],
  state: VisualState,
  config: Partial<VerbalizerConfig> = {}
): string[] {
  const finalConfig = { ...DEFAULT_VERBALIZER_CONFIG, ...config };

  return events.map((ae) => templateVerbalize(ae.event, state, finalConfig.verbosity));
}
