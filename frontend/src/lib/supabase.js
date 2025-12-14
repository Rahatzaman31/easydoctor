import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

let supabase = null
let isConfigured = false

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
  isConfigured = true
}

function getWebPUrl(url) {
  if (!url) return url
  if (url.startsWith('/') || url.startsWith('data:')) return url
  if (!supabaseUrl) return url
  if (!url.includes(supabaseUrl) && !url.includes('supabase')) return url
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}format=webp`
}

export { supabase, isConfigured, getWebPUrl }
