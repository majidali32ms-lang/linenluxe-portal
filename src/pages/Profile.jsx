import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AppHeader from '../components/AppHeader.jsx'
import AddressForm from '../components/AddressForm.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabase.js'

function formatAddress(a) {
  return [a.line2, a.line1, a.area, a.city].filter(Boolean).join(', ')
}

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth()

  // ---- Profile form ----
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState('')

  useEffect(() => {
    setFullName(profile?.full_name ?? '')
    setPhone(profile?.phone ?? '')
  }, [profile])

  async function saveProfile(e) {
    e.preventDefault()
    setProfileMsg('')
    setSavingProfile(true)
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim(), phone: phone.trim() })
      .eq('id', user.id)
    setSavingProfile(false)
    if (error) {
      setProfileMsg('Error: ' + error.message)
      return
    }
    await refreshProfile()
    setProfileMsg('Profile saved.')
  }

  // ---- Addresses ----
  const [addresses, setAddresses] = useState([])
  const [loadingAddr, setLoadingAddr] = useState(true)
  const [editing, setEditing] = useState(null) // 'new' | address object | null
  const [savingAddr, setSavingAddr] = useState(false)
  const [addrError, setAddrError] = useState('')

  const fetchAddresses = useCallback(async () => {
    setLoadingAddr(true)
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true })
    if (error) setAddrError(error.message)
    setAddresses(data ?? [])
    setLoadingAddr(false)
  }, [])

  useEffect(() => {
    fetchAddresses()
  }, [fetchAddresses])

  async function saveAddress(values) {
    setSavingAddr(true)
    setAddrError('')
    let savedId = editing?.id

    if (editing === 'new') {
      const { data, error } = await supabase
        .from('addresses')
        .insert({ ...values, user_id: user.id })
        .select('id')
        .single()
      if (error) { setAddrError(error.message); setSavingAddr(false); return }
      savedId = data.id
    } else {
      const { error } = await supabase.from('addresses').update(values).eq('id', editing.id)
      if (error) { setAddrError(error.message); setSavingAddr(false); return }
    }

    // Keep a single default: if this one is default, clear the flag on the others.
    if (values.is_default && savedId) {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .neq('id', savedId)
    }

    setSavingAddr(false)
    setEditing(null)
    fetchAddresses()
  }

  async function deleteAddress(id) {
    if (!window.confirm('Delete this address?')) return
    const { error } = await supabase.from('addresses').delete().eq('id', id)
    if (error) { setAddrError(error.message); return }
    fetchAddresses()
  }

  async function makeDefault(id) {
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id)
    await supabase.from('addresses').update({ is_default: true }).eq('id', id)
    fetchAddresses()
  }

  return (
    <div className="marble-bg min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Link to="/app" className="text-sm font-medium text-gold-strong hover:underline">
          ← Back to dashboard
        </Link>

        {/* Profile card */}
        <section className="animate-fade-up mt-4 rounded-2xl border border-gold-soft/60 bg-white/90 p-7 shadow-card">
          <h1 className="text-2xl font-semibold text-navy">My profile</h1>
          <form onSubmit={saveProfile} className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="fullName">Full name</label>
              <input
                id="fullName" className="field-input" value={fullName}
                onChange={(e) => setFullName(e.target.value)} placeholder="Your name"
              />
            </div>
            <div>
              <label className="field-label" htmlFor="phone">Phone</label>
              <input
                id="phone" className="field-input" value={phone}
                onChange={(e) => setPhone(e.target.value)} placeholder="+971 5X XXX XXXX"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="field-label" htmlFor="email">Email</label>
              <input
                id="email" className="field-input bg-cream/60 text-ink/60"
                value={user?.email ?? ''} disabled
              />
              <p className="mt-1 text-xs text-ink/50">Email can't be changed here.</p>
            </div>
            <div className="sm:col-span-2 flex items-center gap-4">
              <button type="submit" className="btn-gold" disabled={savingProfile}>
                {savingProfile ? 'Saving…' : 'Save profile'}
              </button>
              {profileMsg && (
                <span className={`text-sm ${profileMsg.startsWith('Error') ? 'text-red-700' : 'text-green-700'}`}>
                  {profileMsg}
                </span>
              )}
            </div>
          </form>
        </section>

        {/* Addresses card */}
        <section className="animate-fade-up mt-6 rounded-2xl border border-gold-soft/60 bg-white/90 p-7 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-navy">Saved addresses</h2>
            {editing === null && (
              <button onClick={() => setEditing('new')} className="btn-gold px-4 py-2 text-sm">
                + Add address
              </button>
            )}
          </div>

          {addrError && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{addrError}</p>
          )}

          {/* Add / edit form */}
          {editing !== null && (
            <div className="mt-5">
              <AddressForm
                initial={editing === 'new' ? null : editing}
                onSave={saveAddress}
                onCancel={() => setEditing(null)}
                saving={savingAddr}
              />
            </div>
          )}

          {/* List */}
          <div className="mt-5 space-y-3">
            {loadingAddr ? (
              <p className="text-ink/50">Loading addresses…</p>
            ) : addresses.length === 0 && editing === null ? (
              <p className="rounded-xl border border-dashed border-gold-soft bg-cream/40 p-6 text-center text-ink/60">
                No saved addresses yet. Add your first pickup address.
              </p>
            ) : (
              addresses.map((a) => (
                <div
                  key={a.id}
                  className="flex items-start justify-between gap-4 rounded-xl border border-gold-soft/70 bg-white p-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-serif text-lg text-navy">{a.label}</span>
                      {a.is_default && (
                        <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-gold-strong">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-ink/70">{formatAddress(a)}</p>
                    {a.notes && <p className="mt-1 text-xs text-ink/50">Note: {a.notes}</p>}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2 text-sm">
                    {!a.is_default && (
                      <button onClick={() => makeDefault(a.id)} className="text-gold-strong hover:underline">
                        Make default
                      </button>
                    )}
                    <button onClick={() => setEditing(a)} className="text-navy hover:underline">
                      Edit
                    </button>
                    <button onClick={() => deleteAddress(a.id)} className="text-red-600 hover:underline">
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
