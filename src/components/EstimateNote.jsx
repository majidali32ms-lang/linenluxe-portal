// Clean, on-brand note shown next to prices so customers understand that cart/
// checkout prices are estimates until inspection.
export default function EstimateNote({ className = '' }) {
  return (
    <div
      className={`flex items-start gap-2.5 rounded-xl border border-gold-soft bg-gold/10 px-3.5 py-3 ${className}`}
    >
      <svg
        width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b8902f"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        className="mt-0.5 shrink-0"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4M12 8h.01" />
      </svg>
      <p className="text-xs leading-relaxed text-navy/85">
        <span className="font-semibold text-navy">These are estimated prices.</span>{' '}
        Final prices are confirmed after inspection and shown here with the final amount.
      </p>
    </div>
  )
}
