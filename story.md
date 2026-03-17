# Akira: Your Voice-First UK Retirement Coach

## Inspiration

Retirement planning is broken. For most people, it's a massive blind spot—we ignore our pensions because they feel abstract, distant, and frankly, boring. Traditional financial tools bombard users with complex forms, intimidating spreadsheets, and dry PDFs that end up in a drawer, never to be seen again.

The problem isn't that people don't care about their future. The problem is that the tools we've built to help them plan for it are fundamentally misaligned with how humans actually think and communicate. A chart doesn't motivate you to save—a vision does. A spreadsheet doesn't inspire you to dream—a conversation does.

I wanted to build something different: an AI companion that transforms retirement planning from a dreaded chore into an engaging, voice-first conversation. Something that meets people where they are, speaks their language, and guides them naturally through one of life's most important financial decisions.

## What It Does

Akira is a voice-first AI retirement coach that helps UK residents plan their financial future through natural conversation—no forms, no spreadsheets, no jargon.

**Voice-First Experience**: Simply speak to Akira about your retirement goals, current savings, and lifestyle aspirations. Akira listens, understands, and responds in real-time, asking the right questions at the right time to build a complete picture of your financial situation.

**Dynamic Financial Snapshots**: As you talk, Akira builds and updates a live dashboard showing your current age, target retirement age, pension balances, ISA savings, home equity, and monthly lifestyle costs. All data persists across sessions, so you can pick up where you left off.

**Interactive Projections**: Ask to see your future, and Akira generates interactive charts showing your projected retirement savings trajectory over time, based on compound interest calculations and your current contribution patterns.

**Vision Board Generation**: Once Akira has gathered your complete financial picture, she creates a personalized "Grand Finale" report featuring:
- A reality check assessing whether you're on track for your retirement dreams
- An AI-generated image visualizing your ideal retirement lifestyle
- Three specific, actionable steps to improve your financial position
- A year-by-year net worth projection leading up to retirement

**Persistent Context**: Akira remembers your previous conversations through localStorage, allowing you to continue planning across multiple sessions without starting from scratch.

## How We Built It

Akira leverages cutting-edge Google AI technology to create a truly conversational financial planning experience:

**Gemini 2.5 Flash Native Audio Preview**: The core innovation is using Gemini's native audio streaming capabilities. Unlike traditional voice assistants that convert speech-to-text, process as text, then convert back to speech, Akira streams audio directly to and from Gemini. This enables:
- Bidirectional real-time audio streaming
- Lower latency and more natural conversation flow
- The ability to interrupt Akira mid-response, just like a real conversation
- Live transcription of both user and AI speech

**Function Calling for Dynamic UI**: Akira uses Gemini's function calling to trigger real-time UI updates:
- `updateSnapshot`: Saves user financial data to localStorage and updates the sidebar dashboard
- `calculateRetirementProjection`: Generates interactive charts showing retirement savings trajectories
- `triggerGrandFinale`: Creates the comprehensive retirement report with AI-generated imagery

**Client-Side Architecture**: Built as a pure React application with no backend server:
- React 19 for the user interface
- Vite for fast development and optimized builds
- TailwindCSS for responsive, accessible styling
- Motion (Framer Motion) for smooth animations
- Recharts for interactive financial visualizations
- Web Audio API for microphone capture and audio playback

**Deployment**: Hosted on Vercel for seamless global distribution and automatic SSL.

## Challenges We Ran Into

**Audio Context on Mobile Browsers**: Mobile browsers have strict autoplay policies that suspend AudioContext until user interaction. We implemented robust error handling and automatic context resumption to ensure Akira works reliably on both desktop and mobile devices.

**Real-Time State Management**: Coordinating live audio streaming, transcription, and function calls required careful state management. We used React refs for frequently updated values (like transcripts) to avoid unnecessary re-renders while maintaining smooth UI performance.

**Latency Optimization**: Balancing audio quality with response latency was crucial. We optimized buffer sizes and chunked audio transmission to achieve natural conversation flow without sacrificing audio clarity.

**Persistent Context Restoration**: Ensuring Akira remembers previous conversations required carefully managing localStorage and sending conversation history to Gemini when reconnecting. We implemented a robust system that restores context while respecting the model's token limits.

## Accomplishments We're Proud Of

**First-of-Its-Kind Voice-First Financial Planner**: We believe Akira is among the first applications to use Gemini's native audio streaming for financial planning, creating a genuinely conversational experience that feels natural and intuitive.

**Zero-Form User Experience**: Users can complete a comprehensive retirement planning session without typing a single character or filling out a single form. Everything happens through natural conversation.

**Real-Time Visual Feedback**: As users speak, they see their financial snapshot update live, with interactive charts and AI-generated imagery that bring their retirement vision to life.

**Cross-Platform Compatibility**: Akira works seamlessly on desktop browsers, tablets, and mobile phones, with proper handling of mobile audio constraints and responsive design.

**Privacy-First Design**: All user data stays in the browser's localStorage. Nothing is stored on external servers except for the API calls to Gemini, giving users control over their financial information.

## What We Learned

**Finance is Emotional, Not Just Mathematical**: We discovered that successful retirement planning tools must address the emotional and aspirational aspects of financial decisions, not just the math. People connect with visions of their future, not spreadsheets.

**Voice Changes Everything**: Removing forms and enabling natural conversation dramatically lowers the barrier to entry. Users who would never touch a retirement calculator are happy to talk about their dreams and goals.

**Context is King**: The ability to remember previous conversations and build on them makes the AI feel more like a trusted advisor than a one-time tool. Persistence creates a sense of relationship and continuity.

**Simplicity Wins**: Despite the complex technology under the hood, the user experience is deceptively simple. The best technology disappears into the background, letting users focus on what matters: their future.

## What's Next for Akira

The vision for Akira extends far beyond the current prototype:

**Multi-Language Support**: Expanding to support multiple languages and regional retirement planning nuances, making Akira accessible to a global audience.

**Advanced Scenario Modeling**: Adding "what-if" analysis capabilities, allowing users to explore different retirement scenarios (e.g., "What if I retire 2 years earlier?" or "What if I increase my contributions by 20%?").

**Tax Optimization Guidance**: Providing general educational information about UK tax implications in retirement, including pension tax relief, ISA allowances, and tax-efficient withdrawal strategies.

**Collaborative Planning**: Enabling couples to plan together, with Akira facilitating conversations about shared goals and joint financial decisions.

**Integration with Real Financial Data**: Exploring secure ways to connect with actual financial institutions (with user permission) to pull real-time account data, eliminating manual data entry while maintaining privacy.

**Expanded AI Personalities**: Offering different coaching styles—from analytical and data-driven to warm and empathetic—so users can choose the approach that resonates best with their personality.

---

**Built for the Google Gemini Hackathon 2025**

Akira demonstrates the transformative power of Gemini's native audio capabilities, showing how AI can make complex financial planning accessible, engaging, and genuinely helpful for everyone.
