import { initializeApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore/lite'
import { FirestoreRepository } from './firestoreRepository'
import { LocalRepository } from './localRepository'
import type { PortfolioRepository } from './repository'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
}

const app = Object.values(config).every(Boolean) ? initializeApp(config) : null

/** Firebase when configured via .env.local; otherwise this browser's localStorage. */
export const auth: Auth | null = app ? getAuth(app) : null

export const backendKind: 'firestore' | 'local' = app ? 'firestore' : 'local'

export function createRepository(): PortfolioRepository {
  if (!app) return new LocalRepository()
  const uid = auth?.currentUser?.uid
  if (!uid) throw new Error('Sign in before loading the portfolio')
  return new FirestoreRepository(getFirestore(app), uid)
}
