import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AppHeader from '../components/AppHeader.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabase.js'
import { aed } from '../lib/format.js'
import { formatAddress } from '../lib/address.js'
import { ORDER_STEPS, statusLabel, statusIndex } from '../lib/orderStatus.js'
import { getVatEnabled, setVatEnabled } from '../lib/settings.js'

function formatTime(ts) {
  return new Date(ts).toLocaleString('en-AE', { dateStyle: 'medium', timeStyle: 'short' })
}

export default function StaffOrderDetail() {
  const { id } = useParams()
  const { user, profile } = useAuth()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [rates, setRates] = useState({}) // { [order_item.id]: editable rate (string) }
  const [priceMsg, setPriceMsg] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [vat, setVat] = useState(null) // invoice VAT (5%) global setting

  useEffect(() => {
    getVatEnabled().then(setVat)
  }, [])

  async function toggleVat() {
    const next = !vat
    setVat(next)
    const err = await setVatEnabled(next)
    if (err) setVat(!next) // revert on failure
  }

  const fetchOrder = useCallback(async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*), addresses(*), profiles!customer_id(full_name, phone, email), order_status_history(*)')
      .eq('id', id)
      .single()
    if (error) setError(error.message)
    setOrder(data ?? null)
    setLoading(false)
  }, [id])

  useEffect(() => {
    fetchOrder()
  }, [fetchOrder])

  // Seed the editable rate fields from the order's line items (once per order).
  useEffect(() => {
    if (order?.order_items) {
      setRates(Object.fromEntries(order.order_items.map((it) => [it.id, String(it.unit_price)])))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.id])

  async function updateStatus(newStatus) {
    if (newStatus === order.status) return
    setBusy(true)
    setError('')
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', id)
    setBusy(false)
    if (error) return setError(error.message)
    fetchOrder()
  }

  async function assignToMe() {
    setBusy(true)
    const { error } = await supabase.from('orders').update({ assigned_staff_id: user.id }).eq('id', id)
    setBusy(false)
    if (error) return setError(error.message)
    fetchOrder()
  }

  async function setPaid(value) {
    setBusy(true)
    setError('')
    const { error } = await supabase.from('orders').update({ is_paid: value }).eq('id', id)
    setBusy(false)
    if (error) return setError(error.message)
    fetchOrder()
  }

  async function setMethod(value) {
    setBusy(true)
    setError('')
    const { error } = await supabase.from('orders').update({ payment_method: value }).eq('id', id)
    setBusy(false)
    if (error) return setError(error.message)
    fetchOrder()
  }

  async function downloadInvoice() {
    setDownloading(true)
    try {
      const { generateInvoice } = await import('../lib/invoice.js')
      await generateInvoice({
        order,
        customerName: order.profiles?.full_name,
        customerPhone: order.profiles?.phone,
      })
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[LinenLuxe] invoice error:', e)
    }
    setDownloading(false)
  }

  // Live per-line amount (edited rate × qty) and the live order total.
  const lineAmount = (it) => {
    const r = parseFloat(rates[it.id])
    return (Number.isFinite(r) ? r : Number(it.unit_price)) * it.quantity
  }
  const liveTotal = (order?.order_items ?? []).reduce((s, it) => s + lineAmount(it), 0)
  // UAE VAT: 5% of the subtotal; total = subtotal + VAT (only when the toggle is ON)
  const liveVat = vat ? liveTotal * 0.05 : 0
  const liveGrand = liveTotal + liveVat

  async function saveFinalPrice() {
    setPriceMsg('')
    // Every rate must be a valid non-negative number
    for (const it of order.order_items) {
      const r = parseFloat(rates[it.id])
      if (!Number.isFinite(r) || r < 0) {
        setPriceMsg('Enter a valid rate for every item.')
        return
      }
    }
    setBusy(true)
    // Persist only the lines whose rate changed (each independent)
    for (const it of order.order_items) {
      const newRate = parseFloat(rates[it.id])
      if (newRate !== Number(it.unit_price)) {
        const { error } = await supabase
          .from('order_items')
          .update({ unit_price: newRate, line_total: newRate * it.quantity })
          .eq('id', it.id)
        if (error) {
          setBusy(false)
          setPriceMsg('Error: ' + error.message)
          return
        }
      }
    }
    // Final total = live sum of the (possibly edited) items list
    const total = order.order_items.reduce(
      (s, it) => s + parseFloat(rates[it.id]) * it.quantity,
      0,
    )
    const { error } = await supabase.from('orders').update({ final_total: total }).eq('id', id)
    setBusy(false)
    if (error) return setPriceMsg('Error: ' + error.message)
    setPriceMsg('Final price saved.')
    fetchOrder()
  }

  const history = (order?.order_status_history ?? [])
    .slice()
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  const currentIdx = order ? statusIndex(order.status) : -1

  return (
    <div className="marble-bg min-h-screen">
      <AppHeader badge={profile?.role === 'admin' ? 'Admin' : 'Staff'} />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Link to="/staff" className="text-sm font-medium text-gold-strong hover:underline">
          ← Orders queue
        </Link>

        {loading ? (
          <p className="mt-6 text-center text-ink/50">Loading order…</p>
        ) : error || !order ? (
          <div className="mt-6 rounded-2xl border border-gold-soft/60 bg-white/90 p-8 text-center shadow-card">
            <p className="text-red-700">{error || 'Order not found.'}</p>
            <Link to="/staff" className="btn-gold mt-5">Back to queue</Link>
          </div>
        ) : (
          <>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <h1 className="text-2xl font-semibold text-navy">
                Order <span className="font-mono text-gold-strong">{order.order_number}</span>
              </h1>
              <span className="rounded-full bg-gold/20 px-3 py-1 text-sm font-semibold text-gold-strong">
                {statusLabel(order.status)}
              </span>
            </div>

            {/* Status control */}
            <section className="animate-fade-up mt-4 rounded-2xl border border-gold-soft/60 bg-white/90 p-6 shadow-card">
              <h2 className="text-lg font-semibold text-navy">Update status</h2>
              <p className="mt-1 text-sm text-ink/60">Tap a stage to set it. The customer sees this update live.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {ORDER_STEPS.map((step, i) => {
                  const reached = i <= currentIdx
                  const isCurrent = i === currentIdx
                  return (
                    <button
                      key={step.key}
                      disabled={busy || isCurrent}
                      onClick={() => updateStatus(step.key)}
                      className={`rounded-full border px-3.5 py-1.5 text-sm transition disabled:cursor-default ${
                        isCurrent
                          ? 'border-gold bg-gold text-navy'
                          : reached
                            ? 'border-gold-soft bg-gold/10 text-gold-strong hover:border-gold'
                            : 'border-gold-soft bg-white text-ink/70 hover:border-gold'
                      }`}
                    >
                      {step.label}
                    </button>
                  )
                })}
              </div>
              {currentIdx < ORDER_STEPS.length - 1 && (
                <button
                  disabled={busy}
                  onClick={() => updateStatus(ORDER_STEPS[currentIdx + 1].key)}
                  className="btn-gold mt-4 text-sm"
                >
                  Advance to {ORDER_STEPS[currentIdx + 1].label} →
                </button>
              )}
            </section>

            {/* Customer */}
            <section className="animate-fade-up mt-6 rounded-2xl border border-gold-soft/60 bg-white/90 p-6 shadow-card">
              <h2 className="text-lg font-semibold text-navy">Customer</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-ink/60">Name</p>
                  <p className="font-medium text-navy">{order.profiles?.full_name || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-ink/60">Phone</p>
                  <p className="font-medium text-navy">{order.profiles?.phone || '—'}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-sm text-ink/60">Email</p>
                  <p className="font-medium text-navy">{order.profiles?.email || '—'}</p>
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
                <div>
                  <p className="text-sm text-ink/60">Pickup</p>
                  <p className="font-medium text-navy">{order.pickup_date} · {order.pickup_slot}</p>
                </div>
                <div>
                  <p className="text-sm text-ink/60">Assigned to</p>
                  {order.assigned_staff_id === user.id ? (
                    <p className="font-medium text-green-700">You</p>
                  ) : order.assigned_staff_id ? (
                    <p className="font-medium text-navy">Another staff member</p>
                  ) : (
                    <button onClick={assignToMe} disabled={busy} className="text-sm font-semibold text-gold-strong hover:underline">
                      Assign to me
                    </button>
                  )}
                </div>
                <div>
                  <p className="text-sm text-ink/60">Payment status</p>
                  <p className={`font-semibold ${order.is_paid ? 'text-green-700' : 'text-navy'}`}>
                    {order.is_paid ? 'Paid' : 'Payment Pending'}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-xs text-ink/55">Mark as paid?</span>
                    <button
                      onClick={() => setPaid(true)} disabled={busy}
                      className={`rounded-full border px-3.5 py-0.5 text-xs font-semibold transition ${
                        order.is_paid ? 'border-gold bg-gold text-navy' : 'border-gold-soft text-ink/70 hover:border-gold'
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setPaid(false)} disabled={busy}
                      className={`rounded-full border px-3.5 py-0.5 text-xs font-semibold transition ${
                        !order.is_paid ? 'border-gold bg-gold text-navy' : 'border-gold-soft text-ink/70 hover:border-gold'
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-ink/60">Payment method</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    {[
                      { v: 'cod', label: 'COD' },
                      { v: 'online', label: 'Online' },
                    ].map((m) => {
                      const selected = (order.payment_method || 'cod') === m.v
                      return (
                        <button
                          key={m.v}
                          onClick={() => setMethod(m.v)}
                          disabled={busy}
                          className={`rounded-full border px-3.5 py-0.5 text-xs font-semibold transition ${
                            selected ? 'border-gold bg-gold text-navy' : 'border-gold-soft text-ink/70 hover:border-gold'
                          }`}
                        >
                          {m.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
                {order.notes && (
                  <div className="sm:col-span-2">
                    <p className="text-sm text-ink/60">Customer notes</p>
                    <p className="font-medium text-navy">{order.notes}</p>
                  </div>
                )}
              </div>
            </section>

            {/* Items + pricing — staff edits each rate; line amounts + total update live */}
            <section className="animate-fade-up mt-6 rounded-2xl border border-gold-soft/60 bg-white/90 p-6 shadow-card">
              <h2 className="text-lg font-semibold text-navy">Items &amp; pricing</h2>
              <p className="mt-1 text-sm text-ink/60">
                Adjust any service's rate after inspection — only that line changes, and the final total updates live.
              </p>

              <div className="mt-4 space-y-2">
                {order.order_items?.map((it) => (
                  <div
                    key={it.id}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-gold-soft/60 bg-cream/30 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-navy">{it.service_name}</p>
                      <p className="text-xs text-ink/55">
                        Qty {it.quantity}
                        {it.unit ? ` · per ${it.unit}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-ink/50">Rate</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="field-input w-24 px-2 py-1.5 text-right"
                        value={rates[it.id] ?? ''}
                        onChange={(e) => setRates((r) => ({ ...r, [it.id]: e.target.value }))}
                      />
                      <span className="text-xs text-ink/50">AED</span>
                    </div>
                    <div className="w-24 text-right font-semibold text-navy">{aed(lineAmount(it))}</div>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between text-sm text-ink/55">
                <span>Original estimate</span>
                <span>{aed(order.estimated_total)}</span>
              </div>

              {/* Final total (live) */}
              <div className="mt-4 rounded-xl border border-gold bg-gold/10 p-4">
                {vat ? (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm text-ink/80">
                      <span>Subtotal (excl. VAT)</span>
                      <span>{aed(liveTotal)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-ink/80">
                      <span>VAT (5%)</span>
                      <span>{aed(liveVat)}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-gold-soft/60 pt-1.5">
                      <span className="font-serif text-lg text-navy">Total (incl. VAT)</span>
                      <span className="text-xl font-bold text-navy">{aed(liveGrand)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-lg text-navy">Final total</span>
                    <span className="text-xl font-bold text-navy">{aed(liveTotal)}</span>
                  </div>
                )}
                <p className="mt-1 text-xs text-ink/55">
                  Live total of the items above — saved as the customer's <strong>Final total</strong>
                  {vat ? ' (VAT shown above and on the invoice).' : '.'}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button onClick={saveFinalPrice} disabled={busy} className="btn-gold py-2.5 text-sm">
                    {busy ? 'Saving…' : 'Save final price'}
                  </button>
                  {priceMsg && (
                    <span className={`text-sm ${priceMsg.startsWith('Error') ? 'text-red-700' : 'text-green-700'}`}>
                      {priceMsg}
                    </span>
                  )}
                </div>

                {/* Invoice VAT (5%) — global setting, controlled here next to the final price */}
                <div className="mt-3 flex flex-wrap items-center gap-2.5 border-t border-gold-soft/50 pt-3">
                  <span className="text-sm font-medium text-navy">Invoice VAT (5%)</span>
                  <button
                    onClick={toggleVat}
                    disabled={vat === null}
                    role="switch"
                    aria-checked={!!vat}
                    aria-label="Toggle invoice VAT"
                    className={`relative h-6 w-11 shrink-0 rounded-full transition ${vat ? 'bg-gold' : 'bg-ink/25'}`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${vat ? 'left-[1.4rem]' : 'left-0.5'}`}
                    />
                  </button>
                  <span className={`text-xs font-semibold ${vat ? 'text-gold-strong' : 'text-ink/50'}`}>
                    {vat === null ? '…' : vat ? 'On' : 'Off'}
                  </span>
                  <span className="text-xs text-ink/45">· applies to all invoices</span>
                </div>
              </div>
            </section>

            {/* History log */}
            <section className="animate-fade-up mt-6 rounded-2xl border border-gold-soft/60 bg-white/90 p-6 shadow-card">
              <h2 className="text-lg font-semibold text-navy">Status history</h2>
              <ul className="mt-3 space-y-2">
                {history.map((h) => (
                  <li key={h.id} className="flex items-center justify-between text-sm">
                    <span className="font-medium text-navy">{statusLabel(h.status)}</span>
                    <span className="text-ink/55">{formatTime(h.created_at)}</span>
                  </li>
                ))}
              </ul>
            </section>

            <div className="mt-6">
              <button onClick={downloadInvoice} disabled={downloading} className="btn-gold">
                {downloading ? 'Preparing…' : `Download ${order.final_total != null ? 'invoice' : 'estimate'} (PDF)`}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
