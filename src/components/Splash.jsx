import { useEffect } from 'react'

// Full-screen branded welcome.
// The full cover art (logo + tagline) is always shown sharp & centered; a soft
// blurred copy of the same marble fills the rest of the viewport so it covers
// edge-to-edge on any screen without cropping the logo or looking zoomed.
export default function Splash({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3600)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-[#ece6da]">
      {/* Blurred marble fill (covers the whole viewport, never letterboxed) */}
      <img
        src="/brand/cover-full.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full scale-125 object-cover blur-2xl"
      />
      {/* Gentle scrim for the CTA at the bottom */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-navy/55 to-transparent" />

      {/* Sharp, fully-visible cover — logo + tagline always shown & centered */}
      <div className="animate-fade-up relative z-10 flex flex-1 items-center justify-center px-4 pt-8">
        <img
          src="/brand/cover-full.jpg"
          alt="LinenLuxe Laundry — Luxury Laundry, Perfectly Delivered"
          className="max-h-[66vh] max-w-[min(1080px,100%)] rounded-2xl object-contain shadow-2xl"
          draggable="false"
        />
      </div>

      {/* CTA pinned at the bottom, centered */}
      <div className="relative z-10 flex flex-col items-center pb-10">
        <button
          onClick={onDone}
          className="btn-gold px-12 py-3.5 text-base shadow-luxe ring-1 ring-white/30"
        >
          Get started
        </button>
        <p className="mt-5 font-serif text-lg italic tracking-[0.04em] text-black drop-shadow-[0_1px_4px_rgba(255,255,255,0.55)] sm:text-xl">
          Book in Seconds <span className="not-italic">—</span> We Handle the Rest
        </p>
      </div>
    </div>
  )
}
