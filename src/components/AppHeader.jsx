import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import Logo from './Logo.jsx'

export default function AppHeader({ badge }) {
  const { profile, user, role, signOut } = useAuth()
  const { count } = useCart()
  const name = profile?.full_name || user?.email || 'Guest'
  const home = role === 'staff' || role === 'admin' ? '/staff' : '/app'
  const isCustomer = role === 'customer'

  return (
    <header className="sticky top-0 z-10 border-b border-gold-soft/50 bg-white">
      <div className="h-1 w-full bg-gold-gradient" />
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2.5">
        <Link to={home} className="flex items-center gap-2">
          <Logo size={42} />
          {badge && (
            <span className="rounded-full bg-navy px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold-soft">
              {badge}
            </span>
          )}
        </Link>

        <div className="flex items-center gap-4">
          {isCustomer && (
            <>
              <Link to="/app/services" className="hidden text-sm font-medium text-navy hover:text-gold-strong sm:inline">
                Services
              </Link>
              <Link to="/app/orders" className="hidden text-sm font-medium text-navy hover:text-gold-strong sm:inline">
                Orders
              </Link>
              <Link to="/app/profile" className="hidden text-sm font-medium text-navy hover:text-gold-strong sm:inline">
                Profile
              </Link>
              <Link
                to="/app/cart"
                className="relative text-navy hover:text-gold-strong"
                aria-label="Cart"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                {count > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-navy">
                    {count}
                  </span>
                )}
              </Link>
            </>
          )}
          <span className="hidden text-sm text-ink/70 sm:inline">{name}</span>
          <button onClick={signOut} className="btn-navy px-4 py-2 text-sm">
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}
