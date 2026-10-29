import { useState } from 'react'

const QUICK_LABELS = ['Home', 'Office', 'Other']

// Add/edit form for a saved address. Used for both create and update.
export default function AddressForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    label: initial?.label ?? 'Home',
    line1: initial?.line1 ?? '',
    line2: initial?.line2 ?? '',
    area: initial?.area ?? 'Al Furjan',
    city: initial?.city ?? 'Dubai',
    notes: initial?.notes ?? '',
    is_default: initial?.is_default ?? false,
  })
  const [error, setError] = useState('')

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.line1.trim()) {
      setError('Please enter the building or villa.')
      return
    }
    onSave({
      ...form,
      label: form.label.trim() || 'Home',
      line1: form.line1.trim(),
      line2: form.line2.trim(),
      area: form.area.trim(),
      city: form.city.trim() || 'Dubai',
      notes: form.notes.trim(),
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-gold-soft bg-cream/40 p-5"
    >
      <div className="mb-3">
        <span className="field-label">Label</span>
        <div className="flex flex-wrap gap-2">
          {QUICK_LABELS.map((l) => (
            <button
              type="button"
              key={l}
              onClick={() => set('label', l)}
              className={`rounded-full border px-4 py-1.5 text-sm transition ${
                form.label === l
                  ? 'border-gold bg-gold text-navy'
                  : 'border-gold-soft bg-white text-ink/70 hover:border-gold'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="line1">Building / Villa *</label>
          <input
            id="line1" className="field-input" placeholder="e.g. Murano Residences, Tower B"
            value={form.line1} onChange={(e) => set('line1', e.target.value)}
          />
        </div>
        <div>
          <label className="field-label" htmlFor="line2">Apartment / Floor / Unit</label>
          <input
            id="line2" className="field-input" placeholder="e.g. Apt 1204"
            value={form.line2} onChange={(e) => set('line2', e.target.value)}
          />
        </div>
        <div>
          <label className="field-label" htmlFor="area">Area</label>
          <input
            id="area" className="field-input" placeholder="Al Furjan"
            value={form.area} onChange={(e) => set('area', e.target.value)}
          />
        </div>
        <div>
          <label className="field-label" htmlFor="city">City</label>
          <input
            id="city" className="field-input" placeholder="Dubai"
            value={form.city} onChange={(e) => set('city', e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="notes">Delivery notes (optional)</label>
          <input
            id="notes" className="field-input" placeholder="Gate code, landmark, preferred door…"
            value={form.notes} onChange={(e) => set('notes', e.target.value)}
          />
        </div>
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm text-ink/80">
        <input
          type="checkbox"
          className="h-4 w-4 accent-gold"
          checked={form.is_default}
          onChange={(e) => set('is_default', e.target.checked)}
        />
        Set as my default pickup address
      </label>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="mt-5 flex gap-3">
        <button type="submit" className="btn-gold" disabled={saving}>
          {saving ? 'Saving…' : 'Save address'}
        </button>
        <button type="button" onClick={onCancel} className="btn-navy bg-white text-navy hover:bg-cream" disabled={saving}>
          Cancel
        </button>
      </div>
    </form>
  )
}
