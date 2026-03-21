import { render, RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'
import { AuthProvider } from '../../auth/AuthContext'
import { vi } from 'vitest'

/**
 * Custom render function that includes providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <AuthProvider>{children}</AuthProvider>
  }

  return render(ui, { wrapper: Wrapper, ...options })
}

/**
 * Wait for a condition to be true
 */
export async function waitForCondition(
  condition: () => boolean,
  timeout = 5000,
  interval = 100
): Promise<void> {
  const startTime = Date.now()
  while (Date.now() - startTime < timeout) {
    if (condition()) {
      return
    }
    await new Promise(resolve => setTimeout(resolve, interval))
  }
  throw new Error(`Condition not met within ${timeout}ms`)
}

/**
 * Create a mock user object
 */
export function createMockUser(overrides = {}) {
  return {
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
    ...overrides,
  }
}

/**
 * Create a mock audio context
 */
export function createMockAudioContext(options?: { sampleRate?: number }) {
  return {
    sampleRate: options?.sampleRate || 16000,
    state: 'running',
    close: vi.fn().mockResolvedValue(undefined),
    resume: vi.fn().mockResolvedValue(undefined),
    suspend: vi.fn().mockResolvedValue(undefined),
    createMediaStreamSource: vi.fn(),
    createScriptProcessor: vi.fn(),
    createBuffer: vi.fn(),
    createBufferSource: vi.fn(),
    currentTime: 0,
    destination: {},
  }
}

/**
 * Create a mock media stream
 */
export function createMockMediaStream() {
  return {
    getTracks: vi.fn(() => [
      {
        stop: vi.fn(),
        enabled: true,
        id: 'track-1',
        kind: 'audio',
        label: 'Mock Audio Track',
        muted: false,
        readyState: 'live',
      },
    ]),
    getAudioTracks: vi.fn(() => []),
    getVideoTracks: vi.fn(() => []),
    addTrack: vi.fn(),
    removeTrack: vi.fn(),
    clone: vi.fn(),
    active: true,
    id: 'stream-1',
  }
}

/**
 * Convert PCM16 data to base64
 */
export function pcm16ToBase64(pcm16Data: Int16Array): string {
  const buffer = new ArrayBuffer(pcm16Data.length * 2)
  const view = new DataView(buffer)
  pcm16Data.forEach((value, i) => {
    view.setInt16(i * 2, value, true)
  })
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/**
 * Create sample PCM16 audio data
 */
export function createSamplePCM16(length: number = 4096): Int16Array {
  const data = new Int16Array(length)
  for (let i = 0; i < length; i++) {
    // Create a simple sine wave pattern
    data[i] = Math.floor(Math.sin(i * 0.01) * 10000)
  }
  return data
}
