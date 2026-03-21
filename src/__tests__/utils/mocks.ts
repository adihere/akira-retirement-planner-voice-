import { vi } from 'vitest'

/**
 * Mock Firebase Auth
 */
export const mockFirebaseAuth = {
  currentUser: null,
  onAuthStateChanged: vi.fn((callback) => {
    callback(null)
    return vi.fn()
  }),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
}

/**
 * Mock Firebase App
 */
export const mockFirebaseApp = {
  name: 'test-app',
  options: {},
  automaticDataCollectionEnabled: false,
}

/**
 * Mock Google Auth Provider
 */
export const mockGoogleAuthProvider = {
  providerId: 'google.com',
  addScope: vi.fn(),
  setCustomParameters: vi.fn(),
}

/**
 * Mock User object
 */
export const mockUser = {
  uid: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  emailVerified: true,
  isAnonymous: false,
  providerData: [],
  refreshToken: '',
  tenantId: null,
  metadata: {},
  phoneNumber: null,
  photoURL: null,
}

/**
 * Mock Web Audio API
 * Create a proper mock class that can be instantiated with 'new'
 */
class MockAudioContext {
  sampleRate: number
  state: string
  currentTime: number
  destination: any
  onstatechange: null

  constructor(options?: { sampleRate?: number }) {
    this.sampleRate = options?.sampleRate || 16000
    this.state = 'running'
    this.currentTime = 0
    this.destination = {}
    this.onstatechange = null
  }

  close = vi.fn().mockResolvedValue(undefined)
  resume = vi.fn().mockResolvedValue(undefined)
  suspend = vi.fn().mockResolvedValue(undefined)
  createMediaStreamSource = vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
  }))
  createScriptProcessor = vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    onaudioprocess: null,
  }))
  createBuffer = vi.fn()
  createBufferSource = vi.fn()
}

export const mockAudioContext = new MockAudioContext()

export const mockMediaStreamTrack = {
  stop: vi.fn(),
  enabled: true,
  id: 'track-1',
  kind: 'audio',
  label: 'Mock Audio Track',
  muted: false,
  readyState: 'live',
}

export const mockMediaStream = {
  getTracks: vi.fn(() => [mockMediaStreamTrack]),
  getAudioTracks: vi.fn(() => [mockMediaStreamTrack]),
  getVideoTracks: vi.fn(() => []),
  addTrack: vi.fn(),
  removeTrack: vi.fn(),
  clone: vi.fn(),
  active: true,
  id: 'stream-1',
}

export const mockMediaStreamAudioSourceNode = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  mediaStream: mockMediaStream,
}

export const mockScriptProcessorNode = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  onaudioprocess: null,
}

export const mockAudioBuffer = {
  duration: 0.256,
  length: 4096,
  numberOfChannels: 1,
  sampleRate: 16000,
  getChannelData: vi.fn(() => new Float32Array(4096)),
  copyFromChannel: vi.fn(),
  copyToChannel: vi.fn(),
}

export const mockAudioBufferSourceNode = {
  buffer: null,
  connect: vi.fn(),
  disconnect: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  onended: null,
}

/**
 * Mock getUserMedia
 */
export const mockGetUserMedia = vi.fn().mockResolvedValue(mockMediaStream)

/**
 * Mock navigator.mediaDevices
 */
export const mockMediaDevices = {
  getUserMedia: mockGetUserMedia,
  enumerateDevices: vi.fn().mockResolvedValue([]),
  getSupportedConstraints: vi.fn().mockReturnValue({}),
}

/**
 * Mock Google GenAI API
 */
export const mockGoogleGenAI = {
  models: {
    generateContent: vi.fn(),
  },
}

export const mockGenerateContentResponse = {
  response: {
    candidates: [
      {
        content: {
          parts: [
            {
              text: 'Sample response text',
            },
          ],
          role: 'model',
        },
        finishReason: 'STOP',
        index: 0,
        safetyRatings: [],
      },
    ],
    usageMetadata: {
      promptTokenCount: 10,
      candidatesTokenCount: 20,
      totalTokenCount: 30,
    },
  },
}

/**
 * Setup all mocks
 */
export function setupMocks() {
  // Mock Firebase
  vi.mock('firebase/app', () => ({
    initializeApp: vi.fn(() => mockFirebaseApp),
    getApps: vi.fn(() => [mockFirebaseApp]),
  }))

  vi.mock('firebase/auth', () => ({
    getAuth: vi.fn(() => mockFirebaseAuth),
    GoogleAuthProvider: vi.fn(() => mockGoogleAuthProvider),
    signInWithPopup: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChanged: vi.fn((auth, callback) => {
      callback(null)
      return vi.fn()
    }),
  }))

  // Mock Web Audio API
  global.AudioContext = MockAudioContext as any
  global.webkitAudioContext = MockAudioContext as any

  // Mock navigator.mediaDevices
  Object.defineProperty(navigator, 'mediaDevices', {
    writable: true,
    value: mockMediaDevices,
  })

  // Mock Google GenAI
  vi.mock('@google/genai', () => ({
    GoogleGenerativeAI: vi.fn(() => mockGoogleGenAI),
  }))
}

/**
 * Reset all mocks
 */
export function resetMocks() {
  vi.clearAllMocks()
  vi.resetAllMocks()
}

/**
 * Create a mock Firebase error
 */
export function createFirebaseError(code: string, message: string) {
  const error = new Error(message) as any
  error.code = code
  error.name = code
  return error
}

/**
 * Create a mock DOM element
 */
export function createMockElement(tagName: string, attributes: Record<string, any> = {}) {
  const element = document.createElement(tagName)
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value)
  })
  return element
}
