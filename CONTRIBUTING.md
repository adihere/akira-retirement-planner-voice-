# Contributing to Akira

Thank you for your interest in contributing to Akira! This document provides guidelines and instructions for contributing.

## Getting Started

### Prerequisites

- Node.js 18 or higher
- A Gemini API key (get one at [Google AI Studio](https://aistudio.google.com/))
- A microphone for testing voice features

### Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/akira-retirement-planner-voice-.git
   cd akira-retirement-planner-voice-
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create environment file:
   ```bash
   cp .env.example .env.local
   # Add your VITE_GEMINI_API_KEY
   ```
5. Start development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
akira-retirement-planner-voice-/
├── src/
│   ├── App.tsx          # Main application component
│   ├── main.tsx         # Entry point
│   ├── index.css        # Global styles
│   └── lib/
│       └── audio.ts     # Audio recording/streaming utilities
├── public/              # Static assets
├── index.html           # HTML template
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
└── package.json         # Dependencies and scripts
```

## Code Style

### TypeScript
- Use TypeScript for all new code
- Prefer explicit types over `any` where possible
- Use interfaces for object shapes

### React
- Use functional components with hooks
- Keep components focused and single-purpose
- Extract reusable logic into custom hooks

### CSS
- Use Tailwind CSS utility classes
- Follow the existing color scheme (olive, cream, sage)
- Ensure mobile responsiveness

## Making Changes

### Branch Naming
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates

### Commit Messages
Use clear, descriptive commit messages:
```
feat: add retirement age slider component
fix: resolve AudioContext suspension on mobile Safari
docs: update testing instructions in README
```

### Pull Request Process

1. Create a feature branch from `main`
2. Make your changes with clear commits
3. Test thoroughly, including:
   - Desktop Chrome and Firefox
   - Mobile Chrome and Safari
   - Different microphone configurations
4. Update documentation if needed
5. Submit a pull request with a clear description

## Areas for Contribution

### High Priority
- [ ] Add unit tests for audio utilities
- [ ] Improve error handling and user feedback
- [ ] Add more retirement planning scenarios
- [ ] Internationalization support

### Feature Ideas
- Multiple language support
- Export reports as PDF
- Integration with financial APIs
- Comparison with different retirement strategies
- Partner/spouse joint planning mode

### Documentation
- More detailed API documentation
- Video tutorials
- Case studies and examples

## Testing

### Manual Testing Checklist

Before submitting a PR, verify:

- [ ] Voice recording works in Chrome
- [ ] Voice recording works in Firefox
- [ ] Voice recording works on mobile
- [ ] Audio playback is clear
- [ ] Transcriptions appear correctly
- [ ] Tool calls trigger appropriate UI updates
- [ ] Finale report displays all sections
- [ ] Charts render correctly
- [ ] LocalStorage persistence works
- [ ] Error states display helpful messages

### Running Linter
```bash
npm run lint
```

## Questions?

If you have questions or need help:
1. Check existing issues for similar questions
2. Open a new issue with the "question" label
3. Be specific about what you're trying to accomplish

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
