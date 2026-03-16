<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Akira - Retirement Planning Voice Assistant

An app built with and uses Gemini and Google AI Studio proudly.

Akira is an AI-powered voice assistant that helps users plan their retirement through natural conversation. It uses Gemini's live audio streaming capabilities to provide real-time, personalized financial guidance.

## Architecture

```mermaid
flowchart TB
    subgraph Client["Browser Client"]
        UI["React UI<br/>(App.tsx)"]
        AR["AudioRecorder<br/>(Web Audio API)"]
        AS["AudioStreamer<br/>(Audio Playback)"]
    end

    subgraph GeminiAPI["Gemini Live API"]
        LM["Gemini 2.5 Flash<br/>Native Audio Model"]
        TH["Tool Handler"]
    end

    subgraph Tools["Function Tools"]
        T1["triggerGrandFinale"]
        T2["calculateRetirementProjection"]
        T3["updateSnapshot"]
    end

    subgraph Storage["Local Storage"]
        LS["Conversation History<br/>User Snapshot"]
    end

    UI -->|"Start Session"| AR
    AR -->|"PCM Audio (base64)"| LM
    LM -->|"Audio Response"| AS
    AS -->|"Playback"| UI

    LM -->|"Transcriptions"| UI
    LM -->|"Tool Calls"| TH
    TH --> T1
    TH --> T2
    TH --> T3

    T1 -->|"Generate Finale Report"| UI
    T2 -->|"Projection Data"| UI
    T3 -->|"Save User Data"| LS

    LS -->|"Restore Context"| UI
```

## Data Flow

```mermaid
sequenceDiagram
    participant User
    participant UI as React App
    participant Recorder as AudioRecorder
    participant Gemini as Gemini Live API
    participant Streamer as AudioStreamer

    User->>UI: Click Microphone Button
    UI->>Gemini: Connect to Live Session
    Gemini-->>UI: Session Established
    UI->>Recorder: Start Recording
    
    loop Conversation
        User->>Recorder: Speak
        Recorder->>Gemini: Send Audio (PCM base64)
        Gemini-->>UI: Input Transcription
        Gemini->>Gemini: Process & Generate Response
        Gemini-->>Streamer: Audio Response
        Gemini-->>UI: Output Transcription
        Streamer->>User: Play Audio
    end

    User->>UI: Request Grand Finale
    Gemini->>Gemini: Call triggerGrandFinale Tool
    Gemini-->>UI: Finale Data (Report + Projections)
    UI->>User: Display Retirement Report
```

## Features

- **Real-time Voice Conversation**: Natural dialogue powered by Gemini's native audio streaming
- **Retirement Planning Tools**: Projection calculations, snapshot tracking, and comprehensive finale reports
- **Persistent Context**: Conversation history and user data saved locally for continuity
- **Mobile-Friendly**: AudioContext handling optimized for mobile browsers

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set the `VITE_GEMINI_API_KEY` in `.env.local` to your Gemini API key:
   ```bash
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

3. Run the app:
   ```bash
   npm run dev
   ```

## Tech Stack

- **Frontend**: React 19, Vite, TailwindCSS, Motion (Framer Motion)
- **AI**: Google Gemini 2.5 Flash Native Audio Preview
- **Audio**: Web Audio API (AudioContext, MediaStream)
- **Charts**: Recharts
- **Deployment**: Vercel

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_GEMINI_API_KEY` | Your Google Gemini API key |

## License

MIT
