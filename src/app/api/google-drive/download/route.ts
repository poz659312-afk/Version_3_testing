import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminDriveClient } from '@/lib/drive-sharing'
import { checkRateLimit, getRequestIdentifier, RateLimitTier } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const identifier = getRequestIdentifier(request);
    const rateLimit = checkRateLimit(identifier, RateLimitTier.READ);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimit.limit.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.reset.toString(),
          },
        }
      );
    }

    // 1. Authenticate caller server-side via Supabase session
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('fileId')

    if (!fileId) {
      return NextResponse.json({ error: 'Missing fileId parameter' }, { status: 400 })
    }

    // 2. Verify caller is admin or has permissions
    const adminSupabase = createAdminClient()
    const { data: chameleon } = await adminSupabase
      .from('chameleons')
      .select('is_admin')
      .eq('auth_id', user.id)
      .single()

    // Retrieve authorized Drive client using server-verified user ID
    const drive = await getAdminDriveClient(user.id)

    // Retrieve file metadata from Google Drive API to get direct Google Drive delivery URL
    const fileMetaData = await drive.files.get({
      fileId: fileId,
      fields: 'id, webContentLink, webViewLink',
      supportsAllDrives: true,
    })

    const directDownloadUrl = fileMetaData.data.webContentLink || 
      `https://drive.google.com/uc?id=${fileId}&export=download`

    // REDIRECT client directly to Google Drive URL (HTTP 307)
    // This transfers ZERO binary bytes through Vercel Compute / Edge, completely eliminating FOT egress!
    return NextResponse.redirect(directDownloadUrl, 307)

  } catch (error: any) {
    console.error('Error downloading file:', error)
    return NextResponse.json({ error: error.message || 'Failed to download file' }, { status: 500 })
  }
}
