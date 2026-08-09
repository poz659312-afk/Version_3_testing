import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getValidAccessToken } from '@/lib/google-oauth'
import { google } from 'googleapis'
import type { drive_v3 } from 'googleapis'
import { Readable } from 'stream'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes timeout
export const dynamic = 'force-dynamic'

async function checkAdminAccess(authId: string) {
  const supabase = createAdminClient()

  const { data: user, error } = (await supabase
    .from('chameleons')
    .select('is_admin')
    .eq('auth_id', authId)
    .single()) as any

  if (error || !user) {
    return { hasAccess: false, isAdmin: false }
  }

  const { data: adminData } = await (supabase
    .from('admins') as any)
    .select('authorized')
    .eq('auth_id', authId)
    .single()

  const hasAccess = user.is_admin && (adminData?.authorized || false)
  return { hasAccess, isAdmin: user.is_admin }
}

export async function POST(request: NextRequest) {
  let file: File | null = null
  let parentFolderId: string = ''

  try {
    // 1. Authenticate caller server-side
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const authId = user.id

    request.signal?.addEventListener('abort', () => {
      console.log('Request aborted by client')
    })

    try {
      const formData = await request.formData()
      file = formData.get('file') as File
      parentFolderId = (formData.get('parentFolderId') as string) || ''
    } catch (formDataError) {
      console.log('FormData parsing failed:', formDataError)
      return NextResponse.json(
        { error: 'File upload parsing failed. Please try a smaller file or standard connection.' },
        { status: 413 }
      )
    }

    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
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

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )
    oauth2Client.setCredentials({ access_token: accessToken })

    const drive = google.drive({ version: 'v3', auth: oauth2Client })

    const fileSize = file.size
    console.log(`Uploading file: ${file.name} (${fileSize} bytes, ${(fileSize / (1024 * 1024)).toFixed(2)} MB)`)

    const fileMetadata = {
      name: file.name,
      parents: parentFolderId ? [parentFolderId] : undefined,
    }

    const timeoutMs = fileSize > 100 * 1024 * 1024 ? 45 * 60 * 1000 : 15 * 60 * 1000

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Upload timeout after ${timeoutMs / (60 * 1000)} minutes`)), timeoutMs)
    })

    // STREAM directly from Web ReadableStream to Node.js Readable stream to conserve Vercel Function RAM
    const fileStream = Readable.fromWeb((file as any).stream())

    const uploadPromise = drive.files.create({
      requestBody: fileMetadata,
      media: {
        mimeType: file.type,
        body: fileStream,
      },
      fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink',
      supportsAllDrives: true,
    })

    const response = await Promise.race([uploadPromise, timeoutPromise])

    return NextResponse.json({
      success: true,
      data: (response as { data: drive_v3.Schema$File }).data
    })

  } catch (error) {
    console.error('Error uploading file to Google Drive:', error)
    const errorObj = error instanceof Error ? error : new Error('Unknown error occurred')
    let errorMessage = errorObj.message

    if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
      errorMessage = 'Upload timeout. Network connection may be slow.'
    } else if (errorMessage.includes('quota')) {
      errorMessage = 'Google Drive storage quota exceeded.'
    }

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
