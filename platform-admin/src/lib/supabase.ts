import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { isSupabaseConfigured } from '@/lib/env'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** null si .env absent — l’UI affiche un message au lieu de planter. */
export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null
