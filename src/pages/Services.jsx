import { useEffect, useMemo, useState } from 'react'
import AppHeader from '../components/AppHeader.jsx'
import ServiceCard from '../components/ServiceCard.jsx'
import CartBar from '../components/CartBar.jsx'
import { supabase } from '../lib/supabase.js'

const CATEGORY_LABELS = {
  all: 'All',
  garments: 'Garments',
  home: 'Home & Bedding',
  specialty: 'Specialty',
  restoration: 'Restoration',
  business: 'Business',
}

export default function Services() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    let active = true
    ;(async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
      if (!active) return
      if (error) setError(error.message)
      setServices(data ?? [])
      setLoading(false)
    })()
    return () => {
      active = false
    }
  }, [])

  const categories = useMemo(() => {
    const present = [...new Set(services.map((s) => s.category).filter(Boolean))]
    const ordered = ['garments', 'home', 'specialty', 'restoration', 'business'].filter((c) =>
      present.includes(c),
    )
    return ['all', ...ordered]
  }, [services])

  const visible = filter === 'all' ? services : services.filter((s) => s.category === filter)

  return (
    <div className="marble-bg min-h-screen pb-24">
      <AppHeader />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="animate-fade-up flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold text-navy">Our services</h1>
            <p className="mt-1 text-ink/70">
              Add what you need to your cart — we'll confirm the final price after pickup.
            </p>
          </div>
          <a
            href="/LinenLuxe-Laundry-Price-List.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-navy shrink-0 px-5 py-2.5 text-sm"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
            </svg>
            All Services (Price List)
          </a>
        </div>

        {/* Category filter */}
        {categories.length > 1 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={`rounded-full border px-4 py-1.5 text-sm transition ${
                  filter === c
                    ? 'border-gold bg-gold text-navy'
                    : 'border-gold-soft bg-white text-ink/70 hover:border-gold'
                }`}
              >
                {CATEGORY_LABELS[c] ?? c}
              </button>
            ))}
          </div>
        )}

        {error && (
          <p className="mt-6 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        {loading ? (
          <p className="mt-10 text-center text-ink/50">Loading services…</p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((s) => (
              <ServiceCard key={s.id} service={s} />
            ))}
          </div>
        )}
      </main>

      <CartBar />
    </div>
  )
}
