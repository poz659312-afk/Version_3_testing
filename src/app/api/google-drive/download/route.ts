import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminDriveClient } from '@/lib/drive-sharing'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
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

    // Return the stream as Response
    return new Response(response.data as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
      },
    })
  } catch (error: any) {
    console.error('Error downloading file:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
