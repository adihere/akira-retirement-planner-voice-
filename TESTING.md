# Testing Guide for Akira Retirement Planner

This guide provides comprehensive instructions for running, writing, and maintaining tests for the Akira Retirement Planner application.

## Table of Contents

- [Overview](#overview)
- [Test Stack](#test-stack)
- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [Writing Tests](#writing-tests)
- [Test Utilities](#test-utilities)
- [Mocking](#mocking)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

The Akira Retirement Planner uses a comprehensive testing suite built with Vitest and React Testing Library. The tests are designed to be:

- **Deterministic**: Tests produce the same results on every run
- **Fast**: Tests run quickly to enable rapid development
- **Maintainable**: Tests are easy to understand and modify
- **Comprehensive**: Tests cover critical user flows and edge cases

## Test Stack

- **Vitest**: Fast unit testing framework with built-in TypeScript support
- **React Testing Library**: For testing React components in a user-centric way
- **jsdom**: DOM implementation for testing in Node.js
- **@testing-library/user-event**: For simulating user interactions
- **MSW (Mock Service Worker)**: For mocking API requests (optional)

## Running Tests

### Run All Tests

```bash
npm test
```

This runs tests in watch mode, automatically re-running when files change.

### Run Tests Once

```bash
npm run test:run
```

Runs all tests once and exits.

### Run Tests with UI

```bash
npm run test:ui
```

Opens the Vitest UI for an interactive test experience.

### Run Tests with Coverage

```bash
npm run test:coverage
```

Runs all tests and generates a coverage report in the `coverage/` directory.

### Run Specific Test File

```bash
npm test audio.test.ts
```

### Run Tests Matching a Pattern

```bash
npm test -- --grep "AudioRecorder"
```

## Test Structure

Tests are organized in the `src/__tests__/` directory following the project structure:

```
src/
├── __tests__/
│   ├── utils/
│   │   ├── test-helpers.tsx      # Reusable test utilities
│   │   └── mocks.ts              # Common mocks
│   ├── lib/
│   │   └── audio.test.ts         # Audio module tests
│   ├── auth/
│   │   └── AuthContext.test.tsx  # Authentication tests
│   └── App.test.tsx             # Main App component tests
├── setup.ts                      # Global test setup
└── vitest.config.ts              # Vitest configuration
```

### Test Files

- **Unit Tests**: Test individual functions, classes, and modules
- **Integration Tests**: Test how multiple components work together
- **Component Tests**: Test React components and their behavior

## Writing Tests

### Basic Test Structure

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'

describe('ComponentName', () => {
  beforeEach(() => {
    // Setup before each test
  })

  afterEach(() => {
    // Cleanup after each test
  })

  it('should do something', () => {
    // Arrange
    const expected = 'expected value'

    // Act
    const actual = 'actual value'

    // Assert
    expect(actual).toBe(expected)
  })
})
```

### Testing React Components

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AuthProvider } from '../auth/AuthContext'

function renderWithProviders(ui: ReactElement) {
  return render(
    <AuthProvider>
      {ui}
    </AuthProvider>
  )
}

describe('MyComponent', () => {
  it('should render correctly', () => {
    renderWithProviders(<MyComponent />)

    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })

  it('should handle button click', async () => {
    renderWithProviders(<MyComponent />)

    const button = screen.getByRole('button', { name: /submit/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('Success')).toBeInTheDocument()
    })
  })
})
```

### Testing Async Operations

```typescript
it('should handle async operation', async () => {
  render(<MyComponent />)

  // Wait for async operation to complete
  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeInTheDocument()
  })
})

it('should handle promise rejection', async () => {
  render(<MyComponent />)

  await expect(asyncOperation()).rejects.toThrow('Error message')
})
```

## Test Utilities

### Available Test Helpers

Located in `src/__tests__/utils/test-helpers.tsx`:

- `renderWithProviders()`: Render components with AuthProvider
- `waitForCondition()`: Wait for a condition to be true
- `createMockUser()`: Create a mock Firebase user object
- `createMockAudioContext()`: Create a mock Web Audio API context
- `createMockMediaStream()`: Create a mock media stream
- `pcm16ToBase64()`: Convert PCM16 audio data to base64
- `createSamplePCM16()`: Create sample PCM16 audio data
- `mockConsole()`: Mock console methods to reduce test noise

### Using Test Helpers

```typescript
import { renderWithProviders, createMockUser } from '../utils/test-helpers'

describe('MyComponent', () => {
  it('should display user information', () => {
    const mockUser = createMockUser({
      displayName: 'John Doe',
      email: 'john@example.com',
    })

    renderWithProviders(<UserProfile user={mockUser} />)

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
  })
})
```

## Mocking

### Firebase Mocks

Located in `src/__tests__/utils/mocks.ts`:

```typescript
import { mockFirebaseAuth, mockUser } from '../utils/mocks'

// Mock Firebase Auth
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => mockFirebaseAuth),
  GoogleAuthProvider: vi.fn(() => ({})),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
}))
```

### Web Audio API Mocks

```typescript
import { createMockAudioContext } from '../utils/test-helpers'

// Mock AudioContext
global.AudioContext = vi.fn(() => createMockAudioContext()) as any
```

### Google GenAI API Mocks

```typescript
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    live: {
      connect: vi.fn().mockResolvedValue({
        sendClientContent: vi.fn(),
        sendRealtimeInput: vi.fn(),
        sendToolResponse: vi.fn(),
        close: vi.fn(),
      }),
    },
  })),
}))
```

### localStorage Mocks

The global setup in `src/setup.ts` automatically mocks localStorage:

```typescript
// Clear localStorage before each test
beforeEach(() => {
  localStorage.clear()
})

// Use localStorage in tests
localStorage.setItem('akira_history', JSON.stringify(mockHistory))
const saved = localStorage.getItem('akira_history')
```

## Best Practices

### 1. Test User Behavior, Not Implementation

```typescript
// ✅ Good - Tests user behavior
it('should display error message when connection fails', async () => {
  render(<App />)
  await connect()
  expect(screen.getByText(/unable to connect/i)).toBeInTheDocument()
})

// ❌ Bad - Tests implementation details
it('should set connectionError state', () => {
  // Don't test internal state
})
```

### 2. Use Descriptive Test Names

```typescript
// ✅ Good - Descriptive
it('should throw error when microphone permission is denied', () => {})

// ❌ Bad - Vague
it('should handle error', () => {})
```

### 3. Arrange, Act, Assert Pattern

```typescript
it('should increment trial count when user sends message', () => {
  // Arrange
  localStorage.setItem('akira_trial_count', '0')

  // Act
  render(<App />)
  // ... trigger message send

  // Assert
  expect(parseInt(localStorage.getItem('akira_trial_count') || '0', 10)).toBe(1)
})
```

### 4. Use waitFor for Async Operations

```typescript
// ✅ Good - Uses waitFor
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument()
})

// ❌ Bad - No waiting
expect(screen.getByText('Success')).toBeInTheDocument()
```

### 5. Mock External Dependencies

```typescript
// ✅ Good - Mocks external dependencies
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  signInWithPopup: vi.fn(),
}))

// ❌ Bad - Uses real dependencies
// This makes tests slow and non-deterministic
```

### 6. Clean Up After Tests

```typescript
afterEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})
```

### 7. Test Edge Cases

```typescript
it('should handle corrupted localStorage data', () => {
  localStorage.setItem('akira_history', 'invalid json')
  render(<App />)
  expect(screen.getByText('Akira')).toBeInTheDocument()
})

it('should handle empty history', () => {
  render(<App />)
  expect(screen.queryByText('Conversation History')).not.toBeInTheDocument()
})
```

## Troubleshooting

### Tests Fail with "Cannot find module"

Ensure all dependencies are installed:

```bash
npm install
```

### Tests Fail with Type Errors

Check that TypeScript types are correct and that you're using proper type assertions:

```typescript
const mockEvent = {
  inputBuffer: {
    getChannelData: vi.fn(() => new Float32Array(4096)),
  },
} as any
```

### Tests Are Slow

- Use mocks for external dependencies (Firebase, Google GenAI, Web Audio API)
- Avoid unnecessary `waitFor` calls
- Keep tests focused and small

### Tests Are Flaky

- Ensure tests are deterministic (no random data or timing dependencies)
- Use proper async/await patterns
- Clean up state between tests

### Coverage Is Low

Add more tests for:
- Edge cases and error scenarios
- User interactions
- Component state changes
- Integration between components

## Regression Testing

To run tests for regression testing before deploying:

```bash
# Run all tests once
npm run test:run

# Run with coverage
npm run test:coverage
```

### CI/CD Integration

Add to your CI/CD pipeline:

```yaml
# Example GitHub Actions
- name: Run tests
  run: npm run test:run

- name: Generate coverage
  run: npm run test:coverage
```

## Adding New Tests

When adding new features:

1. Create a test file in the appropriate directory
2. Write tests for the happy path (success scenarios)
3. Write tests for error scenarios
4. Write tests for edge cases
5. Run tests to ensure they pass
6. Check coverage to ensure adequate coverage

### Example: Adding a New Component Test

```typescript
// src/__tests__/components/NewComponent.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { renderWithProviders } from '../utils/test-helpers'
import NewComponent from '../../components/NewComponent'

describe('NewComponent', () => {
  it('should render correctly', () => {
    renderWithProviders(<NewComponent />)
    expect(screen.getByText('New Component')).toBeInTheDocument()
  })

  it('should handle user interaction', () => {
    renderWithProviders(<NewComponent />)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    expect(screen.getByText('Clicked')).toBeInTheDocument()
  })
})
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library Documentation](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Support

For issues or questions about testing:

1. Check this documentation
2. Review existing tests for examples
3. Consult Vitest and React Testing Library documentation
4. Ask the team for guidance
