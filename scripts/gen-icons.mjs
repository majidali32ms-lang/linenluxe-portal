// Generates PWA + favicon PNGs from the LinenLuxe mark (gold on navy).
// Run with: node scripts/gen-icons.mjs
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'public', 'icons')
mkdirSync(outDir, { recursive: true })

const NAVY = '#1a2a4a'
const GOLD = '#c9a24b'

// 512 canvas, navy full-bleed (maskable-safe), gold mark centered ~58%.
const svg = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="${NAVY}"/>
  <g transform="translate(107.5,107.5) scale(2.475)">
    <path d="M60 20c0-5 4-9 9-9s9 4 9 9c0 4-3 6-6 7" stroke="${GOLD}" stroke-width="3.5" stroke-linecap="round" fill="none"/>
    <path d="M60 31 L26 60 a3 3 0 0 0 2 5 H92 a3 3 0 0 0 2-5 L60 31 Z" stroke="${GOLD}" stroke-width="3.5" stroke-linejoin="round" fill="none"/>
    <path d="M48 60 h24 l8 34 a2 2 0 0 1-2 3 H42 a2 2 0 0 1-2-3 Z" fill="${GOLD}"/>
    <path d="M52 60 q8 9 16 0" stroke="${NAVY}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <path d="M92 26 l2.4 6.2 6.2 2.4 -6.2 2.4 -2.4 6.2 -2.4 -6.2 -6.2 -2.4 6.2 -2.4 Z" fill="${GOLD}"/>
  </g>
</svg>`

const buf = Buffer.from(svg)
const targets = [
  ['pwa-64x64.png', 64],
  ['pwa-192x192.png', 192],
  ['pwa-512x512.png', 512],
  ['maskable-512x512.png', 512],
  ['apple-touch-icon-180x180.png', 180],
  ['favicon-48x48.png', 48],
]

for (const [name, size] of targets) {
  await sharp(buf).resize(size, size).png().toFile(join(outDir, name))
  console.log('wrote', 'public/icons/' + name)
}
console.log('Done.')
