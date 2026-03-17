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

For a more detailed architectural overview with easy-to-understand diagrams, see [ARCHITECTURE.md](ARCHITECTURE.md).

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

**Prerequisites:** Node.js 18+, a microphone, and a Gemini API key

1. Clone the repository:
   ```bash
   git clone https://github.com/adihere/akira-retirement-planner-voice-.git
   cd akira-retirement-planner-voice-
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file and add your Gemini API key:
   ```bash
   cp .env.example .env.local
   # Edit .env.local and set your API key
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

4. Run the app:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Testing the Application

### Quick Start Test

1. **Allow microphone access** when prompted by the browser
2. **Click the microphone button** to start a session with Akira
3. **Speak naturally** - try saying: "Hi Akira, I'm 45 years old and want to retire at 60"
4. **Listen to Akira's response** and continue the conversation
5. **Request your finale report** by saying: "Can you give me my retirement summary?"

### Test Scenarios

| Scenario | What to Say | Expected Result |
|----------|-------------|-----------------|
| **Basic Introduction** | "Hi, I'm new to retirement planning" | Akira introduces herself and asks about your goals |
| **Financial Input** | "I have a pension worth 200,000 pounds and earn 50,000 a year" | Akira acknowledges and may call `updateSnapshot` to save your data |
| **Projection Request** | "What will my retirement look like?" | Akira calculates projections using `calculateRetirementProjection` |
| **Grand Finale** | "Give me my complete retirement report" | Akira triggers `triggerGrandFinale` with full visual report |
| **Context Continuity** | Refresh the page and start a new session | Akira remembers your previous conversation context |

### Troubleshooting

| Issue | Solution |
|-------|----------|
| No audio playback | Check browser audio permissions and volume |
| Microphone not working | Ensure microphone permissions are granted; try a different browser |
| "API key not configured" error | Verify `VITE_GEMINI_API_KEY` is set in `.env.local` |
| Session won't connect | Check your internet connection and API key validity |
| Mobile audio issues | Tap the screen once before starting (helps with AudioContext activation) |

### Browser Compatibility

| Browser | Status | Notes |
|---------|--------|-------|
| Chrome 90+ | Fully Supported | Recommended |
| Firefox 90+ | Fully Supported | - |
| Safari 15+ | Supported | May require user interaction for audio |
| Edge 90+ | Fully Supported | - |
| Mobile Chrome | Supported | Tap screen before starting session |
| Mobile Safari | Supported | Tap screen before starting session |

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

## Roadmap

The following features and improvements are planned for future releases of Akira:

### Authentication & User Management

- 🚧 **Planned**: Firebase Authentication integration (email/password, Google OAuth)
- 🚧 **Planned**: User profile management
- 🚧 **Planned**: Session management

### Cloud Persistence

- 🎯 **Priority**: Firebase Firestore for storing user financial data
- 🎯 **Priority**: Firebase Storage for generated images and reports
- 🔮 **Future**: Cross-device sync capabilities

### Enhanced Features

- 🔮 **Future**: Multi-user planning (couples/family planning)
- 🔮 **Future**: Real-time market data integration
- 🔮 **Future**: Advanced analytics and retirement readiness scores
- 🔮 **Future**: Multi-language support

### Platform Improvements

- 🔮 **Future**: Mobile app development (React Native)
- 🔮 **Future**: Desktop application
- 🔮 **Future**: Integration with financial institutions

## License

MIT
