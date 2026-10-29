import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { aed } from '../lib/format.js'

// Floating bar shown at the bottom when the cart has items.
export default function CartBar() {
  const { count, subtotal } = useCart()
  if (count === 0) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 p-4">
      <Link
        to="/app/cart"
        className="pointer-events-auto mx-auto flex max-w-md items-center justify-between gap-4 rounded-2xl bg-navy px-5 py-3 text-white shadow-luxe transition hover:bg-navy-light"
      >
        <span className="flex items-center gap-2 text-sm">
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-gold px-2 text-xs font-bold text-navy">
            {count}
          </span>
          View cart
        </span>
        <span className="text-right">
          <span className="block text-sm font-semibold">{aed(subtotal)}</span>
          <span className="block text-[10px] text-gold-soft">estimated</span>
        </span>
      </Link>
    </div>
  )
}
