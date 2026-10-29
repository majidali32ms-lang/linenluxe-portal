// The fixed 6-step order lifecycle (matches the order_status enum in the DB).
export const ORDER_STEPS = [
  { key: 'booked', label: 'Booked' },
  { key: 'picked_up', label: 'Picked up' },
  { key: 'processing', label: 'Processing' },
  { key: 'ready', label: 'Ready' },
  { key: 'out_for_delivery', label: 'Out for delivery' },
  { key: 'delivered', label: 'Delivered' },
]

export function statusLabel(key) {
  return ORDER_STEPS.find((s) => s.key === key)?.label ?? key
}

export function statusIndex(key) {
  return ORDER_STEPS.findIndex((s) => s.key === key)
}
