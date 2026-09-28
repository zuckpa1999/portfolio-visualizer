import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { LocalRepository } from './localRepository'
import type { PortfolioRepository } from './repository'
import { SupabaseRepository } from './supabaseRepository'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** Supabase when configured via .env.local; otherwise this browser's localStorage. */
export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null

export const backendKind: 'supabase' | 'local' = supabase ? 'supabase' : 'local'

export function createRepository(): PortfolioRepository {
  return supabase ? new SupabaseRepository(supabase) : new LocalRepository()
}
