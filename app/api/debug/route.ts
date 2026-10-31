// ── DEV-ONLY debug endpoint — remove before production ─────────────────────
// Visit /api/debug to check your Supabase connection and table existence

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production.' }, { status: 403 })
  }

  const results: Record<string, unknown> = {}

  // 1. Check env vars are present (don't expose values)
  results.env = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  }

  // 2. Test players table exists and is readable
  try {
    const { data, error, count } = await supabaseAdmin
      .from('players')
      .select('id', { count: 'exact', head: true })

    results.players_table = error
      ? { ok: false, error: error.message, code: error.code, hint: error.hint }
      : { ok: true, row_count: count }
  } catch (e) {
    results.players_table = { ok: false, exception: String(e) }
  }

  // 3. Test leaderboard_entries table
  try {
    const { data, error, count } = await supabaseAdmin
      .from('leaderboard_entries')
      .select('id', { count: 'exact', head: true })

    results.leaderboard_entries_table = error
      ? { ok: false, error: error.message, code: error.code, hint: error.hint }
      : { ok: true, row_count: count }
  } catch (e) {
    results.leaderboard_entries_table = { ok: false, exception: String(e) }
  }

  // 4. Test insert permission on players
  try {
    const testName = `__debug_test_${Date.now()}`
    const { data, error } = await supabaseAdmin
      .from('players')
      .insert({ display_name: testName, display_name_key: testName.toLowerCase() })
      .select('id')
      .single()

    if (error) {
      results.insert_test = { ok: false, error: error.message, code: error.code, hint: error.hint }
    } else {
      // Clean up the test row
      await supabaseAdmin.from('players').delete().eq('id', data.id)
      results.insert_test = { ok: true, message: 'Insert and delete succeeded' }
    }
  } catch (e) {
    results.insert_test = { ok: false, exception: String(e) }
  }

  return NextResponse.json(results, { status: 200 })
}
