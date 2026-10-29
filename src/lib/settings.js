import { supabase } from './supabase.js'

// Global business settings (single row in app_settings, id = 1).

export async function getVatEnabled() {
  const { data } = await supabase
    .from('app_settings')
    .select('vat_enabled')
    .eq('id', 1)
    .maybeSingle()
  return Boolean(data?.vat_enabled)
}

export async function setVatEnabled(value) {
  const { error } = await supabase
    .from('app_settings')
    .update({ vat_enabled: value, updated_at: new Date().toISOString() })
    .eq('id', 1)
  return error
}
