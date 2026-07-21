import { NextRequest, NextResponse } from 'next/server'
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

    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('fileId')
    const authId = searchParams.get('authId')

    if (!fileId || !authId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    const drive = await getAdminDriveClient(authId)
    const response = await drive.files.get(
      { fileId: fileId, alt: 'media' },
      { responseType: 'stream' }
    )

    // Return the stream as Response with Cache-Control headers to conserve Google Drive API quota
    return new Response(response.data as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=600',
      },
    })
  } catch (error: any) {
    console.error('Error downloading file:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
