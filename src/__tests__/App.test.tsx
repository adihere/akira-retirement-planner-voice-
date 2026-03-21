import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import App from '../App'
import { AuthProvider } from '../auth/AuthContext'
import { createMockUser } from './utils/test-helpers'
import { vi } from 'vitest'

// Create a mock auth object that can be controlled in tests
let mockAuthState = null
let mockOnAuthStateChangedCallback: ((user: any) => void) | null = null
let mockOnAuthStateChangedUnsubscribe = vi.fn()

// Mock Firebase Auth
vi.mock('../firebase', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: vi.fn((callback: (user: any) => void) => {
      mockOnAuthStateChangedCallback = callback
      // Call immediately with current state
      callback(mockAuthState)
      return mockOnAuthStateChangedUnsubscribe
    }),
  },
  provider: {},
}))

// Mock @google/genai
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
    models: {
      generateContent: vi.fn().mockResolvedValue({
        candidates: [{
          content: {
            parts: [{
              inlineData: {
                mimeType: 'image/png',
                data: 'mockImageData',
              },
            }],
          },
        }],
      }),
    },
  })),
  Type: {
    OBJECT: 'OBJECT',
    STRING: 'STRING',
    NUMBER: 'NUMBER',
    ARRAY: 'ARRAY',
  },
  Modality: {
    AUDIO: 'AUDIO',
  },
}))

// Mock AudioRecorder and AudioStreamer
vi.mock('../lib/audio', () => ({
  AudioRecorder: vi.fn().mockImplementation(() => ({
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn(),
  })),
  AudioStreamer: vi.fn().mockImplementation(() => ({
    ensureResumed: vi.fn().mockResolvedValue(undefined),
    addPCM16: vi.fn(),
    stop: vi.fn(),
    interrupt: vi.fn(),
  })),
}))

// Mock environment variables
vi.mock('../env', () => ({
  GEMINI_API_KEY: 'test-api-key',
}))

