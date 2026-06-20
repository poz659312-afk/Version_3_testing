import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminDriveClient } from '@/lib/drive-sharing'
import { isValidDriveId } from '@/lib/drive-mapping'

// Recursive security check for non-admin folder/file access
async function isFolderOrFileAccessAllowed(drive: any, targetId: string): Promise<boolean> {
  // 1. If it's directly a whitelisted root folder, allow access
  if (isValidDriveId(targetId)) return true

  // 2. Otherwise, check parents recursively up to a limit (e.g. 5 levels) to see if they trace back to a whitelisted folder
  let currentId = targetId
  for (let depth = 0; depth < 5; depth++) {
    try {
      const response = await drive.files.get({
        fileId: currentId,
        fields: 'id, parents',
        supportsAllDrives: true
      })
      const parents = response.data.parents
      if (!parents || parents.length === 0) break

      // Check if any parent is whitelisted
      if (parents.some((p: string) => isValidDriveId(p))) {
        return true
      }

      // Go to first parent
      currentId = parents[0]
    } catch (e) {
      console.error(`Error checking parents for target ${targetId} at depth ${depth}:`, e)
      break
    }
  }

  return false
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const pageToken = searchParams.get('pageToken')
    const folderId = searchParams.get('folderId')
    const fileId = searchParams.get('fileId')
    const type = searchParams.get('type') // 'info' for single file info
    const authIdParam = searchParams.get('authId')
    
    const supabase = createAdminClient()

    // Get authId from query params
    if (!authIdParam) {
      return NextResponse.json(
        { error: 'Missing authId parameter' },
        { status: 400 }
      )
    }

    const authId = authIdParam

    // Configure Google Drive client using fallback admin client
    let drive
    try {
      drive = await getAdminDriveClient(authId)
    } catch (authError) {
      console.error('Failed to configure drive client:', authError)
      return NextResponse.json(
        { 
          error: 'Google Drive authentication required. Please connect your Google Drive or ensure an administrator has authorized access.',
          needsAuth: true 
        },
        { status: 401 }
      )
    }

    // Check if requesting user is admin
    const { data: chameleon } = await supabase
      .from('chameleons')
      .select('is_admin')
      .eq('auth_id', authId)
      .single()

    const isAdmin = chameleon?.is_admin || false

    // Security check for non-admin users
    if (!isAdmin) {
      const targetId = folderId || fileId
      if (targetId) {
        const allowed = await isFolderOrFileAccessAllowed(drive, targetId)
        if (!allowed) {
          console.warn(`🔒 Security Block: Non-admin user ${authId} attempted to access unauthorized folder/file ${targetId}`)
          return NextResponse.json(
            { error: 'Access denied to this folder/file' },
            { status: 403 }
          )
        }
      }
    }

    // Handle single file info request
    if (type === 'info' && fileId) {
      const response = await drive.files.get({
        fileId: fileId,
        fields: 'id, name, parents, mimeType, size, createdTime, modifiedTime, owners, webViewLink, webContentLink, thumbnailLink',
        supportsAllDrives: true
      })
      
      return NextResponse.json(response.data)
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
    })
    
  } catch (error) {
    console.error('Error listing Google Drive files:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    if (errorMessage.includes('No access token found') || errorMessage.includes('invalid_grant') || errorMessage.includes('No authorized admin')) {
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
