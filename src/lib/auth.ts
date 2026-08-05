import { createBrowserClient } from '@/lib/supabase/client'

export interface StudentUser {
  auth_id: string
  username: string
  phone_number: string
  specialization: string
  age: number
  current_level: number
  is_admin: boolean
  is_banned: boolean
  created_at: string
  profile_image?: string
  email?: string
  coins?: number
  inventory?: string[]
  Registrations?: { lastUpdated?: string; courses?: string[] } | null
  is_super_admin: boolean
}

const SESSION_CACHE_KEY = 'chameleon_user_cache'
const CACHE_DURATION = 15 * 60 * 1000 // 15 minutes — reduced DB hits significantly

interface CachedSession {
  data: StudentUser
  timestamp: number
}

/**
 * Get cached user data from sessionStorage
 */
function getCachedSession(): StudentUser | null {
  if (typeof window === "undefined") return null
  
  try {
    const cached = sessionStorage.getItem(SESSION_CACHE_KEY)
    if (!cached) return null
    
    const parsed: CachedSession = JSON.parse(cached)
    
    // Check if cache is still valid
    if (Date.now() - parsed.timestamp > CACHE_DURATION) {
      sessionStorage.removeItem(SESSION_CACHE_KEY)
      return null
    }
    
    return parsed.data
  } catch {
    return null
  }
}

/**
 * Cache user data in sessionStorage
 */
function setCachedSession(userData: StudentUser): void {
  if (typeof window === "undefined") return
  
  try {
    const cache: CachedSession = {
      data: userData,
      timestamp: Date.now()
    }
    sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(cache))
  } catch (error) {
    console.error('Failed to cache session:', error)
  }
}

/**
 * Clear cached user data
 */
export function clearSessionCache(): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(SESSION_CACHE_KEY)
  } catch (e) {
    console.error('Failed to clear session cache:', e)
  }
}

// Module-level in-flight promise cache to deduplicate parallel getStudentSession calls
let inFlightSessionPromise: Promise<StudentUser | null> | null = null

/**
 * Get current authenticated user from Supabase Auth + app database
 * Uses sessionStorage cache + in-flight promise deduplication to minimize network requests.
 */
export async function getStudentSession(forceRefresh = false): Promise<StudentUser | null> {
  if (forceRefresh) {
    inFlightSessionPromise = null
  } else if (inFlightSessionPromise) {
    return inFlightSessionPromise
  }

  inFlightSessionPromise = (async () => {
    try {
      if (!forceRefresh) {
        const cached = getCachedSession()
        if (cached) return cached
      }

      const supabase = createBrowserClient()
      
      // Use getSession() — validates JWT locally without a network round-trip
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      
      if (authError || !session?.user) {
        clearSessionCache()
        return null
      }

      const user = session.user

      // Check cache again after getSession in case another caller populated it
      if (!forceRefresh) {
        const cached = getCachedSession()
        if (cached && cached.auth_id === user.id) {
          return cached
        }
      }

      // Fetch fresh user data from chameleons table — select ONLY needed columns to minimize egress
      const { data: userData, error: dbError } = await supabase
        .from('chameleons')
        .select('auth_id, username, phone_number, specialization, age, current_level, is_admin, is_banned, created_at, profile_image, email, coins, inventory, Registrations, is_super_admin')
        .eq('auth_id', user.id)
        .single()

      if (dbError || !userData) {
        clearSessionCache()
        return null
      }

      // If user is banned, logout immediately
      if (userData.is_banned) {
        await clearStudentSession()
        return null
      }

      const sessionData: StudentUser = {
        auth_id: userData.auth_id,
        username: userData.username,
        phone_number: userData.phone_number,
        specialization: userData.specialization,
        age: userData.age,
        current_level: userData.current_level,
        is_admin: userData.is_admin,
        is_banned: userData.is_banned,
        created_at: userData.created_at,
        profile_image: userData.profile_image,
        email: userData.email,
        coins: userData.coins || 0,
        inventory: userData.inventory || [],
        Registrations: userData.Registrations || null,
        is_super_admin: userData.is_super_admin || false
      }

      setCachedSession(sessionData)
      return sessionData
    } catch (error) {
      console.error('Error getting student session:', error)
      clearSessionCache()
      return null
    } finally {
      inFlightSessionPromise = null
    }
  })()

  return inFlightSessionPromise
}

/**
 * Clear session and sign out from Supabase Auth
 * This replaces the old localStorage-based clearStudentSession()
 */
export async function clearStudentSession(): Promise<void> {
  inFlightSessionPromise = null
  clearSessionCache()
  if (typeof window !== "undefined") {
    try {
      const supabase = createBrowserClient()
      
      // Clear session cache first
      clearSessionCache()
      
      // Sign out from Supabase Auth (this clears the session)
      await supabase.auth.signOut({ scope: 'global' })
      
      // Clear any remaining localStorage/sessionStorage
      localStorage.clear()
      sessionStorage.clear()
      
      // Clear cookies
      document.cookie.split(";").forEach((c) => {
        const eqPos = c.indexOf("=")
        const name = eqPos > -1 ? c.substr(0, eqPos) : c
        document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
        document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`
        document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`
      })
    } catch (error) {
      console.error('Error during signout:', error)
      // Still clear local storage even if signout fails
      clearSessionCache()
      localStorage.clear()
      sessionStorage.clear()
    }
  }
}

/**
 * Check if user is authenticated via Supabase Auth
 * This replaces the old localStorage-based isAuthenticated()
 */
export async function isAuthenticated(): Promise<boolean> {
  if (typeof window === "undefined") return false
  
  try {
    const supabase = createBrowserClient()
    const { data: { user } } = await supabase.auth.getUser()
    return !!user
  } catch {
    return false
  }
}

/**
 * @deprecated Use Supabase Auth directly - this function is no longer needed
 * Session is now managed by Supabase Auth
 */
export function setStudentSession(user: StudentUser): void {
  console.warn('setStudentSession is deprecated. Session is managed by Supabase Auth.')
}
