export function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
  return Boolean(url?.startsWith('http') && key && key.length > 20)
}

export function getConfigError(): string | null {
  if (!isSupabaseConfigured()) {
    return 'Configuration incomplète. Contactez l’administrateur du site.'
  }
  return null
}
