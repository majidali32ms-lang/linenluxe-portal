// Format an AED amount, e.g. 70 -> "AED 70.00", 15.5 -> "AED 15.50"
export function aed(amount) {
  const n = Number(amount) || 0
  return 'AED ' + n.toLocaleString('en-AE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

// Friendly unit suffix for steppers, e.g. "piece" -> "per piece"
export function unitLabel(unit) {
  if (!unit) return ''
  return `per ${unit}`
}
