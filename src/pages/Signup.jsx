import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { isSupabaseConfigured } from '../lib/supabase.js'
import Logo from '../components/Logo.jsx'

export default function Signup() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [line1, setLine1] = useState('')
  const [line2, setLine2] = useState('')
  const [area, setArea] = useState('Al Furjan')
  const [city, setCity] = useState('Dubai')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setNotice('')
    if (!isSupabaseConfigured) {
      setError('App is not connected yet — add your Supabase keys to the .env file and restart.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (!line1.trim()) {
      setError('Please enter your pickup address (building / villa).')
      return
    }
    setBusy(true)
    const { data, error } = await signUp({
      email: email.trim(),
      password,
      fullName: fullName.trim(),
      phone: phone.trim(),
      address: {
        line1: line1.trim(),
        line2: line2.trim(),
        area: area.trim(),
        city: city.trim(),
      },
    })
    setBusy(false)
    if (error) {
      setError(error.message)
      return
    }
    // If email confirmation is ON, there is no active session yet.
    if (!data.session) {
      setNotice('Account created! Please check your email to confirm, then sign in.')
      return
    }
    navigate('/', { replace: true })
  }

  return (
    <div className="marble-bg flex min-h-screen items-center justify-center px-5 py-10">
      <div className="auth-card animate-fade-up">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo size={92} />
          <p className="mt-4 text-sm text-ink/70">Create your account to book a pickup.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="field-label" htmlFor="fullName">Full name</label>
            <input
              id="fullName" type="text" required autoComplete="name"
              className="field-input" placeholder="Your name"
              value={fullName} onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="phone">Phone</label>
            <input
              id="phone" type="tel" autoComplete="tel"
              className="field-input" placeholder="+971 5X XXX XXXX"
              value={phone} onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="email">Email</label>
            <input
              id="email" type="email" required autoComplete="email"
              className="field-input" placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="password">Password</label>
            <input
              id="password" type="password" required autoComplete="new-password"
              className="field-input" placeholder="At least 6 characters"
              value={password} onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Pickup address — saved as your default for faster checkout */}
          <div className="rounded-xl border border-gold-soft bg-cream/40 p-3.5">
            <p className="mb-2 text-sm font-semibold text-navy">Pickup address</p>
            <div className="space-y-3">
              <div>
                <label className="field-label" htmlFor="line1">Building / Villa *</label>
                <input
                  id="line1" type="text" required autoComplete="address-line1"
                  className="field-input" placeholder="e.g. Murano Residences, Tower B"
                  value={line1} onChange={(e) => setLine1(e.target.value)}
                />
              </div>
              <div>
                <label className="field-label" htmlFor="line2">Apartment / Floor / Unit</label>
                <input
                  id="line2" type="text" autoComplete="address-line2"
                  className="field-input" placeholder="e.g. Apt 1204"
                  value={line2} onChange={(e) => setLine2(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label" htmlFor="area">Area</label>
                  <input
                    id="area" type="text" className="field-input" placeholder="Al Furjan"
                    value={area} onChange={(e) => setArea(e.target.value)}
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="city">City</label>
                  <input
                    id="city" type="text" className="field-input" placeholder="Dubai"
                    value={city} onChange={(e) => setCity(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <p className="mt-2 text-xs text-ink/50">
              Saved as your default address — it'll be ready at checkout.
            </p>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
          {notice && (
            <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{notice}</p>
          )}

          <button type="submit" className="btn-gold w-full" disabled={busy}>
            {busy ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink/70">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-gold-strong hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
