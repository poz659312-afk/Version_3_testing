'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getServerStudentSession } from '@/lib/auth-server'
import { revalidatePath } from 'next/cache'
import { Contributor, Summary } from '@/lib/types'
import {
  createContributorRootFolder,
  createContributorSubfolder,
  listContributorSubfolders,
  uploadSummaryFileToDrive,
  deleteSummaryFileFromDrive
} from '@/lib/google-drive-contributor'

// ============================================================================
// CONSTANTS & SECURITY CONFIGURATION
// ============================================================================

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

// ============================================================================
// 1. CONTRIBUTOR PROFILE MANAGEMENT
// ============================================================================

/**
 * Get contributor profile for currently logged in admin or specified admin ID.
 */
export async function getContributorProfile(adminId?: string): Promise<Contributor | null> {
  const session = await getServerStudentSession()
  const targetAdminId = adminId || session?.auth_id

  if (!targetAdminId) return null

  const supabase = await createServerSupabaseClient()
  const { data, error } = await (supabase
    .from('contributors') as any)
    .select('*')
    .eq('admin_id', targetAdminId)
    .single()

  if (error || !data) return null

  // Fetch metrics (total summaries, total votes, total earned coins)
  const { data: summariesData } = await (supabase
    .from('summaries') as any)
    .select('votes, earned_coins')
    .eq('contributor_id', data.id)

  const validSummaries = (summariesData || []).filter(Boolean)
  const summaries_count = validSummaries.length
  const total_votes = validSummaries.reduce((acc: number, s: any) => acc + (s?.votes || 0), 0)
  const total_earned_coins = validSummaries.reduce((acc: number, s: any) => acc + (s?.earned_coins || 0), 0)

  return {
    ...data,
    summaries_count,
    total_votes,
    total_earned_coins
  }
}

/**
 * Creates a new Contributor Profile for an authenticated Admin.
 * Automatically creates a dedicated Google Drive root folder.
 */
export async function createContributorProfile(input: {
  displayName: string
  username: string
  bio?: string
  avatarUrl?: string
}): Promise<Contributor> {
  const session = await getServerStudentSession()
  if (!session || (!session.is_admin && !session.is_super_admin) || session.is_banned) {
    throw new Error('Unauthorized. Only Chameleon admins can create a Contributor Profile.')
  }

  const cleanDisplayName = input.displayName.trim()
  const cleanUsername = input.username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')

  if (!cleanDisplayName || !cleanUsername) {
    throw new Error('Display name and a valid username are required.')
  }

  const supabase = createAdminClient()

  // Verify that profile does not already exist for this admin
  const { data: existing } = await (supabase
    .from('contributors') as any)
    .select('id, username')
    .eq('admin_id', session.auth_id)
    .single()

  if (existing) {
    throw new Error('Contributor Profile already exists for your account.')
  }

  // Check username uniqueness
  const { data: userWithSameName } = await (supabase
    .from('contributors') as any)
    .select('id')
    .eq('username', cleanUsername)
    .single()

  if (userWithSameName) {
    throw new Error('This username is already taken. Please choose another.')
  }

  // Create Google Drive root folder for the contributor
  let driveFolderId: string
  try {
    driveFolderId = await createContributorRootFolder(session.auth_id, cleanDisplayName)
  } catch (driveErr) {
    console.error('Drive folder creation error:', driveErr)
    // If Drive fails, generate a fallback placeholder ID to allow completion
    driveFolderId = `contributor_folder_${session.auth_id.substring(0, 8)}`
  }

  const { data: newProfile, error } = await (supabase
    .from('contributors') as any)
    .insert({
      admin_id: session.auth_id,
      display_name: cleanDisplayName,
      username: cleanUsername,
      bio: input.bio?.trim() || null,
      avatar_url: input.avatarUrl || session.profile_image || null,
      drive_folder_id: driveFolderId
    })
    .select()
    .single()

  if (error || !newProfile) {
    throw new Error(`Failed to create Contributor Profile: ${error?.message || 'Database error'}`)
  }

  revalidatePath('/summaries')
  revalidatePath('/summaries/contributor')
  return newProfile as Contributor
}

/**
 * Updates contributor profile details.
 */
