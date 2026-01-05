# Visual Delta Pipeline

A privacy-first, delta-based visual event pipeline for Stokoe Catalyst meetings and calls.

## Overview

The Visual Delta Pipeline enables accessibility features like Audio Descriptions (AD) by detecting changes in meeting UI without compromising privacy. It uses:

- **Composite Snapshots**: Low-resolution composites of the meeting UI captured periodically
- **VID (Video Session IDs)**: Session-local visual continuity handles (NOT identity)
- **Delta Detection**: Events emitted only when visual state changes
- **Privacy-Safe Analysis**: No face recognition, no biometric data, no identity inference

## Key Principles

### VID is NOT Identity

A VID (Video Session ID) like `v1`, `v2`, `v3` is a **session-local continuity handle**:

- Minted when a new visual region appears
- Expires when the region disappears for `VID_EXPIRE_MS` (default 15 seconds)
- Used to track *which region* changed, not *who* changed
- Never stored beyond the session
- May be linked to an audio stream SID for cross-modal correlation

VIDs enable statements like "the participant in the top-left raised their hand" without ever identifying the person.

### Privacy-Safe Fingerprinting

Region fingerprints are used for VID continuity matching:

- Based on position buckets (10x10 grid) and average color
- NOT biometric
- NOT face embeddings
- Just enough to answer "is this the same region as before?"

### Append-Only Events

All visual changes are emitted as immutable events:

- Monotonic IDs per session
- Explicit timestamps (observation time + emission time)
- Confidence scores
- Inspectable and replayable

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (Console)                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────┐    ┌───────────────┐    ┌───────────────┐   │
│  │ SnapshotClient│───▶│ VisualDelta   │───▶│   API Client  │   │
│  │               │    │   Detector    │    │               │   │
│  │ - Capture     │    │               │    │ - POST /snap  │   │
│  │ - Composite   │    │ - VID Track   │    │ - WS events   │   │
│  │ - Fingerprint │    │ - Delta Calc  │    │               │   │
│  └───────────────┘    └───────────────┘    └───────────────┘   │
│                              │                                  │
│                              ▼                                  │
│                     ┌───────────────┐                          │
│                     │VisualState    │                          │
│                     │(World Model)  │                          │
│                     └───────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼ (events)
┌─────────────────────────────────────────────────────────────────┐
│                    Audio Description (AD)                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────┐    ┌───────────────┐    ┌───────────────┐   │
│  │ ADPolicyGate  │───▶│  Verbalizer   │───▶│  TTS Output   │   │
│  │               │    │               │    │               │   │
│  │ - Cooldowns   │    │ - Templates   │    │ (External)    │   │
│  │ - Speech Gate │    │ - LLM (opt)   │    │               │   │
│  │ - Priority    │    │ - Validation  │    │               │   │
│  └───────────────┘    └───────────────┘    └───────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Event Types

| Event | Description | Payload |
|-------|-------------|---------|
| `visual.snapshot_received` | Snapshot processed | `{ content_hash, width, height, region_count }` |
| `visual.vid_appeared` | New visual region | `{ vid, kind, bbox }` |
| `visual.vid_disappeared` | Region expired | `{ vid }` |
| `visual.hand_raised` | Hand raise detected | `{ vid }` |
| `visual.hand_lowered` | Hand lowered | `{ vid }` |
| `visual.screen_share_started` | Screen share began | `{ vid }` |
| `visual.screen_share_stopped` | Screen share ended | `{ vid }` |
| `visual.slide_changed` | Presentation slide changed | `{ vid, fromHash?, toHash }` |
| `visual.layout_changed` | Meeting layout changed | `{ from, to }` |

## Usage

### Basic Setup

```typescript
import {
  SnapshotClient,
  VisualDeltaDetector,
  createInitialVisualState,
  ADPolicyGate,
  Verbalizer,
} from '@stokoe/core';

// Initialize components
const snapshotClient = new SnapshotClient({ intervalMs: 5000 });
const detector = new VisualDeltaDetector();
const policy = new ADPolicyGate({ enabled: true });
const verbalizer = new Verbalizer();

let visualState = createInitialVisualState();

// Start capturing
snapshotClient.start(
  () => getTileElements(), // Your function to get video elements
  async (payload, analysis) => {
    // Compute deltas
    const { nextState, events } = detector.computeDeltas(
      visualState,
      analysis.regions,
      analysis.layout,
      payload.ts_obs_ms,
      payload.content_hash,
      payload.width,
      payload.height
    );

    visualState = nextState;

    // Handle AD
    const candidates = policy.selectADCandidates(events);
    policy.queueAnnouncements(candidates);

    if (policy.shouldSpeakAD(visualState)) {
      const announcement = policy.getNextAnnouncement();
      if (announcement) {
        const text = await verbalizer.verbalize(announcement, visualState);
        speak(text); // Your TTS function
      }
    }
  }
);
```

### UI Panel

```typescript
import { VisualDeltaPanel } from '@stokoe/core';

const container = document.getElementById('visual-panel')!;
const panel = new VisualDeltaPanel(container, {
  devMode: true,
  adEnabled: false,
}, {
  onADToggle: (enabled) => policy.updateConfig({ enabled }),
  onVerbosityChange: (v) => verbalizer.updateConfig({ verbosity: v }),
});

// Update panel when state changes
panel.updateVisualState(visualState);
panel.addEvents(events);
```

## Configuration

### Snapshot Client

| Option | Default | Description |
|--------|---------|-------------|
| `intervalMs` | 5000 | Milliseconds between snapshots |
| `maxWidth` | 640 | Maximum composite image width |
| `quality` | 0.7 | JPEG/WebP quality (0-1) |
| `format` | `'image/webp'` | Image format |

### Delta Detector

| Option | Default | Description |
|--------|---------|-------------|
| `debounceSnapshots` | 2 | Snapshots required before emitting signal change |
| `vid.expireMs` | 15000 | VID expiration timeout |
| `vid.bboxDistanceThreshold` | 0.15 | Max bbox center distance for matching |

### AD Policy

| Option | Default | Description |
|--------|---------|-------------|
| `enabled` | false | AD enabled |
| `verbosity` | `'normal'` | `'minimal'` or `'normal'` |
| `avoidSpeechOverlap` | true | Pause AD during human speech |
| `globalCooldownMs` | 2000 | Min time between announcements |

## Security & Privacy

This module is designed with privacy as a core constraint:

1. **No Face Recognition**: Fingerprints use position/color only, not biometrics
2. **No Identity Inference**: VIDs are session-local handles, not person IDs
3. **No Appearance Description**: AD verbalizer prohibits appearance/emotion/identity terms
4. **No Persistent Storage**: Snapshots are not stored by default
5. **Session-Scoped Only**: All data expires with the session

## Testing

```bash
cd core
npm install
npm test
```

Tests cover:
- VID mapping stability across bbox drift
- Hand raise/lower event emission
- Slide change detection
- VID expiration
- Template verbalizer output
- LLM verbalizer validation (prohibited content rejection)
