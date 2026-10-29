import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

// Guards a route. Optionally restricts by role(s).
// - Not signed in        -> /login
// - Signed in, wrong role -> sent to their own dashboard
export default function ProtectedRoute({ children, allow }) {
  const { session, role, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="marble-bg flex min-h-screen items-center justify-center">
        <p className="animate-pulse font-serif text-lg text-navy/60">Loading…</p>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (allow && role && !allow.includes(role)) {
    const home = role === 'customer' ? '/app' : '/staff'
    return <Navigate to={home} replace />
  }

  return children
}
