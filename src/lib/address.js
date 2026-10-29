// Single-line formatting for a saved address row.
export function formatAddress(a) {
  if (!a) return ''
  return [a.line2, a.line1, a.area, a.city].filter(Boolean).join(', ')
}

// Pickup time slots offered at checkout.
export const PICKUP_SLOTS = [
  '09:00 – 12:00',
  '12:00 – 15:00',
  '15:00 – 18:00',
  '18:00 – 21:00',
]
