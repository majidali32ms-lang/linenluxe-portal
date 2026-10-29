import { createClient } from '@supabase/supabase-js'

const url = import.meta.env?.VITE_SUPABASE_URL
// New Supabase key format (sb_publishable_...). Falls back to the legacy anon
// key name so older .env files keep working. Both are safe for the browser and
// are protected by our Row Level Security policies.
const publishableKey =
  import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env?.VITE_SUPABASE_ANON_KEY

// Helps you catch a missing/incomplete .env file early with a clear message.
export const isSupabaseConfigured = Boolean(url && publishableKey)

if (!isSupabaseConfigured) {
  // eslint-disable-next-line no-console
  console.warn(
    '[LinenLuxe] Supabase env vars are missing. Create a ".env" file from ".env.example" and restart `npm run dev`.',
  )
}

export const supabase = createClient(url ?? 'http://localhost', publishableKey ?? 'public-key', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})
