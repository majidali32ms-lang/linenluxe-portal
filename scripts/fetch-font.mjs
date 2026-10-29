// Fetches the Great Vibes (OFL) cursive font and embeds it as base64 for jsPDF,
// so the invoice "Thank You!" can use the same script style as the reference.
import { writeFileSync } from 'node:fs'

const urls = [
  'https://raw.githubusercontent.com/google/fonts/main/ofl/greatvibes/GreatVibes-Regular.ttf',
  'https://cdn.jsdelivr.net/gh/google/fonts/ofl/greatvibes/GreatVibes-Regular.ttf',
]

let buf = null
for (const url of urls) {
  try {
    const res = await fetch(url)
    if (res.ok) {
      buf = Buffer.from(await res.arrayBuffer())
      console.log('fetched from', url, buf.length, 'bytes')
      break
    }
    console.log('skip', url, res.status)
  } catch (e) {
    console.log('error', url, String(e))
  }
}
if (!buf) throw new Error('Could not fetch Great Vibes font')

const b64 = buf.toString('base64')
writeFileSync(
  'src/lib/greatVibesFont.js',
  `// Great Vibes (SIL OFL 1.1) — base64 TTF for the invoice "Thank You!" script.\nexport const GREAT_VIBES_TTF =\n  '${b64}'\n`,
)
console.log('wrote src/lib/greatVibesFont.js')
