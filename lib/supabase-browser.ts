'use client'

import { createClient } from '@supabase/supabase-js'

// ── Browser-side Supabase client (uses anon key) ───────────────────────────
// Safe to use in client components. Only has access to public read data
// based on our RLS policies.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Singleton — avoids creating multiple clients during hot reload
let client: ReturnType<typeof createClient> | null = null

export function getSupabaseBrowser() {
  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    })
  }
  return client
}
