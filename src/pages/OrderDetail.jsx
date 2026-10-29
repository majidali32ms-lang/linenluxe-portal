import { useCallback, useEffect, useState } from 'react'
import { Link, useParams, useLocation } from 'react-router-dom'
import AppHeader from '../components/AppHeader.jsx'
import OrderTimeline from '../components/OrderTimeline.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabase.js'
import { aed } from '../lib/format.js'
import { formatAddress } from '../lib/address.js'
import { statusLabel } from '../lib/orderStatus.js'
import { getVatEnabled } from '../lib/settings.js'

export default function OrderDetail() {
  const { id } = useParams()
  const { profile, user } = useAuth()
  const location = useLocation()
  const justPlaced = location.state?.justPlaced
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [live, setLive] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [vat, setVat] = useState(false)

  useEffect(() => {
    getVatEnabled().then(setVat)
  }, [])

  async function downloadInvoice() {
    setDownloading(true)
    try {
      const { generateInvoice } = await import('../lib/invoice.js')
      await generateInvoice({
        order,
        customerName: profile?.full_name || user?.email,
        customerPhone: profile?.phone,
      })
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[LinenLuxe] invoice error:', e)
    }
    setDownloading(false)
  }

  const fetchOrder = useCallback(async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*), addresses(*), order_status_history(*)')
      .eq('id', id)
      .single()
    if (error) setError(error.message)
    setOrder(data ?? null)
    setLoading(false)
  }, [id])

  useEffect(() => {
    fetchOrder()
  }, [fetchOrder])

  // Realtime: refetch when this order or its history changes (e.g. staff advances status)
  useEffect(() => {
    const channel = supabase
      .channel(`order-${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` },
        () => fetchOrder(),
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'order_status_history', filter: `order_id=eq.${id}` },
        () => fetchOrder(),
      )
      .subscribe((status) => setLive(status === 'SUBSCRIBED'))

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id, fetchOrder])

  const history = (order?.order_status_history ?? [])
    .slice()
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))

  return (
    <div className="marble-bg min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <Link to="/app/orders" className="text-sm font-medium text-gold-strong hover:underline">
          ← My orders
        </Link>

        {loading ? (
          <p className="mt-6 text-center text-ink/50">Loading order…</p>
        ) : error || !order ? (
          <div className="mt-6 rounded-2xl border border-gold-soft/60 bg-white/90 p-8 text-center shadow-card">
            <p className="text-red-700">{error || 'Order not found.'}</p>
            <Link to="/app" className="btn-gold mt-5">Back to dashboard</Link>
          </div>
        ) : (
          <>
            {justPlaced && (
              <div className="animate-fade-up mt-4 flex items-center gap-3 rounded-2xl border border-gold-soft/60 bg-white/90 p-5 shadow-card">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold/20">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#b8902f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
                <div>
                  <p className="font-serif text-lg text-navy">Booking confirmed!</p>
                  <p className="text-sm text-ink/70">We've received your pickup request.</p>
                </div>
              </div>
            )}

            {/* Header */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <h1 className="text-2xl font-semibold text-navy">
                Order <span className="font-mono text-gold-strong">{order.order_number}</span>
              </h1>
              <span className="flex items-center gap-2 text-xs text-ink/50">
                <span className={`h-2 w-2 rounded-full ${live ? 'bg-green-500' : 'bg-ink/30'}`} />
                {live ? 'Live' : 'Connecting…'}
              </span>
            </div>

            {/* Timeline */}
            <section className="animate-fade-up mt-4 rounded-2xl border border-gold-soft/60 bg-white/90 p-6 shadow-card">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-navy">Tracking</h2>
                <span className="rounded-full bg-gold/20 px-3 py-1 text-sm font-semibold text-gold-strong">
                  {statusLabel(order.status)}
                </span>
              </div>
              <OrderTimeline status={order.status} history={history} />
            </section>

            {/* Details */}
            <section className="animate-fade-up mt-6 rounded-2xl border border-gold-soft/60 bg-white/90 p-6 shadow-card">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-ink/60">Pickup date</p>
                  <p className="font-medium text-navy">{order.pickup_date}</p>
                </div>
                <div>
                  <p className="text-sm text-ink/60">Time slot</p>
                  <p className="font-medium text-navy">{order.pickup_slot}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-sm text-ink/60">Pickup address</p>
                  <p className="font-medium text-navy">
                    {(() => {
                      const a = order.address ?? order.addresses
                      return a ? `${a.label} — ${formatAddress(a)}` : '—'
                    })()}
                  </p>
                </div>
                {order.notes && (
                  <div className="sm:col-span-2">
                    <p className="text-sm text-ink/60">Notes</p>
                    <p className="font-medium text-navy">{order.notes}</p>
                  </div>
                )}
              </div>

              <div className="mt-5 border-t border-gold-soft/40 pt-4">
                <p className="mb-2 text-sm font-semibold text-navy">Items</p>
                <div className="divide-y divide-gold-soft/30">
                  {order.order_items?.map((it) => {
                    const est = it.est_unit_price
                    const changed = est != null && Number(est) !== Number(it.unit_price)
                    const estAmount = (Number(est) || 0) * it.quantity
                    return (
                      <div key={it.id} className="py-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-ink/80">
                            {it.service_name} <span className="text-ink/50">× {it.quantity}</span>
                          </span>
                          {changed ? (
                            <span className="text-right">
                              <span className="mr-2 text-ink/40 line-through">{aed(estAmount)}</span>
                              <span className="font-semibold text-navy">{aed(it.line_total)}</span>
                            </span>
                          ) : (
                            <span className="font-medium text-navy">{aed(it.line_total)}</span>
                          )}
                        </div>
                        {changed && (
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold-strong">
                              Final price after inspection
                            </span>
                            <span className="text-xs text-ink/50">
                              Updated after inspection based on the item's condition.
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                {order.final_total != null ? (
                  vat ? (
                    <div className="mt-3 space-y-1 border-t border-gold-soft/50 pt-3">
                      <div className="flex items-center justify-between text-sm text-ink/80">
                        <span>Subtotal (excl. VAT)</span>
                        <span>{aed(order.final_total)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-ink/80">
                        <span>VAT (5%)</span>
                        <span>{aed(Number(order.final_total) * 0.05)}</span>
                      </div>
                      <div className="flex items-center justify-between border-t border-gold-soft/40 pt-1.5">
                        <span className="font-serif text-lg text-navy">Total (incl. VAT)</span>
                        <span className="text-lg font-semibold text-navy">
                          {aed(Number(order.final_total) * 1.05)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 flex items-center justify-between border-t border-gold-soft/50 pt-3">
                      <span className="font-serif text-lg text-navy">Final total</span>
                      <span className="text-lg font-semibold text-navy">{aed(order.final_total)}</span>
                    </div>
                  )
                ) : (
                  <>
                    <div className="mt-3 flex items-center justify-between border-t border-gold-soft/50 pt-3">
                      <span className="font-serif text-lg text-navy">Estimated total</span>
                      <span className="text-lg font-semibold text-navy">{aed(order.estimated_total)}</span>
                    </div>
                    <p className="mt-1 text-xs text-ink/55">
                      Estimated total — final price confirmed after pickup &amp; inspection.
                    </p>
                  </>
                )}
              </div>
            </section>

            {/* Invoice is available to the customer ONLY after staff confirm the final price */}
            {order.final_total != null ? (
              <div className="mt-6 flex flex-wrap gap-3">
                <button onClick={downloadInvoice} disabled={downloading} className="btn-gold">
                  {downloading ? 'Preparing…' : 'Download invoice (PDF)'}
                </button>
                <Link to="/app/services" className="btn-navy bg-white text-navy hover:bg-cream">Book another pickup</Link>
                <Link to="/app/orders" className="btn-navy bg-white text-navy hover:bg-cream">My orders</Link>
              </div>
            ) : (
              <>
                <p className="mt-6 rounded-xl border border-gold-soft bg-gold/5 px-4 py-3 text-center text-sm text-ink/70">
                  Your invoice will be available here once we confirm the final price after inspection.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link to="/app/services" className="btn-gold">Book another pickup</Link>
                  <Link to="/app/orders" className="btn-navy bg-white text-navy hover:bg-cream">My orders</Link>
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}
