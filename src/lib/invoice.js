import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { BRAND } from './brand.js'
import { formatAddress } from './address.js'
import { amountInWords } from './numberToWords.js'
import { getVatEnabled } from './settings.js'
import { GREAT_VIBES_TTF } from './greatVibesFont.js'

// ---- Theme ----
const NAVY = [26, 42, 74]
const GOLD = [201, 162, 75]
const GOLD_STRONG = [184, 144, 47]
const INK = [60, 60, 60]
const MUTED = [120, 120, 120]
const HAIRLINE = [222, 213, 192]

const VAT_RATE = 0.05

function money(n) {
  return (Number(n) || 0).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDate(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

// Draw a small square checkbox; tick it (gold) when checked.
function drawCheckbox(doc, x, y, checked) {
  const size = 3.4
  const top = y - 2.9
  doc.setDrawColor(...NAVY)
  doc.setLineWidth(0.3)
  doc.rect(x, top, size, size)
  if (checked) {
    doc.setDrawColor(...GOLD_STRONG)
    doc.setLineWidth(0.7)
    doc.lines([[0.9, 0.9], [1.7, -2.1]], x + 0.6, top + 1.7)
  }
}

async function loadLogoDataUrl() {
  try {
    const res = await fetch('/brand/linenluxe-logo.png')
    const blob = await res.blob()
    return await new Promise((resolve) => {
      const r = new FileReader()
      r.onloadend = () => resolve(r.result)
      r.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

/**
 * Build the invoice/estimate PDF document (pure — no network or download).
 * Returns { doc, title } so it can be saved in the browser or written to disk in Node.
 */
export function buildInvoiceDoc({ order, customerName, customerPhone, vatEnabled, logo }) {
  const isFinal = order.final_total != null
  const title = isFinal ? 'INVOICE' : 'ESTIMATE'
  const items = order.order_items ?? []
  const subtotal = items.reduce((s, it) => s + Number(it.line_total || 0), 0)
  const vat = vatEnabled ? subtotal * VAT_RATE : 0
  const total = subtotal + vat

  const addr = order.address ?? order.addresses
  const addressText = addr ? formatAddress(addr) : '—'
  const paymentStatus = order.is_paid ? 'Paid' : 'Payment Pending'
  const codChecked = order.payment_method !== 'online' // default COD

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  // Register the Great Vibes script font for the "Thank You!" flourish.
  try {
    doc.addFileToVFS('GreatVibes.ttf', GREAT_VIBES_TTF)
    doc.addFont('GreatVibes.ttf', 'GreatVibes', 'normal')
  } catch (_) {
    /* fall back to italic helvetica if the font can't register */
  }
  const pageW = doc.internal.pageSize.getWidth() // 210
  const pageH = doc.internal.pageSize.getHeight() // 297
  const margin = 15

  // ---------- Header ----------
  if (logo) doc.addImage(logo, 'PNG', margin, 13, 54, 36) // 900x600 ratio

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(30)
  doc.setTextColor(...NAVY)
  doc.text(title, pageW - margin, 24, { align: 'right' })
  doc.setDrawColor(...GOLD)
  doc.setLineWidth(0.8)
  doc.line(pageW - margin - 34, 27, pageW - margin, 27)

  // meta block (right)
  const mLabelX = pageW - 78
  const mValX = pageW - 50
  let my = 35
  const meta = [
    ['Invoice No', order.order_number],
    ['Date', formatDate(order.created_at)],
    ['Phone', BRAND.phoneDisplay],
    ['Email', BRAND.email],
    ['Website', BRAND.website],
  ]
  doc.setFontSize(9)
  meta.forEach(([k, v]) => {
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...NAVY)
    doc.text(k, mLabelX, my)
    doc.setTextColor(...MUTED)
    doc.text(':', mValX - 3, my)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...INK)
    doc.text(String(v), mValX, my)
    my += 5
  })

  // gold divider under header
  let y = Math.max(54, my + 2)
  doc.setDrawColor(...GOLD)
  doc.setLineWidth(0.6)
  doc.line(margin, y, pageW - margin, y)
  y += 8

  // ---------- Bill-to + order details (two columns) ----------
  const colR = pageW / 2 + 6
  const startY = y

  // Left: Bill To
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...GOLD_STRONG)
  doc.text('BILL TO', margin, y)
  y += 6
  doc.setTextColor(...NAVY)
  doc.setFontSize(11)
  doc.text(customerName || 'Customer', margin, y)
  y += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(...INK)
  if (customerPhone) {
    doc.text(customerPhone, margin, y)
    y += 5
  }
  const addrLines = doc.splitTextToSize(addressText, pageW / 2 - margin - 6)
  doc.text(addrLines, margin, y)
  y += addrLines.length * 4.6
  const leftBottom = y

  // Right: details
  let ry = startY
  doc.setFontSize(9.5)

  // Pickup Date
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...NAVY)
  doc.text('Pickup Date', colR, ry)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...INK)
  doc.text(': ' + formatDate(order.pickup_date), colR + 34, ry)
  ry += 6.5

  // Payment Status
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...NAVY)
  doc.text('Payment Status', colR, ry)
  doc.setFont('helvetica', 'normal')
  if (order.is_paid) doc.setTextColor(34, 120, 60)
  else doc.setTextColor(...INK)
  doc.text(': ' + paymentStatus, colR + 34, ry)
  ry += 6.8

  // Payment Method (COD / Online checkboxes)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...NAVY)
  doc.text('Payment Method', colR, ry)
  ry += 5.6
  drawCheckbox(doc, colR + 2, ry, codChecked)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...INK)
  doc.text('COD', colR + 7.5, ry)
  drawCheckbox(doc, colR + 28, ry, !codChecked)
  doc.text('Online', colR + 33.5, ry)
  ry += 6.5

  y = Math.max(leftBottom, ry) + 4

  // ---------- Items table ----------
  // Track which rows changed after inspection so we can add a note under them.
  const changedRows = new Set()
  const body = items.map((it, idx) => {
    const changed = it.est_unit_price != null && Number(it.est_unit_price) !== Number(it.unit_price)
    if (changed) changedRows.add(idx)
    return [it.service_name, String(it.quantity), money(it.unit_price), money(it.line_total)]
  })

  autoTable(doc, {
    startY: y,
    head: [['Item', 'Qty', 'Rate (AED)', 'Amount (AED)']],
    body,
    theme: 'grid',
    headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: 'bold', halign: 'left', fontSize: 10 },
    bodyStyles: { fontSize: 10, textColor: INK, cellPadding: 2.6 },
    alternateRowStyles: { fillColor: [250, 247, 240] },
    columnStyles: {
      0: { halign: 'left' },
      1: { halign: 'center', cellWidth: 22 },
      2: { halign: 'right', cellWidth: 34 },
      3: { halign: 'right', cellWidth: 38 },
    },
    styles: { lineColor: HAIRLINE, lineWidth: 0.1 },
    margin: { left: margin, right: margin },
    // Reserve height + top-align changed rows so the note fits beneath the item.
    didParseCell: (data) => {
      if (data.section === 'body' && changedRows.has(data.row.index)) {
        data.cell.styles.valign = 'top'
        if (data.column.index === 0) data.cell.styles.minCellHeight = 16
      }
    },
    // Draw the per-item inspection note under changed items.
    didDrawCell: (data) => {
      if (data.section === 'body' && data.column.index === 0 && changedRows.has(data.row.index)) {
        const it = items[data.row.index]
        const estAmt = (Number(it.est_unit_price) || 0) * it.quantity
        const x = data.cell.x + 2.4
        let ny = data.cell.y + 8.6
        doc.setFont('helvetica', 'italic')
        doc.setFontSize(7)
        doc.setTextColor(...GOLD_STRONG)
        doc.text("Final price after inspection — updated based on the item's condition.", x, ny)
        ny += 3.4
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...MUTED)
        doc.text(`Estimated AED ${money(estAmt)}   ·   Final AED ${money(it.line_total)}`, x, ny)
      }
    },
  })

  y = doc.lastAutoTable.finalY + 8

  // ---------- Totals (right) ----------
  const totalsLabelX = pageW - margin - 88
  const totalsValX = pageW - margin
  doc.setFontSize(10)

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...INK)
  doc.text(vatEnabled ? 'Subtotal (excl. VAT)' : 'Subtotal', totalsLabelX, y)
  doc.text(money(subtotal), totalsValX, y, { align: 'right' })
  y += 6

  if (vatEnabled) {
    doc.text('VAT (5%)', totalsLabelX, y)
    doc.text(money(vat), totalsValX, y, { align: 'right' })
    y += 6
  }

  // Total amount band (navy label + gold value)
  y += 1
  const bandY = y
  const bandH = 11
  const bandLeft = totalsLabelX - 4
  const splitX = pageW - margin - 50
  doc.setFillColor(...NAVY)
  doc.rect(bandLeft, bandY, splitX - bandLeft, bandH, 'F')
  doc.setFillColor(...GOLD)
  doc.rect(splitX, bandY, totalsValX - splitX, bandH, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10.5)
  doc.setTextColor(255, 255, 255)
  doc.text('TOTAL AMOUNT', bandLeft + 4, bandY + 7.2)
  doc.setTextColor(...NAVY)
  doc.text('AED ' + money(total), totalsValX - 3, bandY + 7.2, { align: 'right' })
  y = bandY + bandH + 8

  // ---------- Amount in words ----------
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(...NAVY)
  doc.text('Amount in Words:', margin, y)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(...INK)
  const words = doc.splitTextToSize(amountInWords(total) + '.', pageW - 2 * margin)
  doc.text(words, margin, y + 5)
  y += 5 + words.length * 4.6 + 6

  // ---------- Terms & Conditions ----------
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...GOLD_STRONG)
  doc.text('TERMS & CONDITIONS', margin, y)
  y += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...MUTED)
  const terms = [
    '1. Please check your items upon delivery.',
    '2. Any complaint must be reported within 12 hours of delivery.',
    '3. In case of damage caused by us, compensation is limited to 10x the service charge.',
    '4. We are responsible for your items up to 1 month from the delivery date.',
    isFinal
      ? '5. This is the final invoice with confirmed prices after inspection.'
      : '5. This is an estimate; final prices are confirmed after inspection.',
  ]
  terms.forEach((t) => {
    const lines = doc.splitTextToSize(t, pageW - 2 * margin)
    doc.text(lines, margin, y)
    y += lines.length * 4.4
  })

  // Closing line inside the Terms & Conditions block
  y += 2.5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...NAVY)
  doc.text('Thank you for choosing LinenLuxe Laundry!', margin, y)

  // ---------- Decorative "Thank You!" (script) ----------
  const ty = Math.max(y + 16, pageH - 44)
  let useScript = true
  try {
    doc.setFont('GreatVibes', 'normal')
  } catch (_) {
    useScript = false
    doc.setFont('helvetica', 'italic')
  }
  doc.setFontSize(useScript ? 40 : 18)
  doc.setTextColor(...GOLD_STRONG)
  doc.text('Thank You!', pageW / 2, ty, { align: 'center' })

  // Flourish lines on either side of the script
  const tw = doc.getTextWidth('Thank You!')
  const lineY = ty - 4
  const gap = 7
  const leftEnd = pageW / 2 - tw / 2 - gap
  const rightStart = pageW / 2 + tw / 2 + gap
  doc.setDrawColor(...GOLD)
  doc.setLineWidth(0.4)
  doc.line(margin + 16, lineY, leftEnd, lineY)
  doc.line(rightStart, lineY, pageW - margin - 16, lineY)
  doc.setFillColor(...GOLD)
  doc.circle(margin + 14, lineY, 0.8, 'F')
  doc.circle(pageW - margin - 14, lineY, 0.8, 'F')

  // ---------- Footer band ----------
  const footY = pageH - 18
  doc.setFillColor(...NAVY)
  doc.rect(0, footY, pageW, 18, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...GOLD)
  doc.text(BRAND.name, margin, footY + 7)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(235, 235, 235)
  doc.text(
    `${BRAND.phoneDisplay}   |   ${BRAND.email}   |   ${BRAND.website}   |   ${BRAND.area}`,
    margin,
    footY + 12.5,
  )

  return { doc, title }
}

/**
 * Generate and download a premium PDF invoice/estimate for an order (browser).
 */
export async function generateInvoice({ order, customerName, customerPhone }) {
  const vatEnabled = await getVatEnabled()
  const logo = await loadLogoDataUrl()
  const { doc, title } = buildInvoiceDoc({ order, customerName, customerPhone, vatEnabled, logo })
  doc.save(`LinenLuxe-${title}-${order.order_number}.pdf`)
}
