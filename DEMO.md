# Akira Demo Script

A step-by-step guide for demonstrating Akira at hackathons and presentations.

## Pre-Demo Checklist

- [ ] Ensure microphone is working and permissions are granted
- [ ] Test audio output (speakers/headphones)
- [ ] Have the app open at [your-deployed-url] or localhost:3000
- [ ] Clear localStorage if you want a fresh start: `localStorage.clear()` in console
- [ ] Have this script nearby for reference

## Demo Flow (5 minutes)

### Act 1: Introduction (1 minute)

**Presenter says:**
> "Meet Akira, an AI-powered retirement planning assistant that uses natural voice conversation to help people plan their financial future. Unlike traditional calculators or forms, Akira has a real conversation with you."

**Click the microphone button and say:**
> "Hi Akira, I'm Sarah and I'm 42 years old. I'm starting to think about retirement but I'm not sure where to begin."

**Akira will respond** with a warm introduction and ask clarifying questions.

### Act 2: Financial Discussion (2 minutes)

**Continue the conversation:**
> "I currently earn about 55,000 pounds a year. I have a workplace pension that's worth around 80,000 pounds, and I've been putting money into an ISA - about 25,000 pounds so far."

**Akira will:**
- Acknowledge your financial situation
- Call `updateSnapshot` to save your data (you'll see this in the UI)
- Ask follow-up questions about retirement goals

**Say:**
> "I'd like to retire at 62 if possible. I own my home which is worth about 350,000 pounds with a 150,000 pound mortgage remaining."

### Act 3: Projections (1 minute)

**Ask for projections:**
> "Based on what I've told you, what does my retirement look like? Can you show me some projections?"

**Akira will:**
- Call `calculateRetirementProjection`
- Display an interactive chart showing your projected retirement savings over time
- Explain the numbers verbally

### Act 4: Grand Finale (1 minute)

**Request the full report:**
> "This is really helpful. Can you give me my complete retirement summary report?"

**Akira will:**
- Call `triggerGrandFinale`
- Generate a comprehensive visual report including:
  - Reality Check section with honest assessment
  - AI-generated inspirational retirement image
  - Net worth projection chart
  - Actionable "Way Forward" steps

**Presenter says:**
> "And that's Akira - turning complex retirement planning into a natural conversation, powered by Gemini's native audio capabilities."

## Key Points to Highlight

### Technical Innovation
- **Real-time voice streaming** using Gemini 2.5 Flash Native Audio
- **Bidirectional audio** - both input and output are live streamed
- **Function calling** integrated with voice for dynamic UI updates
- **Persistent context** - Akira remembers previous conversations

### User Experience
- **No forms to fill** - just natural conversation
- **Immediate feedback** - real-time transcription and response
- **Visual + audio** - charts and reports complement voice explanations
- **Mobile friendly** - works on phones with proper AudioContext handling

### Problem Solved
- Retirement planning is intimidating and confusing
- Traditional tools require users to know what questions to ask
- Akira guides the conversation and asks the right questions
- Makes financial planning accessible to everyone

## Backup Demo (If Technical Issues)

If live demo fails, show:
1. The architecture diagram in README.md
2. Screenshots of the finale report
3. Walk through the code structure and explain the flow

## Q&A Preparation

**Q: How does the voice streaming work?**
> We use Gemini's Live API which provides bidirectional audio streaming. Audio is captured via Web Audio API, converted to base64 PCM, and streamed to Gemini. Responses come back as audio chunks that are played immediately.

**Q: Is the financial advice accurate?**
> Akira provides general guidance and projections, not regulated financial advice. The calculations use standard compound interest formulas. For actual financial decisions, users should consult a qualified advisor.

**Q: How do you handle privacy?**
> All conversation data stays in the browser's localStorage. Nothing is stored on external servers except for the API calls to Gemini.

**Q: What makes this different from ChatGPT?**
> Native audio streaming - there's no speech-to-text or text-to-speech step. Gemini processes audio directly, making conversations feel natural with lower latency.
