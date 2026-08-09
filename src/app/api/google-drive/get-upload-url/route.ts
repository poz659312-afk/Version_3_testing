import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getValidAccessToken } from '@/lib/google-oauth'

async function checkAdminAccess(userId: string) {
  const supabase = createAdminClient()

  const { data: user, error } = await supabase
    .from('chameleons')
    .select('is_admin')
    .eq('auth_id', userId)
    .single()

  if (error || !user) {
    return { hasAccess: false, isAdmin: false }
  }

  const { data: adminData } = await (supabase
    .from('admins') as any)
    .select('authorized')
    .eq('auth_id', userId)
    .single()

  const hasAccess = user.is_admin && (adminData?.authorized || false)
  return { hasAccess, isAdmin: user.is_admin }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate caller server-side
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const authId = user.id
    const { fileName, fileSize, mimeType, parentFolderId } = await request.json()

    if (!fileName) {
      return NextResponse.json(
        { error: 'File name is required' },
        { status: 400 }
      )
    }

    // 2. Check if verified user has admin access
    const { hasAccess } = await checkAdminAccess(authId)

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied. Admin authorization required.' },
        { status: 403 }
      )
    }

    // 3. Get valid access token for verified user
    const accessToken = await getValidAccessToken(authId)
    if (!accessToken) {
      return NextResponse.json(
        {
          error: 'Google Drive authentication required for your account. Please connect your Google Drive.',
          needsAuth: true
        },
        { status: 401 }
      )
    }

    const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true`

    return NextResponse.json({
      success: true,
      uploadMethod: 'direct',
      uploadUrl: uploadUrl,
      fileMetadata: {
        name: fileName,
        size: fileSize,
        mimeType: mimeType,
        parents: parentFolderId ? [parentFolderId] : undefined
      }
    })

  } catch (error) {
    console.error('Error generating upload URL:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

    if (errorMessage.includes('No access token found') || errorMessage.includes('invalid_grant')) {
      return NextResponse.json(
        { error: 'Google Drive authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic';
