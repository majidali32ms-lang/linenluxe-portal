// LinenLuxe contact + brand constants (match the website exactly)
export const BRAND = {
  name: 'LinenLuxe Laundry',
  tagline: 'Luxury Care for Every Fabric',
  phoneDisplay: '+971 56 690 0126',
  phoneTel: '+971566900126',
  whatsapp: '971566900126',
  email: 'info@linenluxelaundry.com',
  website: 'linenluxelaundry.com',
  area: 'Al Furjan, Dubai',
}

// Pre-filled WhatsApp link (used for quote-only services + floating button)
export function whatsappLink(message) {
  const base = `https://wa.me/${BRAND.whatsapp}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}

// Resolve a website-relative image path (e.g. "assets/images/...") to an app URL.
export function imageUrl(path) {
  if (!path) return ''
  return path.startsWith('/') ? path : `/${path}`
}