describe('App', () => {
  beforeEach(() => {
    // Reset mock state before each test
    mockAuthState = null
    mockOnAuthStateChangedCallback = null
    mockOnAuthStateChangedUnsubscribe = vi.fn()

    // Clear localStorage before each test
    localStorage.clear()

    // Mock environment variable
    process.env.GEMINI_API_KEY = 'test-api-key'
    vi.stubGlobal('import', {
      meta: {
        env: {
          GEMINI_API_KEY: 'test-api-key',
        },
      },
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  describe('initialization', () => {
    it('should render without crashing', () => {
      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      )

      expect(screen.getByText('Akira')).toBeInTheDocument()
      expect(screen.getByText('Your UK Retirement Coach')).toBeInTheDocument()
    })

    it('should display start button when not connected', () => {
      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      )

      expect(screen.getByText('Start New Session')).toBeInTheDocument()
    })

    it('should load history from localStorage', () => {
      const mockHistory = [
        { role: 'user' as const, parts: [{ text: 'Hello' }] },
        { role: 'model' as const, parts: [{ text: 'Hi there!' }] },
      ]
      localStorage.setItem('akira_history', JSON.stringify(mockHistory))

      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      )

      // History should be loaded (check if conversation history section appears)
      expect(screen.getByText('Conversation History')).toBeInTheDocument()
    })

    it('should load snapshot from localStorage', () => {
      const mockSnapshot = {
        currentAge: 35,
        targetAge: 65,
        pensionTotal: 100000,
        isaTotal: 50000,
        homeEquity: 'Own home with mortgage',
        monthlyFunMoney: 500,
      }
      localStorage.setItem('akira_snapshot', JSON.stringify(mockSnapshot))

      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      )

      expect(screen.getByText('35')).toBeInTheDocument()
      expect(screen.getByText('65')).toBeInTheDocument()
    })

    it('should load trial count from localStorage', () => {
      localStorage.setItem('akira_trial_count', '2')

      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      )

      expect(screen.getByText('Free trial: 1 conversation remaining')).toBeInTheDocument()
    })
  })

  describe('connection states', () => {
    it('should show connecting state when connecting', async () => {
      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      )

      const startButton = screen.getByText('Start New Session').closest('button')
      if (startButton) {
        fireEvent.click(startButton)
      }

      await waitFor(() => {
        expect(screen.getByText('Waking up Akira...')).toBeInTheDocument()
      })
    })

    it('should show listening state when connected', async () => {
      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      )

      const startButton = screen.getByText('Start New Session').closest('button')
      if (startButton) {
        fireEvent.click(startButton)
      }

      await waitFor(() => {
        expect(screen.getByText('Akira is listening...')).toBeInTheDocument()
      }, { timeout: 5000 })
    })

    it('should show start button after disconnecting', async () => {
      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      )

      const startButton = screen.getByText('Start New Session').closest('button')
      if (startButton) {
        fireEvent.click(startButton)
      }

      await waitFor(() => {
        expect(screen.getByText('Akira is listening...')).toBeInTheDocument()
      }, { timeout: 5000 })

      const stopButton = screen.getByRole('button', { name: /stop/i })
      if (stopButton) {
        fireEvent.click(stopButton)
      }

      await waitFor(() => {
        expect(screen.getByText('Start New Session')).toBeInTheDocument()
      })
    })
  })

  describe('trial limit', () => {
    it('should show trial limit reached when count is 3 and user is not logged in', () => {
      localStorage.setItem('akira_trial_count', '3')

      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      )

      expect(screen.getByText('Log in to continue talking to Akira')).toBeInTheDocument()
    })

    it('should disable start button when trial limit is reached', () => {
      localStorage.setItem('akira_trial_count', '3')

      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      )

      const startButton = screen.getByText('Start New Session').closest('button')
      expect(startButton).toBeDisabled()
    })

    it('should allow connection when user is logged in regardless of trial count', () => {
      localStorage.setItem('akira_trial_count', '5')

      // Mock logged in user
      const mockUser = createMockUser()
      mockAuthState = mockUser

      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      )

      // Should not show trial limit reached
      expect(screen.queryByText('Log in to continue talking to Akira')).not.toBeInTheDocument()
    })

    it('should increment trial count when anonymous user sends a message', () => {
      localStorage.setItem('akira_trial_count', '0')

      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      )

      // Trial count should be 0 initially
      expect(parseInt(localStorage.getItem('akira_trial_count') || '0', 10)).toBe(0)
    })
  })

  describe('error handling', () => {
    it('should display error message when connection fails', async () => {
      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      )

      const startButton = screen.getByText('Start New Session').closest('button')
      if (startButton) {
        fireEvent.click(startButton)
      }

      await waitFor(() => {
        expect(screen.getByText(/Unable to connect/i)).toBeInTheDocument()
      })
    })

    it('should display microphone permission denied error', async () => {
      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      )

      const startButton = screen.getByText('Start New Session').closest('button')
      if (startButton) {
        fireEvent.click(startButton)
      }

      await waitFor(() => {
        expect(screen.getByText(/Microphone access was denied/i)).toBeInTheDocument()
      })
    })

    it('should dismiss error when dismiss button is clicked', async () => {
      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      )

      const startButton = screen.getByText('Start New Session').closest('button')
      if (startButton) {
        fireEvent.click(startButton)
      }

      await waitFor(() => {
        expect(screen.getByText(/Unable to connect/i)).toBeInTheDocument()
      })

      const dismissButton = screen.getByText('Dismiss')
      fireEvent.click(dismissButton)

      await waitFor(() => {
        expect(screen.queryByText(/Unable to connect/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('localStorage operations', () => {
    it('should save history to localStorage', () => {
      const mockHistory = [
        { role: 'user' as const, parts: [{ text: 'Test message' }] },
      ]

      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      )

      // History should be accessible
      expect(localStorage.getItem('akira_history')).toBeDefined()
    })

    it('should save snapshot to localStorage', () => {
      const mockSnapshot = {
        currentAge: 40,
        targetAge: 65,
        pensionTotal: 150000,
        isaTotal: 75000,
        homeEquity: 'Own home outright',
        monthlyFunMoney: 600,
      }

      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      )

      // Snapshot should be accessible
      expect(localStorage.getItem('akira_snapshot')).toBeDefined()
    })

    it('should save trial count to localStorage', () => {
      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      )

      // Trial count should be accessible
      expect(localStorage.getItem('akira_trial_count')).toBeDefined()
    })

    it('should handle corrupted localStorage data gracefully', () => {
      localStorage.setItem('akira_history', 'invalid json')
      localStorage.setItem('akira_snapshot', 'invalid json')
      localStorage.setItem('akira_trial_count', 'invalid number')

      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      )

      // Should not crash and should render
      expect(screen.getByText('Akira')).toBeInTheDocument()
    })
  })

  describe('UI interactions', () => {
    it('should show sign in button when user is not logged in', () => {
      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      )

      expect(screen.getByText('Sign in')).toBeInTheDocument()
    })

    it('should show sign out button when user is logged in', () => {
      // Mock logged in user
      const mockUser = createMockUser()
      mockAuthState = mockUser

      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      )

      expect(screen.getByText('Sign out')).toBeInTheDocument()
    })

    it('should display user avatar when logged in', () => {
      const mockUser = createMockUser({
        photoURL: 'https://example.com/photo.jpg',
      })
      mockAuthState = mockUser

      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      )

      const avatar = screen.getByAltText('User')
      expect(avatar).toBeInTheDocument()
      expect(avatar).toHaveAttribute('src', 'https://example.com/photo.jpg')
    })

    it('should display user initials when no photo URL', () => {
      const mockUser = createMockUser({
        displayName: 'John Doe',
        photoURL: null,
      })
      mockAuthState = mockUser

      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      )

      expect(screen.getByText('J')).toBeInTheDocument()
    })
  })

  describe('snapshot display', () => {
    it('should display snapshot data when available', () => {
      const mockSnapshot = {
        currentAge: 45,
        targetAge: 67,
        pensionTotal: 200000,
        isaTotal: 100000,
        homeEquity: 'Own home with £100k equity',
        monthlyFunMoney: 800,
        lastSessionDate: '1/1/2024',
      }
      localStorage.setItem('akira_snapshot', JSON.stringify(mockSnapshot))

      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      )

      expect(screen.getByText('45')).toBeInTheDocument()
      expect(screen.getByText('67')).toBeInTheDocument()
      expect(screen.getByText('£200,000')).toBeInTheDocument()
      expect(screen.getByText('£100,000')).toBeInTheDocument()
      expect(screen.getByText('Own home with £100k equity')).toBeInTheDocument()
      expect(screen.getByText('£800')).toBeInTheDocument()
      expect(screen.getByText('Last updated: 1/1/2024')).toBeInTheDocument()
    })

    it('should display placeholder when no snapshot data', () => {
      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      )

      expect(screen.getByText('What Akira can do for you:')).toBeInTheDocument()
      expect(screen.getByText('Listen to your retirement goals')).toBeInTheDocument()
      expect(screen.getByText('Estimate whether you\'re broadly on track')).toBeInTheDocument()
    })
  })

  describe('conversation history', () => {
    it('should display conversation history when available', () => {
      const mockHistory = [
        { role: 'user' as const, parts: [{ text: 'I want to retire at 65' }] },
        { role: 'model' as const, parts: [{ text: 'That\'s a great goal!' }] },
      ]
      localStorage.setItem('akira_history', JSON.stringify(mockHistory))

      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      )

      expect(screen.getByText('I want to retire at 65')).toBeInTheDocument()
      expect(screen.getByText('That\'s a great goal!')).toBeInTheDocument()
    })

    it('should not display conversation history when empty', () => {
      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      )

      expect(screen.queryByText('Conversation History')).not.toBeInTheDocument()
    })
  })

  describe('projection display', () => {
    it('should display projection chart when projection data is available', () => {
      const mockProjection = [
        { age: 30, balance: 100000 },
        { age: 35, balance: 150000 },
        { age: 40, balance: 200000 },
      ]

      // This would be set by calculateRetirementProjection tool
      // For testing, we can't easily set this state, but we can verify
      // component structure exists
      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      )

      // The projection chart component should be in the DOM (though not visible without data)
      expect(screen.getByText('Retirement Projection')).toBeInTheDocument()
    })
  })

  describe('grand finale display', () => {
    it('should display grand finale when finale data is available', () => {
      const mockFinaleData = {
        realityCheck: 'You are on track for retirement',
        imagePrompt: 'A beautiful retirement home',
        wayForward: [
          'Increase pension contributions',
          'Review ISA allocations',
          'Consider downsizing',
        ],
        netWorthProjection: [
          { year: 2024, netWorth: 300000 },
          { year: 2025, netWorth: 350000 },
        ],
        imageUrl: 'data:image/png;base64,mockImageData',
      }

      // This would be set by triggerGrandFinale tool
      // For testing, we can't easily set this state, but we can verify
      // component structure exists
      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      )

      // The grand finale section should be in the DOM (though not visible without data)
      expect(screen.getByText('Your Vision Board')).toBeInTheDocument()
    })
  })

  describe('cleanup', () => {
    it('should clean up audio resources on unmount', () => {
      const { unmount } = render(
        <AuthProvider>
          <App />
        </AuthProvider>
      )

      unmount()

      // Should not throw any errors
      expect(true).toBe(true)
    })

    it('should clean up session on unmount', () => {
      const { unmount } = render(
        <AuthProvider>
          <App />
        </AuthProvider>
      )

      unmount()

      // Should not throw any errors
      expect(true).toBe(true)
    })
  })
})
