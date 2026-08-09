import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate caller server-side
    const supabase = await createServerSupabaseClient()
    const { data: { user: sessionUser }, error: authError } = await supabase.auth.getUser()

    if (authError || !sessionUser) {
      return NextResponse.json({ hasAccess: false, isAdmin: false, authorized: false }, { status: 401 })
    }

    const authId = sessionUser.id
    const adminSupabase = createAdminClient()

    // Get user data using authenticated user's ID
    const { data: user, error: userError } = await adminSupabase
      .from('chameleons')
      .select('auth_id, is_admin')
      .eq('auth_id', authId)
      .single()

    if (userError || !user?.is_admin) {
      return NextResponse.json({
        hasAccess: false,
        isAdmin: false,
        authorized: false
      })
    }

    // Check if admin has Google OAuth tokens in admins table
    const { data: adminData, error: adminError } = await (adminSupabase
      .from('admins') as any)
      .select('access_token, refresh_token, authorized')
      .eq('auth_id', authId)
      .single()

    if (adminError && adminError.code !== 'PGRST116') {
      console.error('Error checking admin access:', adminError)
      return NextResponse.json(
        { hasAccess: false, error: 'Failed to check admin access' },
        { status: 500 }
      )
    }

    const hasAccess = !!(adminData?.access_token && adminData?.authorized)
    
    return NextResponse.json({
      hasAccess,
      isAdmin: user?.is_admin || false,
      authorized: adminData?.authorized || false
    })
    
  } catch (error) {
    console.error('Error checking Google Drive access:', error)
    return NextResponse.json(
      { hasAccess: false, error: 'Failed to check Google Drive access' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic';
