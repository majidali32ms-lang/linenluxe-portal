import { useCart } from '../context/CartContext.jsx'
import { aed, unitLabel } from '../lib/format.js'
import { imageUrl, whatsappLink } from '../lib/brand.js'

export default function ServiceCard({ service }) {
  const { getQty, addItem, setQty } = useCart()
  const qty = getQty(service.id)
  const isQuote = service.is_quote_only

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-gold-soft/60 bg-white shadow-card">
      <div className="relative h-40 w-full overflow-hidden bg-cream">
        <img
          src={imageUrl(service.image_path)}
          alt={service.name}
          loading="lazy"
          className="h-full w-full object-cover"
        />
        {isQuote && (
          <span className="absolute right-2 top-2 rounded-full bg-navy/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold-soft">
            By quote
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-serif text-lg leading-tight text-navy">{service.name}</h3>
        <p className="mt-1 text-sm font-semibold text-gold-strong">{service.price_label}</p>
        {service.tagline && (
          <p className="mt-1 line-clamp-2 text-xs text-ink/60">{service.tagline}</p>
        )}

        <div className="mt-4 flex-1" />

        {isQuote ? (
          <a
            href={whatsappLink(
              `Hi LinenLuxe, I'd like a quote for ${service.name}. Please share details.`,
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-navy w-full py-2.5 text-sm"
          >
            Request a quote
          </a>
        ) : qty === 0 ? (
          <button onClick={() => addItem(service, 1)} className="btn-gold w-full py-2.5 text-sm">
            Add to cart
          </button>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center rounded-xl border border-gold-soft">
              <button
                aria-label="Decrease"
                onClick={() => setQty(service.id, qty - 1)}
                className="px-3 py-2 text-lg font-semibold text-navy hover:text-gold-strong"
              >
                −
              </button>
              <span className="min-w-[2ch] text-center font-semibold text-navy">{qty}</span>
              <button
                aria-label="Increase"
                onClick={() => setQty(service.id, qty + 1)}
                className="px-3 py-2 text-lg font-semibold text-navy hover:text-gold-strong"
              >
                +
              </button>
            </div>
            <div className="text-right">
              <p className="text-xs text-ink/50">{unitLabel(service.unit)}</p>
              <p className="font-semibold text-navy">{aed(service.base_price * qty)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
