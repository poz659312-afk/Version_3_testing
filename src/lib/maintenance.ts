import { createBrowserClient } from '@/lib/supabase/client'

export const BYPASS_KEY = "chameleon-override-2026"

/**
 * Checks if the user has bypass access via URL search parameter or localStorage.
 */
export function checkBypass(): boolean {
  if (typeof window === 'undefined') return false
  
  const params = new URLSearchParams(window.location.search)
  
  // Allow clearing bypass state via clear_bypass parameter
  if (params.get("clear_bypass") === "true") {
    localStorage.removeItem("chameleon_bypass")
    return false
  }
  
  // Check URL params
  if (params.get("passkey") === BYPASS_KEY) {
    localStorage.setItem("chameleon_bypass", "true")
    return true
  }
  
  // Check localStorage
  return localStorage.getItem("chameleon_bypass") === "true"
}

/**
 * Revokes the maintenance bypass access.
 */
export function clearBypass() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem("chameleon_bypass")
  }
}

/**
 * Checks if the platform is paused (Chameleon Paused) globally.
 * Uses secure server-side fetching or API route to completely bypass client-side RLS constraints.
 */
export async function isPlatformPaused(): Promise<boolean> {
  try {
    // Server-side (SSR / Server Component): Import and use admin client directly
    if (typeof window === 'undefined') {
      const { createAdminClient } = await import('@/lib/supabase/admin')
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from('chameleons')
        .select('Registrations')
        .eq('email', 'tokyo9900777@gmail.com')
        .maybeSingle()
        
      if (error || !data) return false
      
      const regs = (data as any)?.Registrations
      return regs?.pause_chameleon === true
    }

    // Client-side (Browser): Call our secure API endpoint that bypasses RLS
    const res = await fetch('/api/platform-status', { cache: 'no-store' })
    if (!res.ok) return false
    const data = await res.json()
    return data.paused === true
  } catch (err) {
    console.error("Error checking platform pause status:", err)
    return false
  }
}

/**
 * Updates the platform pause status in the owner's Registrations column.
 */
export async function setPlatformPauseState(paused: boolean): Promise<boolean> {
  try {
    const supabase = createBrowserClient()
    
    // Fetch current registrations
    const { data, error: fetchError } = await supabase
      .from('chameleons')
      .select('Registrations')
      .eq('email', 'tokyo9900777@gmail.com')
      .maybeSingle()
      
    if (fetchError) throw fetchError
    
    const currentRegs = data?.Registrations || {}
    const updatedRegs = {
      ...(typeof currentRegs === 'object' ? currentRegs : {}),
      pause_chameleon: paused
    }
    
    const { error: updateError } = await supabase
      .from('chameleons')
      .update({ Registrations: updatedRegs })
      .eq('email', 'tokyo9900777@gmail.com')
      
    if (updateError) throw updateError
    return true
  } catch (err) {
    console.error("Error setting platform pause state:", err)
    return false
  }
}
