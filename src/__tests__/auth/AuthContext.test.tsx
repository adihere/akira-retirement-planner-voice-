import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '../../auth/AuthContext'
import { createMockUser } from '../utils/test-helpers'
import { vi } from 'vitest'

// Create a mock auth object that can be controlled in tests
let mockAuthState = null
let mockOnAuthStateChangedCallback: ((user: any) => void) | null = null
let mockOnAuthStateChangedUnsubscribe = vi.fn()

// Mock Firebase
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({
    currentUser: null,
    onAuthStateChanged: vi.fn((callback: (user: any) => void) => {
      mockOnAuthStateChangedCallback = callback
      // Call asynchronously to allow initial loading state to be verified
      queueMicrotask(() => callback(mockAuthState))
      return mockOnAuthStateChangedUnsubscribe
    }),
  })),
  GoogleAuthProvider: vi.fn(() => ({})),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
}))

vi.mock('../../firebase', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: vi.fn((callback: (user: any) => void) => {
      mockOnAuthStateChangedCallback = callback
      // Call asynchronously to allow initial loading state to be verified
      queueMicrotask(() => callback(mockAuthState))
      return mockOnAuthStateChangedUnsubscribe
    }),
  },
  provider: {},
}))

describe('AuthProvider', () => {
  beforeEach(() => {
    // Reset mock state before each test
    mockAuthState = null
    mockOnAuthStateChangedCallback = null
    mockOnAuthStateChangedUnsubscribe = vi.fn()

    // Get the hoisted mocks and clear them
    const { auth } = vi.importMock('../../firebase') as any
    if (auth) {
      auth.currentUser = null
      auth.onAuthStateChanged.mockClear()
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should render children without errors', () => {
      render(
        <AuthProvider>
          <div>Test Child</div>
        </AuthProvider>
      )

      expect(screen.getByText('Test Child')).toBeInTheDocument()
    })

    it('should initialize with loading state true', () => {
      let authValue: any
      const TestComponent = () => {
        authValue = useAuth()
        return <div>Auth Test</div>
      }

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      expect(authValue.loading).toBe(true)
    })

    it('should initialize with null user', () => {
      let authValue: any
      const TestComponent = () => {
        authValue = useAuth()
        return <div>Auth Test</div>
      }

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      expect(authValue.user).toBeNull()
    })
  })

  describe('auth state changes', () => {
    it('should update user when auth state changes to logged in', async () => {
      const mockUser = createMockUser()

      let authValue: any
      const TestComponent = () => {
        authValue = useAuth()
        return <div>Auth Test</div>
      }

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(authValue.loading).toBe(false)
      })

      // Simulate user logging in by calling the callback
      if (mockOnAuthStateChangedCallback) {
        mockOnAuthStateChangedCallback(mockUser)
      }

      // Wait for state update
      await waitFor(() => {
        expect(authValue.user).toEqual(mockUser)
      })
    })

    it('should update user when auth state changes to logged out', async () => {
      const mockUser = createMockUser()
      // Set initial state to logged in
      mockAuthState = mockUser

      let authValue: any
      const TestComponent = () => {
        authValue = useAuth()
        return <div>Auth Test</div>
      }

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(authValue.loading).toBe(false)
      })

      expect(authValue.user).toEqual(mockUser)

      // Simulate user logging out
      if (mockOnAuthStateChangedCallback) {
        mockOnAuthStateChangedCallback(null)
      }

      // Wait for state update
      await waitFor(() => {
        expect(authValue.user).toBeNull()
      })
    })

    it('should set loading to false after auth state is determined', async () => {
      let authValue: any
      const TestComponent = () => {
        authValue = useAuth()
        return <div>Auth Test</div>
      }

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(authValue.loading).toBe(false)
      })
    })
  })

  describe('cleanup', () => {
    it('should unsubscribe from auth state changes on unmount', () => {
      const { unmount } = render(
        <AuthProvider>
          <div>Test Child</div>
        </AuthProvider>
      )

      unmount()

      expect(mockOnAuthStateChangedUnsubscribe).toHaveBeenCalled()
    })
  })
})

describe('useAuth', () => {
  it('should throw error when used outside AuthProvider', () => {
    const TestComponent = () => {
      useAuth()
      return <div>Test</div>
    }

    expect(() => {
      render(<TestComponent />)
    }).toThrow('useAuth must be used within an AuthProvider')
  })

  it('should return auth context when used within AuthProvider', () => {
    let authValue: any
    const TestComponent = () => {
      authValue = useAuth()
      return <div>Test</div>
    }

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(authValue).toBeDefined()
    expect(authValue.user).toBeDefined()
    expect(authValue.loading).toBeDefined()
    expect(authValue.signInWithGoogle).toBeDefined()
    expect(authValue.signOut).toBeDefined()
  })
})

describe('signInWithGoogle', () => {
  it('should call signInWithPopup with auth and provider', async () => {
    const mockUser = createMockUser()
    const { signInWithPopup } = await import('firebase/auth')
    const mockSignInWithPopup = vi.fn().mockResolvedValue({ user: mockUser })
    vi.mocked(signInWithPopup).mockImplementation(mockSignInWithPopup)

    let authValue: any
    const TestComponent = () => {
      authValue = useAuth()
      return <div>Test</div>
    }

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(authValue.loading).toBe(false)
    })

    await authValue.signInWithGoogle()

    expect(mockSignInWithPopup).toHaveBeenCalled()
  })

  it('should throw error when signInWithPopup fails', async () => {
    const mockError = new Error('Sign in failed')
    const { signInWithPopup } = await import('firebase/auth')
    const mockSignInWithPopup = vi.fn().mockRejectedValue(mockError)
    vi.mocked(signInWithPopup).mockImplementation(mockSignInWithPopup)

    let authValue: any
    const TestComponent = () => {
      authValue = useAuth()
      return <div>Test</div>
    }

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(authValue.loading).toBe(false)
    })

    await expect(authValue.signInWithGoogle()).rejects.toThrow('Sign in failed')
  })
})

describe('signOut', () => {
  it('should call Firebase signOut', async () => {
    const { signOut } = await import('firebase/auth')
    const mockSignOut = vi.fn().mockResolvedValue(undefined)
    vi.mocked(signOut).mockImplementation(mockSignOut)

    let authValue: any
    const TestComponent = () => {
      authValue = useAuth()
      return <div>Test</div>
    }

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(authValue.loading).toBe(false)
    })

    await authValue.signOut()

    expect(mockSignOut).toHaveBeenCalled()
  })

  it('should throw error when signOut fails', async () => {
    const mockError = new Error('Sign out failed')
    const { signOut } = await import('firebase/auth')
    const mockSignOut = vi.fn().mockRejectedValue(mockError)
    vi.mocked(signOut).mockImplementation(mockSignOut)

    let authValue: any
    const TestComponent = () => {
      authValue = useAuth()
      return <div>Test</div>
    }

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(authValue.loading).toBe(false)
    })

    await expect(authValue.signOut()).rejects.toThrow('Sign out failed')
  })
})
