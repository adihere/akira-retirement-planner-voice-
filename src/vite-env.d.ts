/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly GEMINI_API_KEY: string
  readonly FIREBASE_API_KEY: string
  readonly FIREBASE_AUTH_DOMAIN: string
  readonly FIREBASE_PROJECT_ID: string
  readonly FIREBASE_APP_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
