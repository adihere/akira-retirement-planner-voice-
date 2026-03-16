# Architecture Documentation

## Overview

Akira is a voice-first retirement planning assistant built on Gemini's native audio streaming capabilities. This document details the technical architecture and design decisions.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser Client                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   React UI   │  │AudioRecorder │  │   AudioStreamer      │  │
│  │  (App.tsx)   │  │ (audio.ts)   │  │    (audio.ts)        │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         │                 │                      │              │
│         │     ┌───────────┴──────────────────────┘              │
│         │     │                                                  │
│  ┌──────┴─────┴─────────────────────────────────────────────┐  │
│  │                    State Management                        │  │
│  │  - isConnected, isConnecting, connectionError              │  │
│  │  - finaleData, projectionData, snapshot                    │  │
│  │  - history, liveTranscript                                 │  │
│  └──────────────────────────┬────────────────────────────────┘  │
│                             │                                    │
└─────────────────────────────┼────────────────────────────────────┘
                              │
                    WebSocket Connection
                              │
┌─────────────────────────────┼────────────────────────────────────┐
│                             │                                    │
│              Gemini 2.5 Flash Native Audio API                   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   Live Session                            │   │
│  │  - Bidirectional audio streaming                          │   │
│  │  - Real-time transcription                                │   │
│  │  - Function calling                                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. AudioRecorder (`src/lib/audio.ts`)

Handles microphone input and audio capture.

**Key Features:**
- Uses Web Audio API for cross-browser compatibility
- Captures audio at 16kHz sample rate (Gemini requirement)
- Converts Float32 audio to Int16 PCM format
- Base64 encodes audio chunks for transmission
- Handles AudioContext suspension on mobile browsers

**Flow:**
```
Microphone → MediaStream → AudioContext → ScriptProcessor → Base64 → Gemini
```

**Mobile Compatibility:**
- Automatically resumes suspended AudioContext
- Provides clear error messages for permission issues
- Handles "microphone in use" scenarios

### 2. AudioStreamer (`src/lib/audio.ts`)

Manages audio playback from Gemini responses.

**Key Features:**
- Queues audio chunks for smooth playback
- Handles AudioContext lifecycle
- Supports interruption for natural conversation flow
- Ensures resumed state for mobile autoplay policies

**Flow:**
```
Gemini → Base64 Audio → Decode → AudioBuffer → AudioBufferSourceNode → Speakers
```

### 3. Main Application (`src/App.tsx`)

Orchestrates the entire user experience.

**State Management:**
| State | Purpose |
|-------|---------|
| `isConnected` | Session active status |
| `isConnecting` | Connection in progress |
| `connectionError` | User-friendly error messages |
| `finaleData` | Grand finale report data |
| `projectionData` | Retirement projection chart data |
| `snapshot` | Persistent user financial data |
| `history` | Conversation history |
| `liveTranscript` | Real-time speech transcription |

**Refs (for mutable state):**
| Ref | Purpose |
|-----|---------|
| `sessionRef` | Active Gemini session |
| `audioRecorderRef` | AudioRecorder instance |
| `audioStreamerRef` | AudioStreamer instance |
| `isDisconnectingRef` | Prevents double cleanup |

## Function Tools

Akira uses Gemini's function calling to trigger UI updates and persist data.

### 1. `triggerGrandFinale`

Generates the comprehensive retirement report.

**Parameters:**
- `realityCheck`: Honest assessment of retirement readiness
- `imagePrompt`: Prompt for AI image generation
- `wayForward`: Array of actionable steps
- `netWorthProjection`: Year-by-year financial projection

**Side Effects:**
- Triggers AI image generation via Gemini
- Updates `finaleData` state
- Renders visual report in UI

### 2. `calculateRetirementProjection`

Calculates retirement savings trajectory.

**Parameters:**
- `currentAge`, `retirementAge`
- `currentPension`, `currentISA`
- `monthlyContribution`
- `expectedReturn` (default 5%)

**Output:**
- Array of `{year, balance}` objects
- Rendered as interactive line chart

### 3. `updateSnapshot`

Persists user financial data.

**Parameters:**
- `age`, `retirementAge`
- `pensionValue`, `isaValue`, `homeValue`
- `income`, `monthlyContribution`
- `goals` (optional string)

**Side Effects:**
- Saves to localStorage
- Displayed in sidebar snapshot card

## Data Persistence

### LocalStorage Keys

| Key | Content |
|-----|---------|
| `akira_snapshot` | User's financial profile |
| `akira_history` | Conversation transcript |

### Context Restoration

On session start, previous history is sent to Gemini:
```typescript
if (history.length > 0) {
  session.sendClientContent({
    turns: [{ 
      role: 'user', 
      parts: [{ text: `Here is our conversation history:\n${historyText}` }] 
    }],
    turnComplete: true
  });
}
```

## Error Handling Strategy

### Connection Errors
- API key validation before connection attempt
- User-friendly error messages for common issues
- Automatic cleanup of partial resources

### Audio Errors
- Permission denied handling
- Microphone not found detection
- Device in use scenarios
- Mobile AudioContext suspension

### Session Errors
- Double disconnect prevention
- Graceful cleanup on `onclose` and `onerror`
- Session state validation before operations

## Security Considerations

### API Key Handling
- Uses Vite's `import.meta.env` for client-side env vars
- `VITE_` prefix required for client exposure
- Recommend server-side proxy for production

### Data Privacy
- All data stored locally in browser
- No server-side data persistence
- Conversation sent to Gemini API only

## Performance Optimizations

### Audio Processing
- 4096 sample buffer size balances latency vs efficiency
- Direct PCM encoding (no compression overhead)
- Chunked transmission prevents UI blocking

### React Rendering
- Refs for frequently changing values (transcripts)
- Memoization not needed (component is flat)
- Motion animations for perceived performance

### Bundle Optimization
- Manual chunks in Vite config
- Vendor splitting (react, recharts, genai)
- Source maps for debugging

## Future Architecture Considerations

### Scalability
- Server-side session management for multi-device
- Database integration for persistent profiles
- User authentication system

### Features
- Multiple AI personalities/advisors
- Real-time market data integration
- Multi-language support
- Collaborative planning (couples)

### Testing
- Unit tests for audio utilities
- Integration tests for Gemini interactions
- E2E tests for conversation flows
