import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { isSupabaseConfigured } from '../lib/supabase.js'
import Logo from '../components/Logo.jsx'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!isSupabaseConfigured) {
      setError('App is not connected yet — add your Supabase keys to the .env file and restart.')
      return
    }
    setBusy(true)
    const { error } = await signIn({ email: email.trim(), password })
    setBusy(false)
    if (error) {
      setError(error.message)
      return
    }
    navigate('/', { replace: true })
  }

  return (
    <div className="marble-bg flex min-h-screen items-center justify-center px-5 py-10">
      <div className="auth-card animate-fade-up">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo size={92} />
          <p className="mt-4 text-sm text-ink/70">Welcome back — sign in to your account.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              id="password" type="password" required autoComplete="current-password"
              className="field-input" placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <button type="submit" className="btn-gold w-full" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink/70">
          New to LinenLuxe?{' '}
          <Link to="/signup" className="font-semibold text-gold-strong hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}
