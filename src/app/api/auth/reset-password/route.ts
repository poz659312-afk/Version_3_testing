import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { checkRateLimit, getRequestIdentifier, RateLimitTier } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // Rate limit sensitive operations
    const identifier = getRequestIdentifier(request)
    const rateLimit = checkRateLimit(identifier, RateLimitTier.SENSITIVE)
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429 }
      )
    }

    // Authenticate caller server-side
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Authentication required to reset password.' },
        { status: 401 }
      )
    }

    const { newPassword } = await request.json()

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Hash the new password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds)

    // Update password strictly for the authenticated user's account
    const { error: updateError } = await (supabase
      .from('chameleons') as any)
      .update({ pass: hashedPassword })
      .eq('auth_id', user.id)

    if (updateError) {
      console.error('Password update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update password. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic';
