import { Link } from 'react-router-dom'
import AppHeader from '../components/AppHeader.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function CustomerDashboard() {
  const { profile, user } = useAuth()
  const firstName = (profile?.full_name || user?.email || '').split(' ')[0] || 'there'

  return (
    <div className="marble-bg min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="animate-fade-up rounded-2xl border border-gold-soft/60 bg-white/90 p-8 shadow-card">
          <h1 className="text-3xl font-semibold text-navy">Welcome, {firstName} 👋</h1>
          <p className="mt-2 text-ink/70">
            Your LinenLuxe account is ready. Booking, live order tracking and history
            will appear here as we build them.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Live link — browse services */}
            <Link
              to="/app/services"
              className="group rounded-xl border border-gold bg-gold/10 p-5 transition hover:bg-gold/20 hover:shadow-card"
            >
              <p className="font-serif text-lg text-navy group-hover:text-gold-strong">
                Browse services
              </p>
              <p className="mt-1 text-xs uppercase tracking-wide text-gold-strong">Book a pickup →</p>
            </Link>

            {/* Live link — my orders & tracking */}
            <Link
              to="/app/orders"
              className="group rounded-xl border border-gold-soft bg-cream/40 p-5 transition hover:border-gold hover:shadow-card"
            >
              <p className="font-serif text-lg text-navy group-hover:text-gold-strong">
                My orders &amp; tracking
              </p>
              <p className="mt-1 text-xs uppercase tracking-wide text-gold-strong">Track live →</p>
            </Link>

            {/* Live link — profile & addresses */}
            <Link
              to="/app/profile"
              className="group rounded-xl border border-gold-soft bg-cream/40 p-5 transition hover:border-gold hover:shadow-card"
            >
              <p className="font-serif text-lg text-navy group-hover:text-gold-strong">
                Profile &amp; addresses
              </p>
              <p className="mt-1 text-xs uppercase tracking-wide text-gold-strong">Manage now →</p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
