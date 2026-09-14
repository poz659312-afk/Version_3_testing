import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { checkRateLimit, getRequestIdentifier, RateLimitTier } from '@/lib/rate-limit'

const ID_PATTERN = /^[a-zA-Z0-9_-]{5,100}$/

export async function GET(request: NextRequest) {
  try {
    const identifier = getRequestIdentifier(request)
    const rateLimit = checkRateLimit(`drive_public:${identifier}`, RateLimitTier.READ)
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please slow down.' },
        { status: 429 }
      )
    }

    const { searchParams } = new URL(request.url)
    const rawPageSize = parseInt(searchParams.get('pageSize') || '20', 10)
    const pageSize = Math.min(Math.max(1, isNaN(rawPageSize) ? 20 : rawPageSize), 100)
    const pageToken = searchParams.get('pageToken')
    const folderId = searchParams.get('folderId')
    const fileId = searchParams.get('fileId')
    const type = searchParams.get('type') // 'info' for single file info

    if (folderId && !ID_PATTERN.test(folderId)) {
      return NextResponse.json({ error: 'Invalid folder identifier format' }, { status: 400 })
    }
    if (fileId && !ID_PATTERN.test(fileId)) {
      return NextResponse.json({ error: 'Invalid file identifier format' }, { status: 400 })
    }
    
    // Use API key for public access (no authentication required)
    const drive = google.drive({ 
      version: 'v3', 
      auth: process.env.GOOGLE_DRIVE_API_KEY 
    })

    // Handle single file info request
    if (type === 'info' && fileId) {
      const response = await drive.files.get({
        fileId: fileId,
        fields: 'id, name, parents, mimeType, size, createdTime, modifiedTime, owners, webViewLink, webContentLink, thumbnailLink',
        supportsAllDrives: true
      })
      
      return NextResponse.json(response.data, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      })
    }

    // Handle folder contents listing
    let query = 'trashed=false'
    if (folderId) {
      query += ` and '${folderId}' in parents`
    }

    const response = await drive.files.list({
      q: query,
      pageSize: pageSize,
      pageToken: pageToken || undefined,
      fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, owners, webViewLink, webContentLink, thumbnailLink, parents)',
      orderBy: 'folder,name',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true
    })
    
    return NextResponse.json({
      files: response.data.files || [],
      nextPageToken: response.data.nextPageToken
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
    
  } catch (error) {
    console.error('Error listing public drive files:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    if (errorMessage.includes('permission') || errorMessage.includes('access')) {
      return NextResponse.json(
        { error: 'This content requires authentication. Please contact an administrator.' },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
export const dynamic = 'force-dynamic';
