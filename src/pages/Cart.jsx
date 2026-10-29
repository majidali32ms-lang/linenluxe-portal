import { Link, useNavigate } from 'react-router-dom'
import AppHeader from '../components/AppHeader.jsx'
import { useCart } from '../context/CartContext.jsx'
import { aed, unitLabel } from '../lib/format.js'
import { imageUrl } from '../lib/brand.js'
import EstimateNote from '../components/EstimateNote.jsx'

export default function Cart() {
  const { list, subtotal, setQty, removeItem, clearCart, count } = useCart()
  const navigate = useNavigate()

  return (
    <div className="marble-bg min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Link to="/app/services" className="text-sm font-medium text-gold-strong hover:underline">
          ← Continue browsing
        </Link>
        <h1 className="mt-3 text-3xl font-semibold text-navy">Your cart</h1>

        {list.length === 0 ? (
          <div className="animate-fade-up mt-6 rounded-2xl border border-dashed border-gold-soft bg-white/80 p-10 text-center">
            <p className="text-ink/60">Your cart is empty.</p>
            <Link to="/app/services" className="btn-gold mt-5">Browse services</Link>
          </div>
        ) : (
          <div className="animate-fade-up mt-6 space-y-4">
            {/* Items */}
            <div className="space-y-3">
              {list.map((i) => (
                <div
                  key={i.id}
                  className="flex items-center gap-3 rounded-2xl border border-gold-soft/60 bg-white p-3 shadow-card"
                >
                  <img
                    src={imageUrl(i.image_path)}
                    alt={i.name}
                    className="h-16 w-16 shrink-0 rounded-xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-serif text-base text-navy">{i.name}</p>
                    <p className="text-xs text-ink/60">
                      {aed(i.unit_price)} {unitLabel(i.unit)}
                    </p>
                    <button
                      onClick={() => removeItem(i.id)}
                      className="mt-1 text-xs text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="flex items-center rounded-xl border border-gold-soft">
                    <button
                      aria-label="Decrease"
                      onClick={() => setQty(i.id, i.quantity - 1)}
                      className="px-3 py-1.5 text-lg font-semibold text-navy hover:text-gold-strong"
                    >
                      −
                    </button>
                    <span className="min-w-[2ch] text-center font-semibold text-navy">
                      {i.quantity}
                    </span>
                    <button
                      aria-label="Increase"
                      onClick={() => setQty(i.id, i.quantity + 1)}
                      className="px-3 py-1.5 text-lg font-semibold text-navy hover:text-gold-strong"
                    >
                      +
                    </button>
                  </div>
                  <div className="w-24 shrink-0 text-right font-semibold text-navy">
                    {aed(i.unit_price * i.quantity)}
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="rounded-2xl border border-gold-soft/60 bg-white p-5 shadow-card">
              <div className="flex items-center justify-between text-lg">
                <span className="font-serif text-navy">Estimated total</span>
                <span className="font-semibold text-navy">{aed(subtotal)}</span>
              </div>
              <EstimateNote className="mt-3" />

              <button
                onClick={() => navigate('/app/checkout')}
                className="btn-gold mt-5 w-full"
              >
                Proceed to checkout
              </button>

              <button
                onClick={clearCart}
                className="mt-3 w-full text-center text-xs text-ink/50 hover:text-red-600"
              >
                Clear cart ({count} {count === 1 ? 'item' : 'items'})
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
