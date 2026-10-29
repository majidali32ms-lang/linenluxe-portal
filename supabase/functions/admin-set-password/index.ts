// LinenLuxe — secure admin password reset for staff accounts.
//
// Deployed as a Supabase Edge Function so the SERVICE ROLE key stays server-side
// (never in the browser). It:
//   1. Identifies the caller from their JWT.
//   2. Verifies the caller is staff/admin (using the service role to read profiles).
//   3. Sets a new password for the target user.
//   4. Best-effort signs the target out of existing sessions.
//
// SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are injected
// automatically by Supabase — no manual secrets needed.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const authHeader = req.headers.get('Authorization') ?? ''
  if (!authHeader) return json({ error: 'Not authenticated' }, 401)

  // 1) Who is calling?
  const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user }, error: userErr } = await callerClient.auth.getUser()
  if (userErr || !user) return json({ error: 'Not authenticated' }, 401)

  // Admin client (service role) — never exposed to the browser
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // 2) Is the caller staff/admin?
  const { data: prof } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (!prof || !['staff', 'admin'].includes(prof.role)) {
    return json({ error: 'Forbidden — staff/admin only' }, 403)
  }

  // 3) Validate input
  let body: { userId?: string; newPassword?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid request body' }, 400)
  }
  const { userId, newPassword } = body
  if (!userId || !newPassword || newPassword.length < 6) {
    return json({ error: 'userId and a newPassword of 6+ characters are required' }, 400)
  }

  // 4) Set the new password
  const { error: updErr } = await admin.auth.admin.updateUserById(userId, { password: newPassword })
  if (updErr) return json({ error: updErr.message }, 400)

  // 5) Best-effort: invalidate the target's existing sessions
  try {
    // @ts-ignore — available in recent gotrue-js
    await admin.auth.admin.signOut(userId, 'global')
  } catch (_) {
    /* non-fatal: the new password + role gate already lock them out */
  }

  return json({ ok: true })
})
