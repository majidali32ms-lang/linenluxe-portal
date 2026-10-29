import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AppHeader from '../components/AppHeader.jsx'
import { supabase } from '../lib/supabase.js'
import { aed } from '../lib/format.js'
import { statusLabel } from '../lib/orderStatus.js'

function formatDate(ts) {
  return new Date(ts).toLocaleDateString('en-AE', { dateStyle: 'medium' })
}

export default function OrderHistory() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    ;(async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, status, created_at, estimated_total, final_total, order_items(quantity)')
        .order('created_at', { ascending: false })
      if (!active) return
      if (error) setError(error.message)
      setOrders(data ?? [])
      setLoading(false)
    })()
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="marble-bg min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <Link to="/app" className="text-sm font-medium text-gold-strong hover:underline">
          ← Back to dashboard
        </Link>
        <h1 className="mt-3 text-3xl font-semibold text-navy">My orders</h1>

        {error && (
          <p className="mt-6 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        {loading ? (
          <p className="mt-10 text-center text-ink/50">Loading orders…</p>
        ) : orders.length === 0 ? (
          <div className="animate-fade-up mt-6 rounded-2xl border border-dashed border-gold-soft bg-white/80 p-10 text-center">
            <p className="text-ink/60">You haven't placed any orders yet.</p>
            <Link to="/app/services" className="btn-gold mt-5">Browse services</Link>
          </div>
        ) : (
          <div className="animate-fade-up mt-6 space-y-3">
            {orders.map((o) => {
              const itemCount = (o.order_items ?? []).reduce((s, it) => s + it.quantity, 0)
              const total = o.final_total != null ? o.final_total : o.estimated_total
              return (
                <Link
                  key={o.id}
                  to={`/app/order/${o.id}`}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-gold-soft/60 bg-white p-4 shadow-card transition hover:border-gold"
                >
                  <div>
                    <p className="font-mono text-sm font-semibold text-gold-strong">{o.order_number}</p>
                    <p className="text-sm text-ink/70">
                      {formatDate(o.created_at)} · {itemCount} {itemCount === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="hidden font-semibold text-navy sm:inline">{aed(total)}</span>
                    <span className="rounded-full bg-gold/20 px-3 py-1 text-xs font-semibold text-gold-strong">
                      {statusLabel(o.status)}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
