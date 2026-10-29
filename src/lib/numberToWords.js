// Amount-in-words for AED invoices, e.g. 247.80 ->
// "Two Hundred Forty-Seven Dirhams and Eighty Fils Only".

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
]
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
const SCALES = ['', ' Thousand', ' Million', ' Billion']

function threeDigits(n) {
  let s = ''
  const h = Math.floor(n / 100)
  const r = n % 100
  if (h) s += ONES[h] + ' Hundred' + (r ? ' ' : '')
  if (r < 20) s += ONES[r]
  else {
    s += TENS[Math.floor(r / 10)]
    if (r % 10) s += '-' + ONES[r % 10]
  }
  return s.trim()
}

function toWords(n) {
  if (n === 0) return 'Zero'
  const parts = []
  while (n > 0) {
    parts.push(n % 1000)
    n = Math.floor(n / 1000)
  }
  let s = ''
  for (let i = parts.length - 1; i >= 0; i--) {
    if (parts[i]) s += threeDigits(parts[i]) + SCALES[i] + ' '
  }
  return s.trim()
}

export function amountInWords(amount) {
  const n = Math.max(0, Number(amount) || 0)
  const dirhams = Math.floor(n)
  const fils = Math.round((n - dirhams) * 100)
  let w = toWords(dirhams) + ' Dirham' + (dirhams === 1 ? '' : 's')
  if (fils > 0) w += ' and ' + toWords(fils) + ' Fils'
  w += ' Only'
  return w
}
