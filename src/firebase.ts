import {initializeApp} from 'firebase/app'
import {getAuth, GoogleAuthProvider} from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.FIREBASE_API_KEY,
  authDomain: import.meta.env.FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.FIREBASE_PROJECT_ID,
  appId: import.meta.env.FIREBASE_APP_ID
}

// Validate required Firebase configuration
if (!firebaseConfig.apiKey) {
  throw new Error('FIREBASE_API_KEY is not configured. Please add it to your environment variables.')
}
if (!firebaseConfig.authDomain) {
  throw new Error('FIREBASE_AUTH_DOMAIN is not configured. Please add it to your environment variables.')
}
if (!firebaseConfig.projectId) {
  throw new Error('FIREBASE_PROJECT_ID is not configured. Please add it to your environment variables.')
}
if (!firebaseConfig.appId) {
  throw new Error('FIREBASE_APP_ID is not configured. Please add it to your environment variables.')
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const provider = new GoogleAuthProvider()
