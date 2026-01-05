/**
 * Audio Description Module
 *
 * Exports for AD policy gate and verbalization.
 */

// Policy gate
export { ADPolicyGate, DEFAULT_AD_POLICY_CONFIG } from './policy.js';
export type {
  ADPolicyConfig,
  AllowedADEventType,
  AllowedADEvent,
  AudioActivitySignal,
} from './policy.js';

// Verbalizer
export {
  Verbalizer,
  templateVerbalize,
  buildLLMContext,
  validateLLMOutput,
  verbalize,
  LLM_SYSTEM_PROMPT,
  DEFAULT_VERBALIZER_CONFIG,
} from './verbalizer.js';
export type { VerbalizerConfig, LLMVerbalizerContext } from './verbalizer.js';