export async function updateContributorProfile(input: {
  displayName?: string
  bio?: string
  avatarUrl?: string
}): Promise<Contributor> {
  const session = await getServerStudentSession()
  if (!session || (!session.is_admin && !session.is_super_admin) || session.is_banned) {
    throw new Error('Unauthorized.')
  }

  const supabase = createAdminClient()
  const updates: any = {
    updated_at: new Date().toISOString()
  }

  if (input.displayName !== undefined) updates.display_name = input.displayName.trim()
  if (input.bio !== undefined) updates.bio = input.bio.trim()
  if (input.avatarUrl !== undefined) updates.avatar_url = input.avatarUrl

  const { data, error } = await (supabase
    .from('contributors') as any)
    .update(updates)
    .eq('admin_id', session.auth_id)
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Failed to update Contributor Profile: ${error?.message}`)
  }

  revalidatePath('/summaries')
  revalidatePath('/summaries/contributor')
  return data as Contributor
}

// ============================================================================
// 2. GOOGLE DRIVE SUBFOLDER ACTIONS
// ============================================================================

/**
 * List subfolders inside the authenticated contributor's root Drive folder.
 */
export async function getContributorSubfoldersAction(): Promise<Array<{ id: string; name: string }>> {
  const session = await getServerStudentSession()
  if (!session || (!session.is_admin && !session.is_super_admin)) {
    return []
  }

  const contributor = await getContributorProfile(session.auth_id)
  if (!contributor || !contributor.drive_folder_id) {
    return []
  }

  try {
    return await listContributorSubfolders(session.auth_id, contributor.drive_folder_id)
  } catch (err) {
    console.error('Error fetching contributor subfolders:', err)
    return []
  }
}

/**
 * Create a new subfolder inside the authenticated contributor's Drive folder.
 * Validates that parent folder belongs to the contributor.
 */
export async function createContributorSubfolderAction(folderName: string, parentFolderId?: string) {
  const session = await getServerStudentSession()
  if (!session || (!session.is_admin && !session.is_super_admin)) {
    throw new Error('Unauthorized.')
  }

  const contributor = await getContributorProfile(session.auth_id)
  if (!contributor) {
    throw new Error('Contributor Profile not found.')
  }

  let targetParent = contributor.drive_folder_id
  if (parentFolderId && parentFolderId.trim() && parentFolderId !== 'root' && parentFolderId !== contributor.drive_folder_id) {
    const subfolders = await listContributorSubfolders(session.auth_id, contributor.drive_folder_id)
    const isValidSubfolder = subfolders.some(f => f.id === parentFolderId)
    if (!isValidSubfolder) {
      throw new Error('Unauthorized folder. You can only create subfolders inside your own folder hierarchy.')
    }
    targetParent = parentFolderId
  }

  return await createContributorSubfolder(session.auth_id, targetParent, folderName)
}

/**
 * Delete a subfolder from Google Drive.
 * Reassigns any summaries in that subfolder back to the contributor's root folder.
 */
export async function deleteContributorSubfolderAction(subfolderId: string): Promise<{ success: boolean }> {
  const session = await getServerStudentSession()
  if (!session || (!session.is_admin && !session.is_super_admin)) {
    throw new Error('Unauthorized.')
  }

  const contributor = await getContributorProfile(session.auth_id)
  if (!contributor || !contributor.drive_folder_id) {
    throw new Error('Contributor Profile not found.')
  }

  if (subfolderId === contributor.drive_folder_id) {
    throw new Error('Root folder cannot be deleted.')
  }

  // Validate that this subfolder belongs to the contributor
  const subfolders = await listContributorSubfolders(session.auth_id, contributor.drive_folder_id)
  const isAuthorized = subfolders.some(f => f.id === subfolderId)
  if (!isAuthorized) {
    throw new Error('Unauthorized. Folder does not belong to your account.')
  }

  // 1. Move any summaries inside this subfolder to root folder in database
  const supabase = createAdminClient()
  await (supabase
    .from('summaries') as any)
    .update({ drive_folder_id: contributor.drive_folder_id })
    .eq('contributor_id', contributor.id)
    .eq('drive_folder_id', subfolderId)

  // 2. Delete the subfolder from Google Drive
  await deleteSummaryFileFromDrive(session.auth_id, subfolderId)

  revalidatePath('/summaries')
  revalidatePath('/summaries/contributor')
  return { success: true }
}

// ============================================================================
// 3. SUMMARY UPLOAD & MANAGEMENT ACTIONS
// ============================================================================

/**
 * Uploads a summary file to Google Drive and creates the metadata record in Supabase.
 * Enforces server-side 50MB file size limit, MIME/extension verification, and subfolder authorization.
 */
export async function uploadSummaryAction(formData: FormData): Promise<Summary> {
  const session = await getServerStudentSession()
  if (!session || (!session.is_admin && !session.is_super_admin) || session.is_banned) {
    throw new Error('Unauthorized. Admin access required.')
  }

  const contributor = await getContributorProfile(session.auth_id)
  if (!contributor) {
    throw new Error('You must set up your Contributor Profile before uploading summaries.')
  }

  const title = (formData.get('title') as string) || ''
  const description = (formData.get('description') as string) || ''
  const subjectId = (formData.get('subjectId') as string) || ''
  const rawParentFolderId = (formData.get('parentFolderId') as string)?.trim()
  const file = formData.get('file') as File | null

  if (!title.trim()) {
    throw new Error('Summary title is required.')
  }

  if (!file || typeof file.arrayBuffer !== 'function') {
    throw new Error('A summary document file is required.')
  }

  // --- Server-Side File Size Validation ---
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File exceeds maximum allowed size of 50 MB (Current: ${(file.size / (1024 * 1024)).toFixed(1)} MB).`)
  }

  if (file.size <= 0) {
    throw new Error('Uploaded file is empty.')
  }

  // --- Server-Side MIME Type and File Extension Validation ---
  const fileName = file.name || 'document.pdf'
  const fileExt = fileName.split('.').pop()?.toLowerCase() || ''

  if (!ALLOWED_EXTENSIONS.includes(fileExt)) {
    throw new Error(`Unsupported file extension ".${fileExt}". Allowed formats: ${ALLOWED_EXTENSIONS.join(', ')}.`)
  }

  const fileMime = (file.type || '').toLowerCase()
  if (fileMime && !ALLOWED_MIME_TYPES.includes(fileMime)) {
    throw new Error(`Unsupported file MIME type "${fileMime}". Allowed formats: PDF, Word (DOCX/DOC), PowerPoint (PPTX/PPT), TXT.`)
  }

  // --- Google Drive Subfolder Authorization Validation ---
  let validatedFolderId = contributor.drive_folder_id
  if (rawParentFolderId && rawParentFolderId !== 'root' && rawParentFolderId !== contributor.drive_folder_id) {
    const subfolders = await listContributorSubfolders(session.auth_id, contributor.drive_folder_id)
    const isAuthorizedSubfolder = subfolders.some(f => f.id === rawParentFolderId)
    if (!isAuthorizedSubfolder) {
      throw new Error('Unauthorized Google Drive folder. You can only upload files to your own root folder or verified subfolders.')
    }
    validatedFolderId = rawParentFolderId
  }

  // Upload file to Google Drive
  const buffer = Buffer.from(await file.arrayBuffer())
  let driveMetadata: {
    driveFileId: string
    driveUrl: string
    fileName: string
    fileType: string
    fileSize: number
  }

  try {
    driveMetadata = await uploadSummaryFileToDrive(session.auth_id, validatedFolderId, {
      name: fileName,
      mimeType: fileMime || 'application/pdf',
      buffer,
      size: file.size
    })
  } catch (driveError: any) {
    console.error('Google Drive upload failed:', driveError)
    throw new Error(`Google Drive upload failed: ${driveError?.message || 'Drive error'}`)
  }

  // Insert metadata into Supabase summaries table
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
    throw new Error(`Failed to save summary metadata: ${error?.message}`)
  }

  revalidatePath('/summaries')
  revalidatePath('/summaries/contributor')
  return {
    ...summary,
    votes: 0,
    earned_coins: 0,
    authorName: contributor.display_name,
    authorAvatar: contributor.avatar_url,
    authorUsername: contributor.username
  } as Summary
}

