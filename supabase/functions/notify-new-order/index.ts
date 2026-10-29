// LinenLuxe — staff "New order" alert email via Resend.
//
// Sends ONE email to the owner (info@linenluxelaundry.com) when a customer places
// an order. Customers never get emailed. The Resend key stays server-side (Edge
// Function secret), never in the browser.
//
// FROM onboarding@resend.dev (Resend's test sender) TO info@linenluxelaundry.com
// — works on the free tier because info@ is the Resend account's own email.

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const TO = 'info@linenluxelaundry.com'
const FROM = 'LinenLuxe Orders <onboarding@resend.dev>'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

function esc(s: unknown): string {
  return String(s ?? '').replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string,
  )
}

function aed(n: unknown): string {
  return 'AED ' + (Number(n) || 0).toFixed(2)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  if (!RESEND_API_KEY) return json({ error: 'RESEND_API_KEY secret is not set' }, 500)

  let b: any
  try {
    b = await req.json()
  } catch {
    return json({ error: 'Invalid body' }, 400)
  }

  const orderNumber = esc(b.orderNumber)
  const customerName = esc(b.customerName)
  const customerPhone = esc(b.customerPhone)
  const address = esc(b.address)
  const pickup = esc([b.pickupDate, b.pickupSlot].filter(Boolean).join(' · '))
  const items = Array.isArray(b.items) ? b.items : []

  const rows = items
    .map(
      (i: any) =>
        `<tr>
          <td style="padding:6px 8px;border-bottom:1px solid #eee;">${esc(i.name)}</td>
          <td align="center" style="padding:6px 8px;border-bottom:1px solid #eee;">${esc(i.quantity)}</td>
          <td align="right" style="padding:6px 8px;border-bottom:1px solid #eee;">${aed(i.lineTotal)}</td>
        </tr>`,
    )
    .join('')

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#333;">
    <div style="background:#1a2a4a;padding:20px 24px;border-radius:8px 8px 0 0;">
      <div style="color:#c9a24b;font-size:20px;font-weight:bold;">LinenLuxe Laundry</div>
      <div style="color:#e8d9a8;font-size:13px;margin-top:4px;">New order received</div>
    </div>
    <div style="padding:24px;border:1px solid #eee;border-top:none;border-radius:0 0 8px 8px;">
      <p style="font-size:16px;margin:0 0 16px;">New order <strong style="color:#1a2a4a;">${orderNumber}</strong></p>
      <table style="width:100%;font-size:14px;margin-bottom:18px;border-collapse:collapse;">
        <tr><td style="padding:3px 0;color:#888;width:130px;">Customer</td><td style="padding:3px 0;">${customerName}</td></tr>
        <tr><td style="padding:3px 0;color:#888;">Phone</td><td style="padding:3px 0;">${customerPhone}</td></tr>
        <tr><td style="padding:3px 0;color:#888;">Pickup address</td><td style="padding:3px 0;">${address}</td></tr>
        <tr><td style="padding:3px 0;color:#888;">Pickup</td><td style="padding:3px 0;">${pickup}</td></tr>
      </table>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:#1a2a4a;color:#fff;">
            <th align="left" style="padding:7px 8px;">Item</th>
            <th style="padding:7px 8px;">Qty</th>
            <th align="right" style="padding:7px 8px;">Amount</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="text-align:right;font-size:16px;margin:14px 0 0;color:#1a2a4a;">
        <strong>Estimated total: ${aed(b.estimatedTotal)}</strong>
      </p>
      <p style="font-size:12px;color:#aaa;margin-top:6px;text-align:right;">
        Estimated — final price confirmed after inspection.
      </p>
    </div>
  </div>`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM,
      to: [TO],
      subject: `New order ${b.orderNumber ?? ''} — LinenLuxe`,
      html,
    }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) return json({ error: data?.message || 'Email send failed', data }, 502)
  return json({ ok: true, id: data?.id })
})
