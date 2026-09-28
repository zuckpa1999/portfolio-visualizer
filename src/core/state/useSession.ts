import { useEffect, useState } from 'react'
import { supabase } from '../data/backend'

export type SessionStatus = 'checking' | 'signed-out' | 'signed-in'

/** Google sign-in via Supabase. In local mode there is nothing to sign in to. */
export function useSession() {
  const [status, setStatus] = useState<SessionStatus>(supabase ? 'checking' : 'signed-in')
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => {
      setStatus(data.session ? 'signed-in' : 'signed-out')
      setEmail(data.session?.user.email ?? null)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setStatus(session ? 'signed-in' : 'signed-out')
      setEmail(session?.user.email ?? null)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  return {
    status,
    email,
    canSignOut: supabase !== null,
    signIn: () =>
      supabase?.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } }),
    signOut: () => supabase?.auth.signOut(),
  }
}
