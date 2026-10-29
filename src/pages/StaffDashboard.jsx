import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AppHeader from '../components/AppHeader.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabase.js'
import { aed } from '../lib/format.js'
import { ORDER_STEPS, statusLabel } from '../lib/orderStatus.js'

// Local calendar-day key (YYYY-MM-DD) for grouping.
function dayKey(ts) {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function dayLabel(key) {
  const today = dayKey(Date.now())
  const yesterday = dayKey(Date.now() - 86400000)
  const formatted = new Date(key + 'T00:00:00').toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  if (key === today) return `Today — ${formatted}`
  if (key === yesterday) return `Yesterday — ${formatted}`
  return formatted
}

export default function StaffDashboard() {
  const { role } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState('')

  const fetchOrders = useCallback(async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('id, order_number, status, created_at, estimated_total, final_total, profiles!customer_id(full_name, phone), order_items(quantity)')
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    setOrders(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // Live: refresh the queue when any order changes or a new one is placed
  useEffect(() => {
    const channel = supabase
      .channel('staff-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders())
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchOrders])

  const counts = useMemo(() => {
    const c = { all: orders.length }
    for (const s of ORDER_STEPS) c[s.key] = 0
    for (const o of orders) c[o.status] = (c[o.status] ?? 0) + 1
    return c
  }, [orders])

  const visible = filter === 'all' ? orders : orders.filter((o) => o.status === filter)

  // Search across ALL orders by order number or phone (ignores the status tab).
  const searchResults = useMemo(() => {
    const q = submitted.trim().toLowerCase()
    if (!q) return null
    const qDigits = q.replace(/\D/g, '')
    return orders.filter((o) => {
      const num = (o.order_number || '').toLowerCase()
      const phone = (o.profiles?.phone || '').replace(/\D/g, '')
      if (num.includes(q)) return true
      if (qDigits.length >= 3 && phone.includes(qDigits)) return true
      return false
    })
  }, [submitted, orders])

  // Group the (status-filtered) orders into dated sections, newest day first.
  const groups = useMemo(() => {
    const map = new Map()
    for (const o of visible) {
      const k = dayKey(o.created_at)
      if (!map.has(k)) map.set(k, [])
      map.get(k).push(o)
    }
    return [...map.entries()]
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([key, list]) => ({ key, label: dayLabel(key), orders: list }))
  }, [visible])

  function runSearch(e) {
    e.preventDefault()
    setSubmitted(query.trim())
  }
  function clearSearch() {
    setQuery('')
    setSubmitted('')
  }

  const orderCard = (o) => {
    const itemCount = (o.order_items ?? []).reduce((s, it) => s + it.quantity, 0)
    const total = o.final_total != null ? o.final_total : o.estimated_total
    const isDelivered = o.status === 'delivered'
    return (
      <Link
        key={o.id}
        to={`/staff/order/${o.id}`}
        className="flex items-center justify-between gap-4 rounded-2xl border border-gold-soft/60 bg-white p-4 shadow-card transition hover:border-gold"
      >
        <div className="min-w-0">
          <p className="font-mono text-sm font-semibold text-gold-strong">{o.order_number}</p>
          <p className="truncate text-sm text-navy">{o.profiles?.full_name || 'Customer'}</p>
          <p className="text-xs text-ink/55">
            {o.profiles?.phone ? `${o.profiles.phone} · ` : ''}
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="hidden font-semibold text-navy sm:inline">{aed(total)}</span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              isDelivered ? 'bg-green-100 text-green-700' : 'bg-gold/20 text-gold-strong'
            }`}
          >
            {statusLabel(o.status)}
          </span>
        </div>
      </Link>
    )
  }

  return (
    <div className="marble-bg min-h-screen">
      <AppHeader badge={role === 'admin' ? 'Admin' : 'Staff'} />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold text-navy">Orders queue</h1>
            <p className="mt-1 text-ink/70">All customer orders. Open one to update its status.</p>
          </div>
          <Link
            to="/staff/team"
            className="rounded-xl border border-gold-soft bg-white px-4 py-2.5 text-sm font-semibold text-navy shadow-card transition hover:border-gold"
          >
            Staff access
          </Link>
        </div>

        {/* Search */}
        <form onSubmit={runSearch} className="mt-5 flex flex-wrap items-stretch gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search order # (e.g. LL00006) or phone number…"
            className="field-input min-w-[200px] flex-1"
            aria-label="Search orders"
          />
          <button type="submit" className="btn-gold px-6 py-2.5 text-sm">Search</button>
          {submitted && (
            <button
              type="button"
              onClick={clearSearch}
              className="rounded-xl border border-gold-soft bg-white px-4 text-sm font-semibold text-navy transition hover:border-gold"
            >
              Clear ✕
            </button>
          )}
        </form>

        {/* Status filter */}
        <div className="mt-4 flex flex-wrap gap-2">
          {['all', ...ORDER_STEPS.map((s) => s.key)].map((key) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                filter === key
                  ? 'border-gold bg-gold text-navy'
                  : 'border-gold-soft bg-white text-ink/70 hover:border-gold'
              }`}
            >
              {key === 'all' ? 'All' : statusLabel(key)}
              <span className="ml-1.5 text-xs opacity-70">{counts[key] ?? 0}</span>
            </button>
          ))}
        </div>

        {error && (
          <p className="mt-6 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        {loading ? (
          <p className="mt-10 text-center text-ink/50">Loading orders…</p>
        ) : submitted ? (
          // ---- Search results ----
          searchResults.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-gold-soft bg-white/70 p-10 text-center text-ink/60">
              No orders match “{submitted}”.
              <div>
                <button onClick={clearSearch} className="btn-gold mt-4">Back to all orders</button>
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              <p className="text-sm text-ink/55">
                {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'} for “{submitted}”
              </p>
              {searchResults.map(orderCard)}
            </div>
          )
        ) : visible.length === 0 ? (
          <p className="mt-10 rounded-2xl border border-dashed border-gold-soft bg-white/70 p-10 text-center text-ink/60">
            No orders {filter === 'all' ? 'yet' : `in “${statusLabel(filter)}”`}.
          </p>
        ) : (
          // ---- Grouped by date ----
          <div className="mt-6 space-y-7">
            {groups.map((g) => (
              <section key={g.key}>
                <h2 className="mb-3 flex items-baseline gap-2 border-b border-gold-soft/60 pb-1.5">
                  <span className="font-serif text-lg text-navy">{g.label}</span>
                  <span className="text-sm text-gold-strong">
                    · {g.orders.length} {g.orders.length === 1 ? 'order' : 'orders'}
                  </span>
                </h2>
                <div className="space-y-3">{g.orders.map(orderCard)}</div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
