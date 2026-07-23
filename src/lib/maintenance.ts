import { createBrowserClient } from '@/lib/supabase/client'

export const BYPASS_KEY = "chameleon-override-2026"

/**
 * Checks if the user has bypass access via URL search parameter or localStorage.
 */
export function checkBypass(): boolean {
  if (typeof window === 'undefined') return false
  
  // Check URL params
  const params = new URLSearchParams(window.location.search)
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
 * Queries the Registrations JSON column for owner 'tokyo9900777@gmail.com'.
 */
export async function isPlatformPaused(): Promise<boolean> {
  try {
    const supabase = createBrowserClient()
    const { data, error } = await supabase
      .from('chameleons')
      .select('Registrations')
      .eq('email', 'tokyo9900777@gmail.com')
      .maybeSingle()
      
    if (error || !data) return false
    
    const regs = data.Registrations as any
    return regs?.pause_chameleon === true
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
