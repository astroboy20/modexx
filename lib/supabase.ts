import { createClient } from '@supabase/supabase-js'

// ── Server-side Supabase client (uses service role key) ────────────────────
// Only use this in API routes and server components — never expose to browser.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Missing Supabase environment variables.\n' +
    'Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your .env.local'
  )
}

// Service role client — bypasses RLS, used only server-side
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
})

export type { SupabaseClient } from '@supabase/supabase-js'
