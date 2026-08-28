import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json()

    // Validate required fields
    if (!userData.username || !userData.pass || !userData.auth_id) {
      return NextResponse.json(
        { error: 'Missing required fields: username, pass, auth_id' },
        { status: 400 }
      )
    }

    // Create Supabase admin client (bypasses RLS for server-side operations)
    const supabase = createAdminClient()

    // 1. Verify that the auth_id actually exists in Supabase Auth
    const { data: authUserData, error: authUserError } = await supabase.auth.admin.getUserById(
      userData.auth_id
    )
    if (authUserError || !authUserData?.user) {
      return NextResponse.json(
        { error: 'Invalid auth_id: User not found in authentication system.' },
        { status: 400 }
      )
    }

    // 2. Prevent duplicate profile creation for the same auth_id
    const { data: existingUser } = await (supabase
      .from('chameleons') as any)
      .select('auth_id')
      .eq('auth_id', userData.auth_id)
      .maybeSingle()

    if (existingUser) {
      return NextResponse.json(
        { error: 'A profile already exists for this account.' },
        { status: 409 }
      )
    }

    // Auto-confirm the user's email if needed
    const { error: confirmError } = await supabase.auth.admin.updateUserById(
      userData.auth_id,
      { email_confirm: true }
    )
    if (confirmError) {
      console.error('Error auto-confirming user email:', confirmError)
    }

    // Insert user into chameleons table — enforce non-privileged defaults
    const { data: newUser, error: insertError } = await supabase
      .from('chameleons')
      .insert({
        username: userData.username,
        pass: userData.pass,
        specialization: userData.specialization,
        age: userData.age,
        current_level: userData.current_level,
        status: userData.status || 'student',
        is_admin: false,
        is_banned: false,
        email: authUserData.user.email || userData.email,
        profile_image: userData.profile_image || '',
        phone_number: userData.phone_number || '',
        auth_id: userData.auth_id,
      } as any)
      .select()
      .single()

    if (insertError) {
      console.error('Error creating user:', insertError)
      return NextResponse.json(
        { error: 'Failed to create user: ' + insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: newUser, error: null })

  } catch (error) {
    console.error('User creation error:', error)
    return NextResponse.json(
      { error: 'An error occurred during user creation' },
      { status: 500 }
    )
  }
}


export const dynamic = 'force-dynamic';
