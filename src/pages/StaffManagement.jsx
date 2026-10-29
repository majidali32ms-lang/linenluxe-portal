import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AppHeader from '../components/AppHeader.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabase.js'

export default function StaffManagement() {
  const { user, profile } = useAuth()
  const isAdmin = profile?.role === 'admin' // only admins can revoke / change passwords
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [pwFor, setPwFor] = useState(null) // id of the row whose password form is open
  const [newPw, setNewPw] = useState('')

  const fetchStaff = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .in('role', ['staff', 'admin'])
      .order('role', { ascending: true })
      .order('full_name', { ascending: true })
    if (error) setError(error.message)
    setStaff(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchStaff()
  }, [fetchStaff])

  async function revoke(s) {
    if (s.id === user.id) return
    const who = s.full_name || s.email
    if (
      !window.confirm(
        `Remove staff access for ${who}?\n\nThey will be demoted to a customer and immediately lose access to the staff dashboard.`,
      )
    )
      return
    setBusyId(s.id)
    setError('')
    setMsg('')
    const { error } = await supabase.from('profiles').update({ role: 'customer' }).eq('id', s.id)
    setBusyId(null)
    if (error) return setError(error.message)
    setMsg(`${who} no longer has staff access.`)
    fetchStaff()
  }

  async function changePassword(s) {
    const who = s.full_name || s.email
    if (newPw.length < 6) {
      setError('New password must be at least 6 characters.')
      return
    }
    if (!window.confirm(`Set a new password for ${who}?\n\nTheir current password will stop working.`)) return
    setBusyId(s.id)
    setError('')
    setMsg('')
    const { data, error } = await supabase.functions.invoke('admin-set-password', {
      body: { userId: s.id, newPassword: newPw },
    })
    setBusyId(null)
    if (error) {
      setError(
        'Password change failed. Make sure the "admin-set-password" Edge Function is deployed (see setup). Details: ' +
          (error.message || 'function not reachable'),
      )
      return
    }
    if (data?.error) {
      setError(data.error)
      return
    }
    setPwFor(null)
    setNewPw('')
    setMsg(`Password updated for ${who}. Their old password no longer works.`)
  }

  return (
    <div className="marble-bg min-h-screen">
      <AppHeader badge={profile?.role === 'admin' ? 'Admin' : 'Staff'} />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Link to="/staff" className="text-sm font-medium text-gold-strong hover:underline">
          ← Orders queue
        </Link>
        <h1 className="mt-3 text-3xl font-semibold text-navy">Staff access management</h1>
        <p className="mt-1 text-ink/70">
          {isAdmin
            ? 'Manage who can access the staff dashboard. When someone leaves, revoke their access (and optionally reset their password).'
            : 'These accounts can access the staff dashboard.'}
        </p>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
        {msg && (
          <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{msg}</p>
        )}

        {loading ? (
          <p className="mt-10 text-center text-ink/50">Loading staff…</p>
        ) : staff.length === 0 ? (
          <p className="mt-10 text-center text-ink/60">No staff accounts found.</p>
        ) : (
          <div className="mt-6 space-y-3">
            {staff.map((s) => {
              const isSelf = s.id === user.id
              const who = s.full_name || '(no name)'
              return (
                <div
                  key={s.id}
                  className="rounded-2xl border border-gold-soft/60 bg-white p-4 shadow-card"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-serif text-lg text-navy">{who}</span>
                        <span className="rounded-full bg-navy px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold-soft">
                          {s.role}
                        </span>
                        {isSelf && (
                          <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold-strong">
                            You
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-sm text-ink/70">{s.email}</p>
                    </div>

                    {!isSelf && isAdmin && (
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <button
                          onClick={() => {
                            setPwFor(pwFor === s.id ? null : s.id)
                            setNewPw('')
                            setError('')
                          }}
                          disabled={busyId === s.id}
                          className="rounded-full border border-gold-soft px-3.5 py-1.5 text-xs font-semibold text-navy transition hover:border-gold"
                        >
                          Change password
                        </button>
                        <button
                          onClick={() => revoke(s)}
                          disabled={busyId === s.id}
                          className="rounded-full border border-red-200 bg-red-50 px-3.5 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                        >
                          {busyId === s.id ? 'Working…' : 'Remove access'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Inline change-password form */}
                  {isAdmin && pwFor === s.id && (
                    <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-gold-soft/50 pt-3">
                      <div className="flex-1">
                        <label className="field-label" htmlFor={`pw-${s.id}`}>New password</label>
                        <input
                          id={`pw-${s.id}`}
                          type="text"
                          className="field-input"
                          placeholder="At least 6 characters"
                          value={newPw}
                          onChange={(e) => setNewPw(e.target.value)}
                        />
                      </div>
                      <button
                        onClick={() => changePassword(s)}
                        disabled={busyId === s.id}
                        className="btn-gold py-2.5 text-sm"
                      >
                        {busyId === s.id ? 'Saving…' : 'Set password'}
                      </button>
                      <button
                        onClick={() => { setPwFor(null); setNewPw('') }}
                        className="rounded-xl px-3 py-2.5 text-sm text-ink/60 hover:text-navy"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {isSelf && isAdmin && (
                    <p className="mt-2 text-xs text-ink/45">You can't remove or reset your own account here.</p>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <p className="mt-6 text-xs text-ink/50">
          {isAdmin
            ? 'Revoking demotes the account to a customer — they lose the staff dashboard on their next page load. Changing the password stops their old password from working. Together this locks a departing employee out.'
            : 'View only — only an admin/owner can remove access or change passwords.'}
        </p>
      </main>
    </div>
  )
}
