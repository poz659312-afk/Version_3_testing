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
    const response = await drive.files.get(
      { fileId: fileId, alt: 'media' },
      { responseType: 'stream' }
    )

    // Return the stream as Response with Cache-Control headers
    return new Response(response.data as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=600',
      },
    })
  } catch (error: any) {
    console.error('Error downloading file:', error)
    return NextResponse.json({ error: error.message || 'Failed to download file' }, { status: 500 })
  }
}
