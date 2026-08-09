import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
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

export async function POST(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    // 1. Authenticate caller server-side
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const authId = user.id
    const { newName } = await request.json()

    if (!params.fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      )
    }

    if (!newName || typeof newName !== 'string') {
      return NextResponse.json(
        { error: 'New name is required' },
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
        { error: 'Google Drive authentication required' },
        { status: 401 }
      )
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )
    oauth2Client.setCredentials({ access_token: accessToken })

    const drive = google.drive({ version: 'v3', auth: oauth2Client })

    const response = await drive.files.update({
      fileId: params.fileId,
      requestBody: {
        name: newName.trim()
      },
      fields: 'id, name, mimeType, size, modifiedTime, webViewLink, webContentLink',
      supportsAllDrives: true
    })
    
    return NextResponse.json({
      success: true,
      data: response.data
    })
    
  } catch (error) {
    console.error('Error renaming file in Google Drive:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    if (errorMessage.includes('File not found')) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }
    
    if (errorMessage.includes('Permission denied')) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
