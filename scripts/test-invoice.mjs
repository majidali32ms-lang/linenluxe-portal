// Renders a sample invoice PDF to disk so we can eyeball the layout.
// Usage: node scripts/test-invoice.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { buildInvoiceDoc } from '../src/lib/invoice.js'

const logoB64 = readFileSync('public/brand/linenluxe-logo.png').toString('base64')
const logo = 'data:image/png;base64,' + logoB64

const order = {
  order_number: 'LL00007',
  created_at: '2026-06-23T10:15:00Z',
  pickup_date: '2026-06-24',
  final_total: 95, // set => INVOICE
  estimated_total: 85,
  is_paid: true,
  payment_method: 'cod', // change to 'online' to verify the tick moves
  address: { label: 'Home', line1: 'Murano Residences, Tower B', line2: 'Apt 1204', area: 'Al Furjan', city: 'Dubai' },
  order_items: [
    { id: '1', service_name: 'Dry Cleaning Service', quantity: 1, unit_price: 15, line_total: 15, est_unit_price: 15 },
    { id: '2', service_name: 'Wash & Fold Service', quantity: 1, unit_price: 70, line_total: 70, est_unit_price: 70 },
    { id: '3', service_name: 'Steam Press / Ironing Service', quantity: 2, unit_price: 5, line_total: 10, est_unit_price: 4 },
  ],
}

for (const [vatEnabled, tag] of [[false, 'noVAT'], [true, 'VAT']]) {
  const { doc, title } = buildInvoiceDoc({
    order,
    customerName: 'Majid Ali',
    customerPhone: '+971 56 111 2222',
    vatEnabled,
    logo,
  })
  const buf = Buffer.from(doc.output('arraybuffer'))
  const out = `scripts/sample-${title}-${tag}.pdf`
  writeFileSync(out, buf)
  console.log('wrote', out, buf.length, 'bytes')
}