/**
 * Updates summary metadata (title, description, subject, status).
 */
export async function updateSummaryAction(
  summaryId: string,
  updates: {
    title?: string
    description?: string
    subjectId?: string
    status?: 'draft' | 'published' | 'archived'
  }
): Promise<Summary> {
  const session = await getServerStudentSession()
  if (!session || (!session.is_admin && !session.is_super_admin) || session.is_banned) {
    throw new Error('Unauthorized.')
  }

  const contributor = await getContributorProfile(session.auth_id)
  if (!contributor) {
    throw new Error('Contributor profile not found.')
  }

  const supabase = createAdminClient()

  // Verify ownership
  const { data: existing } = await (supabase
    .from('summaries') as any)
    .select('id, contributor_id')
    .eq('id', summaryId)
    .single()

  if (!existing || (existing as any).contributor_id !== contributor.id) {
    throw new Error('Summary not found or access denied.')
  }

  const updatePayload: any = {
    updated_at: new Date().toISOString()
  }
  if (updates.title !== undefined) updatePayload.title = updates.title.trim()
  if (updates.description !== undefined) updatePayload.description = updates.description.trim()
  if (updates.subjectId !== undefined) updatePayload.subject_id = updates.subjectId
  if (updates.status !== undefined) updatePayload.status = updates.status

  const { data, error } = await (supabase
    .from('summaries') as any)
    .update(updatePayload)
    .eq('id', summaryId)
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Failed to update summary: ${error?.message}`)
  }

  revalidatePath('/summaries')
  revalidatePath('/summaries/contributor')
  return data as Summary
}

/**
 * Deletes a summary record from Supabase AND deletes the file permanently from Google Drive.
 */
export async function deleteSummaryAction(summaryId: string): Promise<{ success: boolean }> {
  const session = await getServerStudentSession()
  if (!session || (!session.is_admin && !session.is_super_admin) || session.is_banned) {
    throw new Error('Unauthorized.')
  }

  const contributor = await getContributorProfile(session.auth_id)
  if (!contributor) {
    throw new Error('Contributor profile not found.')
  }

  const supabase = createAdminClient()

  // Verify ownership and get drive_file_id
  const { data: existing } = await (supabase
    .from('summaries') as any)
    .select('id, contributor_id, drive_file_id')
    .eq('id', summaryId)
    .single()

  if (!existing || (existing as any).contributor_id !== contributor.id) {
    throw new Error('Summary not found or access denied.')
  }

  // 1. Delete record from Supabase
  const { error } = await (supabase
    .from('summaries') as any)
    .delete()
    .eq('id', summaryId)

  if (error) {
    throw new Error(`Failed to delete summary: ${error.message}`)
  }

  // 2. Delete file permanently from Google Drive
  if (existing.drive_file_id) {
    try {
      await deleteSummaryFileFromDrive(session.auth_id, existing.drive_file_id)
    } catch (driveErr) {
      console.warn('Could not delete file from Google Drive:', driveErr)
    }
  }

  revalidatePath('/summaries')
  revalidatePath('/summaries/contributor')
  return { success: true }
}

// ============================================================================
// 4. ATOMIC SUPPORT / VOTING ACTION
// ============================================================================

/**
 * Supports a summary by spending 100 Chameleon Coins.
 * 60 Coins credited to the Contributor, 40 Coins retained by Chameleon.
 * Summary votes + 1, summary earned_coins + 60.
 * Server-side atomic execution with NO vote table or transaction table.
 */
export async function supportSummaryAction(summaryId: string): Promise<{
  success: boolean
  newBalance: number
  votes: number
  earnedCoins: number
}> {
  const session = await getServerStudentSession()
  if (!session || !session.auth_id) {
    throw new Error('You must be logged in to support summaries.')
  }

  if (session.is_banned) {
    throw new Error('Your account is restricted.')
  }

  const supabase = createAdminClient()

  // Call the atomic PostgreSQL RPC function with verified session.auth_id
  const { data: rpcResult, error } = await (supabase.rpc as any)('support_summary', {
    p_summary_id: summaryId,
    p_student_id: session.auth_id
  })

  if (error) {
    console.error('Support RPC Error:', error)
    throw new Error(error.message || 'Support transaction failed.')
  }

  const result = rpcResult as {
    success: boolean
    error?: string
    new_balance?: number
    votes?: number
    earned_coins?: number
  }

  if (!result || !result.success) {
    throw new Error(result?.error || 'Support operation could not be completed.')
  }

  revalidatePath('/summaries')
  return {
    success: true,
    newBalance: result.new_balance ?? 0,
    votes: result.votes ?? 0,
    earnedCoins: result.earned_coins ?? 0
  }
}

// ============================================================================
// 5. PUBLIC QUERIES & PROFILE DATA
// ============================================================================

/**
 * Fetch all published summaries with contributor details.
 * Simple ORDER BY votes DESC or created_at DESC with NO ranking algorithm.
 */
export async function getPublishedSummaries(filters?: {
  subjectId?: string
  contributorId?: string
  search?: string
  sortBy?: 'votes' | 'latest'
}): Promise<Summary[]> {
  const supabase = await createServerSupabaseClient()

  let query = (supabase
    .from('summaries') as any)
    .select(`
      id,
      contributor_id,
      title,
      description,
      subject_id,
      drive_file_id,
      drive_folder_id,
      drive_url,
      file_name,
      file_type,
      file_size,
      votes,
      earned_coins,
      status,
      created_at,
      updated_at,
      contributors (
        id,
        display_name,
        username,
        avatar_url
      )
    `)
    .eq('status', 'published')

  if (filters?.subjectId) {
    query = query.eq('subject_id', filters.subjectId)
  }

  if (filters?.contributorId) {
    query = query.eq('contributor_id', filters.contributorId)
  }

  if (filters?.sortBy === 'latest') {
    query = query.order('created_at', { ascending: false })
  } else {
    // Default to support count
    query = query.order('votes', { ascending: false })
  }

  const { data, error } = await query

  if (error || !data) {
    console.error('Error fetching published summaries:', error)
    return []
  }

  let result = (data as any[]).filter(Boolean).map((item: any) => ({
    ...item,
    votes: item.votes || 0,
    earned_coins: item.earned_coins || 0,
    contributor: item.contributors || null,
    authorName: item.contributors?.display_name || 'Anonymous Contributor',
    authorAvatar: item.contributors?.avatar_url || null,
    authorUsername: item.contributors?.username || ''
  }))

  if (filters?.search) {
    const s = filters.search.toLowerCase()
    result = result.filter(
      item =>
        item.title?.toLowerCase().includes(s) ||
        item.description?.toLowerCase().includes(s) ||
        item.authorName?.toLowerCase().includes(s) ||
        item.subject_id?.toLowerCase().includes(s)
    )
  }

  return result as Summary[]
}

/**
 * Fetch all summaries owned by the currently logged in contributor (including drafts).
 */
export async function getMyContributorSummaries(): Promise<Summary[]> {
  const session = await getServerStudentSession()
  if (!session || (!session.is_admin && !session.is_super_admin)) {
    return []
  }

  const contributor = await getContributorProfile(session.auth_id)
  if (!contributor) return []

  const supabase = createAdminClient()
  const { data, error } = await (supabase
    .from('summaries') as any)
    .select('*')
    .eq('contributor_id', contributor.id)
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return (data as any[]).filter(Boolean).map(s => ({
    ...s,
    votes: s?.votes || 0,
    earned_coins: s?.earned_coins || 0
  })) as Summary[]
}

/**
 * Public Contributor profile by username.
 */
export async function getContributorPublicProfile(username: string): Promise<{
  contributor: Contributor
  summaries: Summary[]
} | null> {
  const cleanUsername = username.trim().toLowerCase()
  const supabase = await createServerSupabaseClient()

  const { data: contributor, error } = await (supabase
    .from('contributors') as any)
    .select('id, display_name, username, bio, avatar_url, created_at, updated_at')
    .eq('username', cleanUsername)
    .single()

  if (error || !contributor) return null

  // Fetch public summaries for this contributor
  const { data: summariesData } = await (supabase
    .from('summaries') as any)
    .select('*')
    .eq('contributor_id', contributor.id)
    .eq('status', 'published')
    .order('votes', { ascending: false })

  const validSummaries = ((summariesData || []) as any[]).filter(Boolean)
  const summaries = validSummaries as Summary[]
  const total_votes = summaries.reduce((acc, s) => acc + (s?.votes || 0), 0)

  const fullContributor: Contributor = {
    ...contributor,
    admin_id: '', // Excluded for public privacy
    drive_folder_id: '', // Excluded for public privacy
    summaries_count: summaries.length,
    total_votes
  }

  return {
    contributor: fullContributor,
    summaries: summaries.map(s => ({
      ...s,
      votes: s?.votes || 0,
      earned_coins: s?.earned_coins || 0,
      authorName: fullContributor.display_name,
      authorAvatar: fullContributor.avatar_url,
      authorUsername: fullContributor.username
    }))
  }
}

// ============================================================================
// 6. LEGACY COMPATIBILITY STUBS (DEPRECATED)
// ============================================================================

/** @deprecated Legacy Word-like editor creation stub */
export async function createSummary(title: string, content: string, isPublished: boolean = false) {
  return { code: 'deprecated', title, isPublished }
}

/** @deprecated Legacy Word-like editor update stub */
export async function updateSummary(code: string, updates: any) {
  return { code, ...updates }
}

/** @deprecated Legacy image upload stub */
export async function uploadSummaryImage(base64Data: string, fileName: string): Promise<string> {
  return base64Data
}

/** @deprecated Legacy summary fetch stub */
export async function getSummary(code: string) {
  return null
}

/** @deprecated Legacy likes toggle stub */
export async function toggleLikeSummary(code: string) {
  return { liked: false, likesCount: 0 }
}

/** @deprecated Legacy admin summary list stub */
export async function getAllSummariesForAdmin() {
  return []
}

/** @deprecated Legacy delete summary stub */
export async function deleteSummary(code: string) {
  return { success: true }
}
