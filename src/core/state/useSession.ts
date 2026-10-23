import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { useEffect, useState } from 'react'
import { auth } from '../data/backend'

export type SessionStatus = 'checking' | 'signed-out' | 'signed-in'

/** Google sign-in via Firebase Auth. In local mode there is nothing to sign in to. */
export function useSession() {
  const [status, setStatus] = useState<SessionStatus>(auth ? 'checking' : 'signed-in')
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    if (!auth) return
    // Fires once with the restored session (or null), then on every sign-in and sign-out.
    return onAuthStateChanged(auth, (user) => {
      setStatus(user ? 'signed-in' : 'signed-out')
      setEmail(user?.email ?? null)
    })
  }, [])

  return {
    status,
    email,
    canSignOut: auth !== null,
    // A popup rather than a redirect: Safari blocks the redirect flow unless the app is served from the auth domain.
    signIn: () => (auth ? signInWithPopup(auth, new GoogleAuthProvider()) : undefined),
    signOut: () => (auth ? signOut(auth) : undefined),
  }
}
