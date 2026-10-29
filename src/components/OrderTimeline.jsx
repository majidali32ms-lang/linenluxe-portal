import { ORDER_STEPS, statusIndex } from '../lib/orderStatus.js'

function formatTime(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleString('en-AE', { dateStyle: 'medium', timeStyle: 'short' })
}

// Vertical 6-step progress timeline. `history` rows give the timestamp per status.
export default function OrderTimeline({ status, history = [] }) {
  const currentIdx = statusIndex(status)

  // First-seen timestamp for each status key
  const timeFor = {}
  for (const h of history) {
    if (!timeFor[h.status]) timeFor[h.status] = h.created_at
  }

  return (
    <ol className="relative">
      {ORDER_STEPS.map((step, i) => {
        const done = i < currentIdx
        const current = i === currentIdx
        const reached = done || current
        const isLast = i === ORDER_STEPS.length - 1

        return (
          <li key={step.key} className="flex gap-4 pb-1">
            {/* marker + connector */}
            <div className="flex flex-col items-center">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition ${
                  reached
                    ? 'border-gold bg-gold text-navy'
                    : 'border-gold-soft bg-white text-transparent'
                } ${current ? 'ring-4 ring-gold/25' : ''}`}
              >
                {done ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                ) : (
                  <span className={`h-2.5 w-2.5 rounded-full ${current ? 'bg-navy' : 'bg-gold-soft'}`} />
                )}
              </span>
              {!isLast && (
                <span className={`my-1 w-0.5 flex-1 ${done ? 'bg-gold' : 'bg-gold-soft/60'}`} />
              )}
            </div>

            {/* label + time */}
            <div className={`pb-5 ${isLast ? '' : 'min-h-[3rem]'}`}>
              <p className={`font-medium ${reached ? 'text-navy' : 'text-ink/40'}`}>
                {step.label}
                {current && (
                  <span className="ml-2 rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold-strong">
                    Current
                  </span>
                )}
              </p>
              {timeFor[step.key] && (
                <p className="mt-0.5 text-xs text-ink/50">{formatTime(timeFor[step.key])}</p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
