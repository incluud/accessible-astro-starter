/**
 * Verbalizer Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  templateVerbalize,
  validateLLMOutput,
  Verbalizer,
} from '../ad/verbalizer.js';
import { VisualEvents, resetEventIdCounter, type VID } from '../events/visual.js';
import { createInitialVisualState, setVID, type VisualState } from '../state/visual.js';

describe('templateVerbalize', () => {
  let state: VisualState;

  beforeEach(() => {
    resetEventIdCounter();
    state = createInitialVisualState();
    // Add a VID for testing
    state = setVID(state, {
      vid: 'v1' as VID,
      lastSeenMs: 1000,
      bbox: { x: 0, y: 0, w: 0.33, h: 0.33 },
      kind: 'tile',
      signals: {},
      confidence: 1.0,
    });
  });

  it('should verbalize hand_raised event', () => {
    const event = VisualEvents.handRaised(1000, 'v1' as VID);
    const text = templateVerbalize(event, state, 'normal');

    expect(text).toBe('Participant top left raised their hand');
  });

  it('should verbalize hand_lowered event', () => {
    const event = VisualEvents.handLowered(1000, 'v1' as VID);
    const text = templateVerbalize(event, state, 'normal');

    expect(text).toBe('Participant top left lowered their hand');
  });

  it('should verbalize screen_share_started event', () => {
    const event = VisualEvents.screenShareStarted(1000, 'v1' as VID);
    const text = templateVerbalize(event, state, 'normal');

    expect(text).toBe('Screen sharing has started');
  });

  it('should verbalize layout_changed event', () => {
    const event = VisualEvents.layoutChanged(1000, 'grid', 'presentation');
    const text = templateVerbalize(event, state, 'normal');

    expect(text).toBe('View changed to presentation layout');
  });

  it('should use minimal verbosity when specified', () => {
    const event = VisualEvents.handRaised(1000, 'v1' as VID);
    const text = templateVerbalize(event, state, 'minimal');

    expect(text).toBe('Hand raised');
  });
});

describe('validateLLMOutput', () => {
  it('should accept valid output', () => {
    const result = validateLLMOutput('A participant raised their hand.', 120);
    expect(result.valid).toBe(true);
  });

  it('should reject output that is too long', () => {
    const longOutput = 'A'.repeat(150);
    const result = validateLLMOutput(longOutput, 120);

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('maximum length');
  });

  it('should reject output with prohibited appearance terms', () => {
    const result = validateLLMOutput('The young woman in glasses raised her hand.', 120);

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('prohibited term');
  });

  it('should reject output with prohibited emotion terms', () => {
    const result = validateLLMOutput('The participant looks happy.', 120);

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('prohibited term');
  });

  it('should reject output with gender terms', () => {
    const result = validateLLMOutput('A man started screen sharing.', 120);

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('prohibited term');
  });

  it('should reject empty output', () => {
    const result = validateLLMOutput('', 120);

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Empty');
  });

  it('should accept neutral position-based descriptions', () => {
    const result = validateLLMOutput('Participant in the top left raised their hand.', 120);
    expect(result.valid).toBe(true);
  });
});

describe('Verbalizer', () => {
  let verbalizer: Verbalizer;
  let state: VisualState;

  beforeEach(() => {
    resetEventIdCounter();
    verbalizer = new Verbalizer();
    state = createInitialVisualState();
    state = setVID(state, {
      vid: 'v1' as VID,
      lastSeenMs: 1000,
      bbox: { x: 0, y: 0, w: 0.33, h: 0.33 },
      kind: 'tile',
      signals: {},
      confidence: 1.0,
    });
  });

  it('should use templates by default', async () => {
    const event = VisualEvents.handRaised(1000, 'v1' as VID);
    const text = await verbalizer.verbalize({ event, priority: 8 }, state);

    expect(text).toBe('Participant top left raised their hand');
  });

  it('should fall back to templates when LLM fails', async () => {
    verbalizer.updateConfig({ useLLM: true });
    verbalizer.setLLMHandler(async () => {
      throw new Error('LLM unavailable');
    });

    const event = VisualEvents.handRaised(1000, 'v1' as VID);
    const text = await verbalizer.verbalize({ event, priority: 8 }, state);

    expect(text).toBe('Participant top left raised their hand');
  });

  it('should fall back to templates when LLM output is rejected', async () => {
    verbalizer.updateConfig({ useLLM: true });
    verbalizer.setLLMHandler(async () => {
      return 'The happy young woman raised her hand.'; // Prohibited terms
    });

    const event = VisualEvents.handRaised(1000, 'v1' as VID);
    const text = await verbalizer.verbalize({ event, priority: 8 }, state);

    expect(text).toBe('Participant top left raised their hand');
  });

  it('should use LLM output when valid', async () => {
    verbalizer.updateConfig({ useLLM: true });
    verbalizer.setLLMHandler(async () => {
      return 'Someone raised their hand.';
    });

    const event = VisualEvents.handRaised(1000, 'v1' as VID);
    const text = await verbalizer.verbalize({ event, priority: 8 }, state);

    expect(text).toBe('Someone raised their hand.');
  });
});
