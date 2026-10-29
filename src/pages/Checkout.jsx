import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AppHeader from '../components/AppHeader.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { supabase } from '../lib/supabase.js'
import { aed } from '../lib/format.js'
import { formatAddress, PICKUP_SLOTS } from '../lib/address.js'
import EstimateNote from '../components/EstimateNote.jsx'

function todayISO() {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}

const NEW = 'new'
const LABELS = ['Home', 'Office', 'Other']

export default function Checkout() {
  const { user, profile } = useAuth()
  const { list, subtotal, count, clearCart } = useCart()
  const navigate = useNavigate()

  const [addresses, setAddresses] = useState([])
  const [choice, setChoice] = useState(null) // a saved address id, or NEW
  const [newAddr, setNewAddr] = useState({
    label: 'Home', line1: '', line2: '', area: 'Al Furjan', city: 'Dubai', notes: '',
  })

  const [pickupDate, setPickupDate] = useState(todayISO())
  const [pickupSlot, setPickupSlot] = useState(PICKUP_SLOTS[0])
  const [notes, setNotes] = useState('')

  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState('')

  const fetchAddresses = useCallback(async () => {
    const { data } = await supabase
      .from('addresses')
      .select('*')
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true })
    const rows = data ?? []
    setAddresses(rows)
    setChoice((cur) => cur ?? (rows.find((a) => a.is_default)?.id ?? rows[0]?.id ?? NEW))
  }, [])

  useEffect(() => {
    fetchAddresses()
  }, [fetchAddresses])

  const usingNew = choice === NEW
  const addressValid = usingNew ? newAddr.line1.trim() !== '' : Boolean(choice)
  const canPlace = count > 0 && addressValid && Boolean(pickupDate) && !placing

  function setNew(key, value) {
    setNewAddr((f) => ({ ...f, [key]: value }))
  }

  function resolveAddress() {
    if (usingNew) {
      return {
        addressId: null, // one-off: not saved to the profile
        snapshot: {
          label: newAddr.label.trim() || 'Pickup',
          line1: newAddr.line1.trim(),
          line2: newAddr.line2.trim(),
          area: newAddr.area.trim(),
          city: newAddr.city.trim() || 'Dubai',
          notes: newAddr.notes.trim(),
        },
      }
    }
    const a = addresses.find((x) => x.id === choice)
    return {
      addressId: a?.id ?? null,
      snapshot: a
        ? { label: a.label, line1: a.line1, line2: a.line2, area: a.area, city: a.city, notes: a.notes }
        : null,
    }
  }

  async function placeOrder() {
    setError('')
    if (!addressValid) {
      setError('Please choose a saved address or enter a new one.')
      return
    }
    if (!pickupDate) {
      setError('Please choose a pickup date.')
      return
    }
    setPlacing(true)

    const { addressId, snapshot } = resolveAddress()

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        customer_id: user.id,
        address_id: addressId,
        address: snapshot, // per-order snapshot (used for this booking only)
        pickup_date: pickupDate,
        pickup_slot: pickupSlot,
        notes: notes.trim() || null,
        subtotal,
        estimated_total: subtotal,
      })
      .select('id, order_number')
      .single()

    if (orderErr) {
      setPlacing(false)
      setError(orderErr.message)
      return
    }

    const itemsPayload = list.map((i) => ({
      order_id: order.id,
      service_id: i.id,
      service_name: i.name,
      unit: i.unit,
      unit_price: i.unit_price,
      est_unit_price: i.unit_price, // original estimate, preserved for later comparison
      quantity: i.quantity,
      line_total: i.unit_price * i.quantity,
    }))
    const { error: itemsErr } = await supabase.from('order_items').insert(itemsPayload)

    if (itemsErr) {
      await supabase.from('orders').delete().eq('id', order.id)
      setPlacing(false)
      setError(itemsErr.message)
      return
    }

    // Order is placed. Fire a staff "New order" alert email — best effort only:
    // it must NEVER block or break order placement, so it's fire-and-forget.
    try {
      supabase.functions
        .invoke('notify-new-order', {
          body: {
            orderNumber: order.order_number,
            customerName: profile?.full_name || user.email,
            customerPhone: profile?.phone || '',
            address: snapshot ? `${snapshot.label} — ${formatAddress(snapshot)}` : '—',
            pickupDate,
            pickupSlot,
            items: list.map((i) => ({
              name: i.name,
              quantity: i.quantity,
              lineTotal: i.unit_price * i.quantity,
            })),
            estimatedTotal: subtotal,
          },
        })
        .catch((e) => console.warn('[LinenLuxe] new-order email failed:', e?.message || e))
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[LinenLuxe] new-order email error:', e)
    }

    clearCart()
    navigate(`/app/order/${order.id}`, { replace: true, state: { justPlaced: true } })
  }

  if (count === 0 && !placing) {
    return (
      <div className="marble-bg min-h-screen">
        <AppHeader />
        <main className="mx-auto max-w-3xl px-4 py-16 text-center">
          <p className="text-ink/60">Your cart is empty.</p>
          <Link to="/app/services" className="btn-gold mt-5">Browse services</Link>
        </main>
      </div>
    )
  }

  return (
    <div className="marble-bg min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Link to="/app/cart" className="text-sm font-medium text-gold-strong hover:underline">
          ← Back to cart
        </Link>
        <h1 className="mt-3 text-3xl font-semibold text-navy">Checkout</h1>

        {/* Pickup address */}
        <section className="animate-fade-up mt-6 rounded-2xl border border-gold-soft/60 bg-white/90 p-6 shadow-card">
          <h2 className="text-xl font-semibold text-navy">Pickup address</h2>

          <div className="mt-4 space-y-2">
            {addresses.map((a) => (
              <label
                key={a.id}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                  choice === a.id ? 'border-gold bg-gold/10' : 'border-gold-soft/70 hover:border-gold'
                }`}
              >
                <input
                  type="radio" name="address" className="mt-1 h-4 w-4 accent-gold"
                  checked={choice === a.id} onChange={() => setChoice(a.id)}
                />
                <span>
                  <span className="font-serif text-navy">{a.label}</span>
                  {a.is_default && (
                    <span className="ml-2 rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-gold-strong">
                      Default
                    </span>
                  )}
                  <span className="block text-sm text-ink/70">{formatAddress(a)}</span>
                </span>
              </label>
            ))}

            {/* New (one-off) address option */}
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                usingNew ? 'border-gold bg-gold/10' : 'border-gold-soft/70 hover:border-gold'
              }`}
            >
              <input
                type="radio" name="address" className="mt-1 h-4 w-4 accent-gold"
                checked={usingNew} onChange={() => setChoice(NEW)}
              />
              <span>
                <span className="font-serif text-navy">Use a different address</span>
                <span className="block text-sm text-ink/55">For this booking only — not saved to your profile.</span>
              </span>
            </label>
          </div>

          {/* Inline new-address fields */}
          {usingNew && (
            <div className="mt-4 rounded-xl border border-gold-soft bg-cream/40 p-4">
              <div className="mb-3 flex flex-wrap gap-2">
                {LABELS.map((l) => (
                  <button
                    type="button" key={l} onClick={() => setNew('label', l)}
                    className={`rounded-full border px-4 py-1.5 text-sm transition ${
                      newAddr.label === l ? 'border-gold bg-gold text-navy' : 'border-gold-soft bg-white text-ink/70 hover:border-gold'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="field-label" htmlFor="line1">Building / Villa *</label>
                  <input id="line1" className="field-input" placeholder="e.g. Murano Residences, Tower B"
                    value={newAddr.line1} onChange={(e) => setNew('line1', e.target.value)} />
                </div>
                <div>
                  <label className="field-label" htmlFor="line2">Apartment / Floor / Unit</label>
                  <input id="line2" className="field-input" placeholder="e.g. Apt 1204"
                    value={newAddr.line2} onChange={(e) => setNew('line2', e.target.value)} />
                </div>
                <div>
                  <label className="field-label" htmlFor="area">Area</label>
                  <input id="area" className="field-input" placeholder="Al Furjan"
                    value={newAddr.area} onChange={(e) => setNew('area', e.target.value)} />
                </div>
                <div>
                  <label className="field-label" htmlFor="city">City</label>
                  <input id="city" className="field-input" placeholder="Dubai"
                    value={newAddr.city} onChange={(e) => setNew('city', e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <label className="field-label" htmlFor="addrNotes">Delivery notes (optional)</label>
                  <input id="addrNotes" className="field-input" placeholder="Gate code, landmark…"
                    value={newAddr.notes} onChange={(e) => setNew('notes', e.target.value)} />
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Pickup time */}
        <section className="animate-fade-up mt-6 rounded-2xl border border-gold-soft/60 bg-white/90 p-6 shadow-card">
          <h2 className="text-xl font-semibold text-navy">Pickup date &amp; time</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="pickupDate">Date</label>
              <input id="pickupDate" type="date" className="field-input" min={todayISO()}
                value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} />
            </div>
            <div>
              <label className="field-label" htmlFor="pickupSlot">Time slot</label>
              <select id="pickupSlot" className="field-input"
                value={pickupSlot} onChange={(e) => setPickupSlot(e.target.value)}>
                {PICKUP_SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="field-label" htmlFor="notes">Notes (optional)</label>
            <textarea id="notes" className="field-input min-h-[80px]"
              placeholder="Anything we should know — fragile items, special care, preferred contact…"
              value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </section>

        {/* Order summary */}
        <section className="animate-fade-up mt-6 rounded-2xl border border-gold-soft/60 bg-white/90 p-6 shadow-card">
          <h2 className="text-xl font-semibold text-navy">Order summary</h2>
          <div className="mt-3 divide-y divide-gold-soft/40">
            {list.map((i) => (
              <div key={i.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-ink/80">{i.name} <span className="text-ink/50">× {i.quantity}</span></span>
                <span className="font-medium text-navy">{aed(i.unit_price * i.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-gold-soft/50 pt-3">
            <span className="font-serif text-lg text-navy">Estimated total</span>
            <span className="text-lg font-semibold text-navy">{aed(subtotal)}</span>
          </div>
          <EstimateNote className="mt-3" />

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <button onClick={placeOrder} disabled={!canPlace} className="btn-gold mt-5 w-full">
            {placing ? 'Placing your order…' : 'Place order'}
          </button>
          {usingNew && !addressValid && (
            <p className="mt-2 text-center text-xs text-ink/45">Enter the building / villa to continue.</p>
          )}
        </section>
      </main>
    </div>
  )
}
