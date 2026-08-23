import { NextRequest, NextResponse } from 'next/server'
import { getServerStudentSession } from '@/lib/auth-server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getContributorProfile } from '@/app/summaries/actions'
import { listContributorSubfolders, uploadSummaryFileToDrive } from '@/lib/google-drive-contributor'
import { revalidatePath } from 'next/cache'

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024 // 50 MB
const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'doc', 'pptx', 'ppt', 'txt']
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-powerpoint',
  'text/plain',
  'application/octet-stream'
]

export async function POST(request: NextRequest) {
  try {
    const session = await getServerStudentSession()
    if (!session || (!session.is_admin && !session.is_super_admin) || session.is_banned) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const contributor = await getContributorProfile(session.auth_id)
    if (!contributor) {
      return NextResponse.json(
        { success: false, error: 'Contributor profile not found. Please set up your profile first.' },
        { status: 400 }
      )
    }

    const formData = await request.formData()
    const title = (formData.get('title') as string) || ''
    const description = (formData.get('description') as string) || ''
    const subjectId = (formData.get('subjectId') as string) || ''
    const rawParentFolderId = (formData.get('parentFolderId') as string)?.trim()
    const file = formData.get('file') as File | null

    if (!title.trim()) {
      return NextResponse.json(
        { success: false, error: 'Summary title is required.' },
        { status: 400 }
      )
    }

    if (!file || typeof file.arrayBuffer !== 'function') {
      return NextResponse.json(
        { success: false, error: 'A summary document file is required.' },
        { status: 400 }
      )
    }

    // Size validation
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: `File exceeds maximum allowed size of 50 MB.` },
        { status: 400 }
      )
    }

    if (file.size <= 0) {
      return NextResponse.json(
        { success: false, error: 'Uploaded file is empty.' },
        { status: 400 }
      )
    }

    // Extension & MIME validation
    const fileName = file.name || 'document.pdf'
    const fileExt = fileName.split('.').pop()?.toLowerCase() || ''

    if (!ALLOWED_EXTENSIONS.includes(fileExt)) {
      return NextResponse.json(
        { success: false, error: `Unsupported file extension ".${fileExt}". Allowed formats: ${ALLOWED_EXTENSIONS.join(', ')}.` },
        { status: 400 }
      )
    }

    const fileMime = (file.type || '').toLowerCase()
    if (fileMime && !ALLOWED_MIME_TYPES.includes(fileMime)) {
      return NextResponse.json(
        { success: false, error: `Unsupported MIME type "${fileMime}".` },
        { status: 400 }
      )
    }

    // Subfolder authorization
    let validatedFolderId = contributor.drive_folder_id
    if (rawParentFolderId && rawParentFolderId !== 'root' && rawParentFolderId !== contributor.drive_folder_id) {
      const subfolders = await listContributorSubfolders(session.auth_id, contributor.drive_folder_id)
      const isAuthorizedSubfolder = subfolders.some(f => f.id === rawParentFolderId)
      if (!isAuthorizedSubfolder) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized folder ID. You can only upload into your own root folder or verified subfolders.' },
          { status: 403 }
        )
      }
      validatedFolderId = rawParentFolderId
    }

    // Upload to Google Drive
    const buffer = Buffer.from(await file.arrayBuffer())
    const driveMetadata = await uploadSummaryFileToDrive(session.auth_id, validatedFolderId, {
      name: fileName,
      mimeType: fileMime || 'application/pdf',
      buffer,
      size: file.size
    })

    // Insert metadata into Supabase
    const supabase = createAdminClient()
    const { data: summary, error } = await (supabase
      .from('summaries') as any)
      .insert({
        contributor_id: contributor.id,
        title: title.trim(),
        description: description.trim() || null,
        subject_id: subjectId.trim() || null,
        drive_file_id: driveMetadata.driveFileId,
        drive_folder_id: validatedFolderId,
        drive_url: driveMetadata.driveUrl,
        file_name: driveMetadata.fileName,
        file_type: driveMetadata.fileType,
        file_size: driveMetadata.fileSize,
        votes: 0,
        earned_coins: 0,
        status: 'published'
      })
      .select()
      .single()

    if (error || !summary) {
      return NextResponse.json(
        { success: false, error: `Failed to save summary record: ${error?.message}` },
        { status: 500 }
      )
    }

    revalidatePath('/summaries')
    revalidatePath('/summaries/contributor')

    return NextResponse.json({
      success: true,
      summary: {
        ...summary,
        votes: 0,
        earned_coins: 0,
        authorName: contributor.display_name,
        authorAvatar: contributor.avatar_url,
        authorUsername: contributor.username
      }
    })
  } catch (err: any) {
    console.error('Upload route error:', err)
    return NextResponse.json(
      { success: false, error: err.message || 'Internal upload error' },
      { status: 500 }
    )
  }
}
