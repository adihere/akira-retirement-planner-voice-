# Akira Architecture

A comprehensive visual guide to the voice-first retirement planning assistant.

---

## Table of Contents

1. [High-Level System Overview](#high-level-system-overview)
2. [Voice Conversation Data Flow](#voice-conversation-data-flow)
3. [Function Calling Flow](#function-calling-flow)
4. [Component Architecture](#component-architecture)
5. [State Management Flow](#state-management-flow)
6. [Persistence Layer](#persistence-layer)
7. [Technology Stack](#technology-stack)
8. [Security & Privacy Model](#security--privacy-model)
9. [Error Handling](#error-handling)
10. [Performance Optimizations](#performance-optimizations)

---

## High-Level System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                              │
│                                                                   │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐   │
│  │   React UI   │◄────►│  Web Audio   │◄────►│  Gemini API  │   │
│  │   (App.tsx)  │      │   (audio.ts) │      │  (2.5 Flash) │   │
│  └──────────────┘      └──────────────┘      └──────────────┘   │
│         │                      │                      │          │
│         ▼                      ▼                      ▼          │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐   │
│  │   State     │      │   Audio      │      │  Function    │   │
│  │  Management │      │  Capture &   │      │   Calling    │   │
│  │  (useState) │      │  Playback    │      │   (3 funcs)  │   │
│  └──────────────┘      └──────────────┘      └──────────────┘   │
│         │                      │                      │          │
│         └──────────────────────┼──────────────────────┘          │
│                                ▼                                 │
│                      ┌──────────────┐                           │
│                      │ localStorage  │                           │
│                      │  Persistence  │                           │
│                      └──────────────┘                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   Vercel CDN    │
                    │  Static Hosting │
                    └─────────────────┘
```

### Overview

Akira is a **pure client-side** application that runs entirely in the user's browser. The architecture consists of:

- **React UI**: Main application interface built with React
- **Web Audio API**: Handles audio capture and playback
- **Gemini 2.5 Flash API**: Processes voice and generates responses
- **Function Calling**: Dynamic UI updates through three key functions
- **localStorage**: Persists user data locally
- **Vercel**: Static hosting with global CDN

**Key Characteristics:**
- ✅ No backend server required
- ✅ All processing happens client-side
- ✅ Data never leaves user's browser (except to Gemini API)
- ✅ Fast, responsive, and privacy-focused

---

## Voice Conversation Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    VOICE CONVERSATION FLOW                      │
└─────────────────────────────────────────────────────────────────┘

    USER SPEAKS
         │
         ▼
┌─────────────────┐
│  Microphone     │
│  Access Request │
└─────────────────┘
         │
         ▼ (Permission Granted)
┌─────────────────┐
│  Web Audio API  │
│  (audio.ts)     │
│  - MediaStream  │
│  - AudioContext │
└─────────────────┘
         │
         ▼ (Audio Capture)
┌─────────────────┐
│  Audio Recorder │
│  - 16kHz Sample │
│  - Mono Channel │
│  - PCM Format   │
└─────────────────┘
         │
         ▼ (Blob Created)
┌─────────────────┐
│  Audio Encoder  │
│  - WAV Header   │
│  - Binary Data  │
└─────────────────┘
         │
         ▼ (Upload)
┌─────────────────────────────────────────────────────────────┐
│              Gemini 2.5 Flash Native Audio API              │
├─────────────────────────────────────────────────────────────┤
│  1. Receive Audio Blob                                      │
│  2. Transcribe to Text                                     │
│  3. Process with Context (History + Snapshot)               │
│  4. Generate Response                                       │
│  5. Decide Function Call (if needed)                        │
└─────────────────────────────────────────────────────────────┘
         │
         ▼ (Response)
┌─────────────────┐
│  Response Type? │
└─────────────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌─────────┐ ┌─────────────┐
│  Text   │ │  Function   │
│ Response│ │   Call      │
└─────────┘ └─────────────┘
    │             │
    │             ▼
    │    ┌─────────────────┐
    │    │ Execute Function│
    │    │ - updateSnapshot│
    │    │ - calculate...  │
    │    │ - triggerGrand  │
    │    └─────────────────┘
    │             │
    └──────┬──────┘
           │
           ▼
┌─────────────────┐
│  Update UI      │
│  - Messages     │
│  - Snapshot     │
│  - Loading State│
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  Save to        │
│  localStorage   │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  Play Audio     │
│  Response (TTS) │
└─────────────────┘
         │
         ▼
    USER HEARS
```

### Flow Explanation

1. **Capture**: User speaks → Web Audio API captures audio from microphone
2. **Encode**: Audio is encoded to WAV format with proper headers
3. **Transcribe**: Gemini API transcribes audio to text
4. **Process**: Context (history + snapshot) is sent with the user's message
5. **Respond**: Gemini generates text response and/or function calls
6. **Update**: UI is updated with new messages and data
7. **Persist**: Data is saved to localStorage for future sessions
8. **Playback**: Text-to-speech audio is played back to user

---

## Function Calling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    FUNCTION CALLING FLOW                         │
└─────────────────────────────────────────────────────────────────┘

    GEMINI API
         │
         ▼ (Decides to call function)
┌─────────────────────────────────────────────────────────────┐
│  Function Call Request                                       │
│  {                                                          │
│    "functionCall": {                                        │
│      "name": "updateSnapshot",                              │
│      "args": {                                              │
│        "age": 35,                                           │
│        "currentSavings": 50000,                             │
│        "monthlyContribution": 1000                          │
│      }                                                      │
│    }                                                        │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Function Router (App.tsx)                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Which function?                                     │  │
│  └─────────────────────────────────────────────────────┘  │
│         │         │                    │                    │
│         ▼         ▼                    ▼                    │
│  ┌─────────┐ ┌─────────────┐   ┌─────────────────┐       │
│  │ update  │ │ calculate   │   │  triggerGrand    │       │
│  │ Snapshot│ │ Retirement  │   │     Finale       │       │
│  └─────────┘ └─────────────┘   └─────────────────┘       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
         │         │                    │
         ▼         ▼                    ▼

┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│  updateSnapshot()   │  │calculateRetirement()│  │ triggerGrandFinale()│
├─────────────────────┤  ├─────────────────────┤  ├─────────────────────┤
│ 1. Validate args    │  │ 1. Get snapshot     │  │ 1. Check eligibility │
│ 2. Update state     │  │ 2. Run calculations │  │ 2. Generate report   │
│ 3. Save to storage  │  │ 3. Create projection│  │ 3. Set grand finale │
│ 4. Return success   │  │ 4. Update state     │  │ 4. Return success    │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────┐
│  Function Response                                           │
│  {                                                          │
│    "functionResponse": {                                    │
│      "name": "updateSnapshot",                              │
│      "response": { "success": true }                       │
│    }                                                        │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
         │
         ▼ (Send back to Gemini)
┌─────────────────────────────────────────────────────────────┐
│  Gemini Continues Conversation                              │
│  - Uses updated state                                      │
│  - Generates contextual response                            │
│  - May call another function                                │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
    UI UPDATE
```

### Function Details

#### 1. updateSnapshot
Updates user's financial snapshot with new data.
- **Args**: age, currentSavings, monthlyContribution, retirementAge, etc.
- **Effect**: Updates state and persists to localStorage
- **Use Case**: User provides new financial information

#### 2. calculateRetirementProjection
Calculates retirement projections based on current snapshot.
- **Args**: None (uses current state)
- **Effect**: Creates projection data and updates state
- **Use Case**: User asks about retirement readiness

#### 3. triggerGrandFinale
Generates comprehensive retirement report.
- **Args**: None (uses current state)
- **Effect**: Creates detailed report and sets grand finale mode
- **Use Case**: User requests complete analysis

---

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPONENT ARCHITECTURE                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        App.tsx (Root)                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Main Application Component                            │   │
│  │  - State Management                                    │   │
│  │  - Audio Integration                                   │   │
│  │  - API Communication                                   │   │
│  │  - Function Handling                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
         │
         ├─────────────────────────────────────────────────────┐
         │                                                     │
         ▼                                                     ▼
┌─────────────────────────┐                         ┌──────────────────────┐
│   State Hooks          │                         │   audio.ts Module    │
├─────────────────────────┤                         ├──────────────────────┤
│ • messages             │                         │ • startRecording()   │
│ • snapshot             │                         │ • stopRecording()    │
│ • isRecording          │                         │ • playAudio()        │
│ • isLoading            │                         │ • stopPlayback()     │
│ • grandFinaleMode      │                         │ • getAudioStream()   │
│ • projection           │                         │ • createWavFile()    │
│ • error                │                         └──────────────────────┘
└─────────────────────────┘                                   │
         │                                                     │
         ▼                                                     │
┌─────────────────────────┐                                   │
│   UI Components         │                                   │
│   (Inline in App.tsx)   │                                   │
├─────────────────────────┤                                   │
│ • Header                │◄──────────────────────────────────┘
│ • Chat Interface        │
│ • Voice Button          │
│ • Snapshot Display      │
│ • Projection Chart      │
│ • Grand Finale View     │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│   Helper Functions      │
├─────────────────────────┤
│ • updateSnapshot()      │
│ • calculateRetirement() │
│ • triggerGrandFinale()  │
│ • saveToLocalStorage()  │
│ • loadFromLocalStorage()│
└─────────────────────────┘
```

### Component Breakdown

#### App.tsx (Main Component)
**Responsibilities:**
- Manages all application state using React hooks
- Handles user interactions and voice commands
- Communicates with Gemini API
- Executes function calls
- Renders UI components

#### audio.ts (Audio Module)
**Responsibilities:**
- Manages Web Audio API
- Handles microphone access and permissions
- Records audio from user
- Plays audio responses (TTS)
- Encodes/decodes audio data

**Key Functions:**
```typescript
startRecording()   // Begin capturing audio
stopRecording()    // End capture and return blob
playAudio(blob)    // Play audio response
stopPlayback()     // Stop current playback
```

---

## State Management Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    STATE MANAGEMENT FLOW                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     INITIAL LOAD                                 │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  useEffect(() => {                                          │
│    loadFromLocalStorage();                                  │
│  }, []);                                                    │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  localStorage.getItem('akira_snapshot')                      │
│  localStorage.getItem('akira_history')                       │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Set Initial State                                          │
│  - messages: [] or loaded history                           │
│  - snapshot: {} or loaded snapshot                          │
│  - isRecording: false                                       │
│  - isLoading: false                                         │
│  - grandFinaleMode: false                                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    STATE UPDATES                                │
└─────────────────────────────────────────────────────────────────┘

    USER ACTION / API RESPONSE
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│  State Setter Function                                       │
│  setMessages([...])                                         │
│  setSnapshot({...})                                         │
│  setIsRecording(...)                                        │
│  setIsLoading(...)                                          │
└─────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│  React Re-render                                             │
│  - Component updates with new state                          │
│  - UI reflects changes                                       │
└─────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│  useEffect(() => {                                          │
│    saveToLocalStorage();                                    │
│  }, [messages, snapshot, ...]);                             │
└─────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│  localStorage.setItem('akira_snapshot', JSON.stringify(...))│
│  localStorage.setItem('akira_history', JSON.stringify(...)) │
└─────────────────────────────────────────────────────────────┘
```

### State Variables

| State | Type | Purpose | Persistence |
|-------|------|---------|-------------|
| `messages` | Array | Chat conversation history | Yes |
| `snapshot` | Object | User's financial data | Yes |
| `isRecording` | Boolean | Recording status | No |
| `isLoading` | Boolean | Loading indicator | No |
| `grandFinaleMode` | Boolean | Grand finale view | No |
| `projection` | Object | Retirement calculations | No |
| `error` | String | Error messages | No |

### State Update Patterns

1. **User Input**: Direct state update → UI re-render
2. **API Response**: Parse response → Update state → UI re-render
3. **Function Call**: Execute function → Update state → UI re-render
4. **Audio Events**: Recording/playback events → Update state → UI re-render

---

## Persistence Layer

```
┌─────────────────────────────────────────────────────────────────┐
│                    PERSISTENCE LAYER                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      localStorage                                │
│                   (Browser Storage)                              │
└─────────────────────────────────────────────────────────────────┘
         │
         ├─────────────────────────────────────────────────────┐
         │                                                     │
         ▼                                                     ▼
┌─────────────────────┐                           ┌─────────────────────┐
│  akira_snapshot     │                           │  akira_history      │
├─────────────────────┤                           ├─────────────────────┤
│ {                   │                           │ [                   │
│   "age": 35,        │                           │   {                 │
│   "currentSavings": │                           │     "role": "user", │
│     50000,          │                           │     "content": "...",│
│   "monthlyContrib": │                           │     "timestamp": ...│
│     1000,           │                           │   },                │
│   "retirementAge":  │                           │   {                 │
│     65,             │                           │     "role": "model",│
│   "riskTolerance":  │                           │     "content": "...",│
│     "moderate"      │                           │     "timestamp": ...│
│ }                   │                           │   }                 │
└─────────────────────┘                           │ ]                   │
         │                                      └─────────────────────┘
         │                                                     │
         └─────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Data Lifecycle                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. INITIAL LOAD                                                │
│     ┌─────────────────────────────────────────┐                │
│     │ useEffect(() => {                      │                │
│     │   const saved = localStorage.getItem(); │                │
│     │   if (saved) setState(JSON.parse(saved));│               │
│     │ }, []);                                 │                │
│     └─────────────────────────────────────────┘                │
│                                                                 │
│  2. AUTOMATIC SAVE                                              │
│     ┌─────────────────────────────────────────┐                │
│     │ useEffect(() => {                      │                │
│     │   localStorage.setItem(key,             │                │
│     │     JSON.stringify(value));             │                │
│     │ }, [key, value]);                       │                │
│     └─────────────────────────────────────────┘                │
│                                                                 │
│  3. MANUAL SAVE (Function Calls)                               │
│     ┌─────────────────────────────────────────┐                │
│     │ const updateSnapshot = (data) => {      │                │
│     │   setSnapshot(prev => ({...prev, data}));│               │
│     │   localStorage.setItem('akira_snapshot', │                │
│     │     JSON.stringify({...prev, data}));   │                │
│     │ };                                      │                │
│     └─────────────────────────────────────────┘                │
│                                                                 │
│  4. CLEAR DATA                                                  │
│     ┌─────────────────────────────────────────┐                │
│     │ localStorage.removeItem('akira_snapshot');│               │
│     │ localStorage.removeItem('akira_history'); │                │
│     └─────────────────────────────────────────┘                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Storage Limits

- **Capacity**: ~5-10MB per domain
- **Format**: JSON strings
- **Access**: Synchronous (blocking)
- **Persistence**: Until cleared by user or code

### Data Structure

#### Snapshot (akira_snapshot)
```typescript
{
  age: number;
  currentSavings: number;
  monthlyContribution: number;
  retirementAge: number;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  // ... other financial data
}
```

#### History (akira_history)
```typescript
[
  {
    role: 'user' | 'model' | 'function_call' | 'function_response';
    content: string;
    timestamp: string;
    functionCall?: { name: string; args: any };
    functionResponse?: { name: string; response: any };
  }
]
```

---

## Technology Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                    TECHNOLOGY STACK                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │    React     │  │   TypeScript │  │      CSS     │          │
│  │   18.x       │  │     5.x      │  │   (Tailwind) │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                  │                  │                 │
│         └──────────────────┼──────────────────┘                 │
│                            ▼                                    │
│                   ┌──────────────┐                              │
│                   │     Vite     │                              │
│                   │   (Build)    │                              │
│                   └──────────────┘                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      AUDIO & AI                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Web Audio API│  │   Gemini     │  │  Function    │          │
│  │   (Native)   │  │  2.5 Flash   │  │   Calling    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                  │                  │                 │
│         └──────────────────┼──────────────────┘                 │
│                            ▼                                    │
│                   ┌──────────────┐                              │
│                   │  Native Audio│                              │
│                   │   Preview    │                              │
│                   └──────────────┘                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      STORAGE & DEPLOYMENT                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ localStorage │  │    Vercel    │  │     CDN      │          │
│  │   (Browser)  │  │  (Hosting)   │  │  (Global)    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      DEVELOPMENT TOOLS                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │     npm      │  │    Git       │  │   VS Code    │          │
│  │  (Package)   │  │  (Version)   │  │   (Editor)   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Details

#### Core Technologies
- **React 18.x**: UI framework with hooks for state management
- **TypeScript 5.x**: Type-safe JavaScript for better developer experience
- **Vite**: Fast build tool and dev server

#### Audio & AI
- **Web Audio API**: Native browser API for audio capture and playback
- **Gemini 2.5 Flash**: Google's AI model with native audio preview
- **Function Calling**: Structured API for dynamic UI updates

#### Storage & Deployment
- **localStorage**: Browser-based key-value storage
- **Vercel**: Serverless hosting platform with global CDN
- **Static Files**: No server-side code required

#### Development Tools
- **npm**: Package manager for dependencies
- **Git**: Version control system
- **VS Code**: Recommended IDE with TypeScript support

---

## Security & Privacy Model

```
┌─────────────────────────────────────────────────────────────────┐
│                  SECURITY & PRIVACY MODEL                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    DATA FLOW ANALYSIS                           │
└─────────────────────────────────────────────────────────────────┘

    USER BROWSER
         │
         ├─────────────────────────────────────────────────────┐
         │                                                     │
         ▼                                                     ▼
┌─────────────────┐                                 ┌─────────────────┐
│  localStorage    │                                 │  Gemini API     │
│  (Private)       │                                 │  (External)     │
├─────────────────┤                                 ├─────────────────┤
│ • Snapshot      │                                 │ • Audio Data    │
│ • History       │                                 │ • Chat Messages │
│ • Settings      │                                 │ • Context Data  │
│                 │                                 │                 │
│ ✅ Never leaves │                                 │ ⚠️ Sent to API  │
│    browser      │                                 │    for AI       │
└─────────────────┘                                 └─────────────────┘
         │                                                     │
         │                                                     ▼
         │                                          ┌─────────────────┐
         │                                          │  Google Cloud   │
         │                                          │  (Processing)   │
         │                                          ├─────────────────┤
         │                                          │ • AI Model      │
         │                                          │ • Transcription │
         │                                          │ • TTS Generation│
         │                                          │                 │
         │                                          │ ⚠️ Temporary    │
         │                                          │    storage      │
         │                                          └─────────────────┘
         │
         ▼
    NO BACKEND
    (No server to compromise)

┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY MEASURES                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. CLIENT-SIDE ONLY                                            │
│     ✅ No backend server to attack                              │
│     ✅ No database to compromise                                │
│     ✅ No server-side vulnerabilities                           │
│                                                                 │
│  2. LOCAL STORAGE                                               │
│     ✅ Data stays in user's browser                             │
│     ✅ No cross-site data sharing                               │
│     ✅ User controls data deletion                              │
│     ⚠️ Cleared when browser cache is cleared                    │
│                                                                 │
│  3. API COMMUNICATION                                           │
│     ✅ HTTPS encryption for all API calls                       │
│     ✅ API key stored in environment variables                   │
│     ✅ No sensitive data in client code                         │
│     ⚠️ Audio and text sent to Gemini API                        │
│                                                                 │
│  4. MICROPHONE ACCESS                                           │
│     ✅ Requires explicit user permission                        │
│     ✅ Browser security prompts                                 │
│     ✅ Recording only when activated                            │
│                                                                 │
│  5. NO USER ACCOUNTS                                            │
│     ✅ No authentication required                               │
│     ✅ No personal data collection                             │
│     ✅ No tracking or analytics                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    PRIVACY CONSIDERATIONS                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  DATA COLLECTED:                                                │
│  • Voice recordings (sent to Gemini API)                        │
│  • Chat messages (sent to Gemini API)                          │
│  • Financial data (stored locally only)                         │
│                                                                 │
│  DATA NOT COLLECTED:                                            │
│  • Personal identity information                               │
│  • Email addresses                                              │
│  • Phone numbers                                                │
│  • Location data                                                │
│  • Device fingerprinting                                        │
│                                                                 │
│  USER CONTROL:                                                 │
│  • Clear data anytime via browser settings                      │
│  • Revoke microphone access anytime                             │
│  • Close browser to end session                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Security Best Practices

1. **API Key Management**
   - Store in `.env` file (not committed to Git)
   - Use environment variables in production
   - Rotate keys regularly

2. **Input Validation**
   - Validate all user inputs
   - Sanitize data before storage
   - Type checking with TypeScript

3. **Error Handling**
   - Never expose sensitive data in errors
   - Log errors appropriately
   - Provide user-friendly messages

4. **HTTPS Only**
   - Deploy with HTTPS enabled
   - Use secure cookies (if needed)
   - Enforce HTTPS in production

---

## Error Handling

```
┌─────────────────────────────────────────────────────────────────┐
│                    ERROR HANDLING FLOW                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    ERROR SOURCES                                 │
└─────────────────────────────────────────────────────────────────┘

    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
    │   USER       │    │   AUDIO      │    │     API      │
    │   INPUT      │    │   SYSTEM     │    │   CALLS      │
    └──────────────┘    └──────────────┘    └──────────────┘
         │                   │                   │
         ▼                   ▼                   ▼
    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
    │  Invalid     │    │  Mic Access  │    │  Network     │
    │  Data        │    │  Denied      │    │  Errors      │
    └──────────────┘    └──────────────┘    └──────────────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ERROR CATCHING                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  try {                                                          │
│    // Operation that might fail                                 │
│    await someAsyncOperation();                                  │
│  } catch (error) {                                              │
│    handleError(error);                                          │
│  }                                                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ERROR CLASSIFICATION                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  NETWORK ERRORS                                       │   │
│  │  - No internet connection                             │   │
│  │  - API timeout                                        │   │
│  │  - Server error (5xx)                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  AUDIO ERRORS                                          │   │
│  │  - Microphone access denied                            │   │
│  │  - Audio capture failed                                │   │
│  │  - Playback failed                                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  API ERRORS                                             │   │
│  │  - Invalid API key                                      │   │
│  │  - Rate limit exceeded                                  │   │
│  │  - Invalid request                                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  VALIDATION ERRORS                                      │   │
│  │  - Invalid user input                                   │   │
│  │  - Missing required fields                              │   │
│  │  - Type mismatch                                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ERROR RECOVERY                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. USER NOTIFICATION                                           │
│     ┌─────────────────────────────────────────┐                │
│     │ setError("Something went wrong. Please  │                │
│     │         try again.");                   │                │
│     └─────────────────────────────────────────┘                │
│                                                                 │
│  2. STATE RESET                                                 │
│     ┌─────────────────────────────────────────┐                │
│     │ setIsLoading(false);                     │                │
│     │ setIsRecording(false);                   │                │
│     └─────────────────────────────────────────┘                │
│                                                                 │
│  3. RETRY MECHANISM                                            │
│     ┌─────────────────────────────────────────┐                │
│     │ const retry = async (fn, attempts = 3) => {│               │
│     │   for (let i = 0; i < attempts; i++) {  │                │
│     │     try { return await fn(); }          │                │
│     │     catch (err) { if (i === attempts-1) │                │
│     │       throw err; }                      │                │
│     │   }                                      │                │
│     │ };                                      │                │
│     └─────────────────────────────────────────┘                │
│                                                                 │
│  4. GRACEFUL DEGRADATION                                       │
│     ┌─────────────────────────────────────────┐                │
│     │ if (audioFailed) {                       │                │
│     │   // Fallback to text input             │                │
│     │   showTextInput();                      │                │
│     │ }                                       │                │
│     └─────────────────────────────────────────┘                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Error Handling Strategies

1. **Prevention**
   - Validate inputs before processing
   - Check permissions before requesting
   - Handle edge cases proactively

2. **Detection**
   - Try-catch blocks for async operations
   - Error boundaries for React components
   - Event listeners for failures

3. **Recovery**
   - Clear error states
   - Offer retry options
   - Provide alternative methods

4. **User Experience**
   - Clear, actionable error messages
   - Non-blocking error notifications
   - Maintain app functionality

---

## Performance Optimizations

```
┌─────────────────────────────────────────────────────────────────┐
│                  PERFORMANCE OPTIMIZATIONS                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    LOAD TIME OPTIMIZATION                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. CODE SPLITTING                                             │
│     ┌─────────────────────────────────────────┐                │
│     │ const App = lazy(() => import('./App')); │                │
│     │ <Suspense fallback={<Loading />}>        │                │
│     │   <App />                                 │                │
│     │ </Suspense>                              │                │
│     └─────────────────────────────────────────┘                │
│     ✅ Load only what's needed initially                          │
│                                                                 │
│  2. ASSET OPTIMIZATION                                          │
│     ┌─────────────────────────────────────────┐                │
│     │ • Minified JavaScript                    │                │
│     │ • Compressed assets (gzip/brotli)        │                │
│     │ • Optimized images                       │                │
│     │ • Tree-shaking unused code               │                │
│     └─────────────────────────────────────────┘                │
│                                                                 │
│  3. CDN CACHING                                                 │
│     ┌─────────────────────────────────────────┐                │
│     │ Vercel Edge Network                      │                │
│     • Global distribution                      │                │
│     • Automatic caching                        │                │
│     • Fast content delivery                    │                │
│     └─────────────────────────────────────────┘                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    RUNTIME OPTIMIZATION                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. REACT PERFORMANCE                                           │
│     ┌─────────────────────────────────────────┐                │
│     │ • useMemo for expensive calculations     │                │
│     │ • useCallback for function references    │                │
│     │ • React.memo for component memoization   │                │
│     │ • Virtual scrolling for long lists       │                │
│     └─────────────────────────────────────────┘                │
│                                                                 │
│  2. STATE MANAGEMENT                                            │
│     ┌─────────────────────────────────────────┐                │
│     │ • Batch state updates                    │                │
│     │ • Avoid unnecessary re-renders          │                │
│     │ • Debounce rapid inputs                  │                │
│     │ • Throttle expensive operations          │                │
│     └─────────────────────────────────────────┘                │
│                                                                 │
│  3. AUDIO PERFORMANCE                                           │
│     ┌─────────────────────────────────────────┐                │
│     │ • Optimize audio buffer sizes            │                │
│     │ • Stream audio instead of loading all    │                │
│     │ • Reuse audio contexts                   │                │
│     │ • Clean up resources properly            │                │
│     └─────────────────────────────────────────┘                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    STORAGE OPTIMIZATION                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. LOCALSTORAGE EFFICIENCY                                     │
│     ┌─────────────────────────────────────────┐                │
│     │ • Compress large data before storing    │                │
│     │ • Limit history size (e.g., last 50)    │                │
│     │ • Clean up old data periodically         │                │
│     │ • Use efficient data structures          │                │
│     └─────────────────────────────────────────┘                │
│                                                                 │
│  2. DEBOUNCING SAVES                                            │
│     ┌─────────────────────────────────────────┐                │
│     │ const debouncedSave = debounce(         │                │
│     │   () => saveToLocalStorage(),            │                │
│     │   1000                                   │                │
│     │ );                                      │                │
│     └─────────────────────────────────────────┘                │
│     ✅ Reduce write operations                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    NETWORK OPTIMIZATION                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. API REQUEST OPTIMIZATION                                    │
│     ┌─────────────────────────────────────────┐                │
│     │ • Batch multiple requests                │                │
│     │ • Use streaming responses                │                │
│     │ • Implement request cancellation          │                │
│     │ • Cache API responses when appropriate   │                │
│     └─────────────────────────────────────────┘                │
│                                                                 │
│  2. AUDIO TRANSMISSION                                           │
│     ┌─────────────────────────────────────────┐                │
│     │ • Compress audio before upload           │                │
│     │ • Use optimal sample rate (16kHz)       │                │
│     │ • Stream audio chunks                    │                │
│     │ • Implement progressive loading          │                │
│     └─────────────────────────────────────────┘                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Performance Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Initial Load | < 2s | ✓ |
| Time to Interactive | < 3s | ✓ |
| First Contentful Paint | < 1s | ✓ |
| Audio Capture Latency | < 100ms | ✓ |
| API Response Time | < 2s | ✓ |
| State Update Time | < 50ms | ✓ |

### Optimization Checklist

- [x] Code splitting with React.lazy
- [x] Asset minification and compression
- [x] CDN caching with Vercel
- [x] Memoization with useMemo/useCallback
- [x] Debounced localStorage saves
- [x] Efficient audio streaming
- [x] Request cancellation on unmount
- [x] Optimized re-render cycles

---

## Summary

Akira is a **modern, voice-first retirement planning assistant** built with:

- **React & TypeScript** for a robust, type-safe frontend
- **Web Audio API** for seamless voice interaction
- **Gemini 2.5 Flash** for intelligent AI responses
- **Function Calling** for dynamic UI updates
- **localStorage** for client-side data persistence
- **Vercel** for fast, global deployment

The architecture prioritizes:
- ✅ **Privacy**: Data stays local, no user accounts
- ✅ **Performance**: Fast load times, smooth interactions
- ✅ **Security**: Client-side only, HTTPS enforced
- ✅ **Simplicity**: No backend, easy to maintain
- ✅ **Scalability**: Static hosting, global CDN

This architecture document provides a comprehensive overview of how Akira works, from high-level system design to detailed implementation patterns.
