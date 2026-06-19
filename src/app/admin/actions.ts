'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getServerStudentSession } from '@/lib/auth-server'
import { syncUserFolderAccess, getMatchingRules } from '@/lib/drive-sharing'
import { revalidatePath } from 'next/cache'

/**
 * Validates that the active session belongs to a Super Admin.
 * Throws an error if unauthorized.
 */
async function checkSuperAdmin() {
  const session = await getServerStudentSession()
  if (!session || !session.is_super_admin || session.is_banned) {
    throw new Error('Unauthorized. Super Admin access required.')
  }
  return session
}

/**
 * Fetch users from chameleons table with pagination, search, sorting and filtering.
 */
export async function getAllUsers(params?: {
  page?: number
  pageSize?: number
  search?: string
  specialization?: string
  level?: string
}) {
  await checkSuperAdmin()
  const supabase = createAdminClient()

  const page = params?.page || 1
  const pageSize = params?.pageSize || 10
  const search = params?.search || ''
  const spec = params?.specialization || 'ALL'
  const level = params?.level || 'ALL'

  let query = supabase
    .from('chameleons')
    .select('auth_id, username, email, specialization, current_level, is_admin, is_super_admin, is_banned, created_at', { count: 'exact' })

  // Apply search (username or email matching search query)
  if (search) {
    query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%`)
  }

  // Apply specialization filter
  if (spec !== 'ALL') {
    query = query.eq('specialization', spec)
  }

  // Apply level filter
  if (level !== 'ALL') {
    query = query.eq('current_level', Number(level))
  }

  // Sort by created_at descending (newest users first)
  query = query.order('created_at', { ascending: false })

  // Pagination range
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching users:', error)
    throw new Error(`Failed to fetch users: ${error.message}`)
  }

  return {
    users: data || [],
    totalCount: count || 0
  }
}

/**
 * Private helper to log administrative actions to the database.
 */
async function logAdminActionToDb(
  adminAuthId: string,
  action: string,
  targetAuthId: string | null,
  details: any
) {
  try {
    const supabase = createAdminClient()

    // Fetch admin email/username
    const { data: adminUser } = await supabase
      .from('chameleons')
      .select('email, username')
      .eq('auth_id', adminAuthId)
      .single()

    // Fetch target user email/username if applicable
    let targetUser = null
    if (targetAuthId) {
      const { data } = await supabase
        .from('chameleons')
        .select('email, username')
        .eq('auth_id', targetAuthId)
        .single()
      targetUser = data
    }

    const logEntry = {
      admin_auth_id: adminAuthId,
      admin_email: adminUser?.email || 'unknown',
      admin_username: adminUser?.username || 'unknown',
      action,
      target_auth_id: targetAuthId,
      target_email: targetUser?.email || null,
      target_username: targetUser?.username || null,
      details
    }

    const { error } = await supabase
      .from('admin_audit_logs')
      .insert(logEntry)

    if (error) {
      console.error('Database failed to write audit log:', error)
    }
  } catch (err) {
    console.error('Audit logger failed:', err)
  }
}

/**
 * Preview folder access changes (grant/revoke) when changing user parameters.
 */
export async function previewFolderChanges(
  targetAuthId: string,
  newSpec: string | null,
  newLevel: number | null
) {
  await checkSuperAdmin()
  const supabase = createAdminClient()

  // 1. Fetch target user's current values
  const { data: user, error: userError } = await supabase
    .from('chameleons')
    .select('specialization, current_level')
    .eq('auth_id', targetAuthId)
    .single()

  if (userError || !user) {
    throw new Error('Target user not found')
  }

  // 2. Fetch all rules
  const { data: allRules, error: rulesError } = await supabase
    .from('drive_access_rules')
    .select('*')

  if (rulesError || !allRules) {
    return { foldersToGrant: [], foldersToRevoke: [] }
  }

  // 3. Compare rules matched before and after
  const oldMatched = getMatchingRules(user.specialization, user.current_level, allRules)
  const newMatched = getMatchingRules(newSpec, newLevel, allRules)

  const oldFolderIds = oldMatched.map(r => r.folder_id)
  const newFolderIds = newMatched.map(r => r.folder_id)

  const foldersToRevoke = oldMatched
    .filter(r => !newFolderIds.includes(r.folder_id))
    .map(r => ({ id: r.folder_id, name: r.folder_name }))

  const foldersToGrant = newMatched
    .filter(r => !oldFolderIds.includes(r.folder_id))
    .map(r => ({ id: r.folder_id, name: r.folder_name }))

  return { foldersToGrant, foldersToRevoke }
}

/**
 * Update a user's profiles, including their role, specialization, or level.
 * Performs Google Drive permission updates and database audit logging.
 */
export async function updateUserProfile(
  targetAuthId: string,
  updates: {
    is_admin?: boolean
    specialization?: string | null
    current_level?: number | null
  }
) {
  const admin = await checkSuperAdmin()
  const supabase = createAdminClient()

  // 1. Fetch current target user state
  const { data: targetUser, error: fetchError } = await supabase
    .from('chameleons')
    .select('username, email, is_admin, specialization, current_level')
    .eq('auth_id', targetAuthId)
    .single()

  if (fetchError || !targetUser) {
    return { success: false, error: 'Target user not found' }
  }

  const oldSpec = targetUser.specialization
  const oldLevel = targetUser.current_level
  const newSpec = updates.specialization !== undefined ? updates.specialization : oldSpec
  const newLevel = updates.current_level !== undefined ? updates.current_level : oldLevel

  let driveSyncResult = null

  // 2. Perform Drive permission changes if specialization/level changes
  if (
    targetUser.email &&
    (updates.specialization !== undefined || updates.current_level !== undefined) &&
    (oldSpec !== newSpec || oldLevel !== newLevel)
  ) {
    try {
      driveSyncResult = await syncUserFolderAccess(
        admin.auth_id,
        targetUser.email,
        oldSpec,
        oldLevel,
        newSpec,
        newLevel
      )
    } catch (err: any) {
      console.error('Google Drive permissions sync failed:', err)
      driveSyncResult = {
        success: false,
        granted: [],
        revoked: [],
        errors: [err.message || String(err)]
      }
    }
  }

  // 3. Update database profile
  const { error: updateError } = await supabase
    .from('chameleons')
    .update({
      is_admin: updates.is_admin !== undefined ? updates.is_admin : targetUser.is_admin,
      specialization: newSpec,
      current_level: newLevel
    })
    .eq('auth_id', targetAuthId)

  if (updateError) {
    return { success: false, error: `Failed to update user profile: ${updateError.message}` }
  }

  // 4. Log the action
  const changeDetails = {
    is_admin: { before: targetUser.is_admin, after: updates.is_admin !== undefined ? updates.is_admin : targetUser.is_admin },
    specialization: { before: oldSpec, after: newSpec },
    current_level: { before: oldLevel, after: newLevel },
    driveSync: driveSyncResult
  }

  await logAdminActionToDb(
    admin.auth_id,
    'UPDATE_USER_PROFILE',
    targetAuthId,
    changeDetails
  )

  revalidatePath('/admin')

  return {
    success: true,
    driveSyncResult
  }
}

/**
 * Access Rules CRUD
 */
export async function getAccessRules() {
  await checkSuperAdmin()
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('drive_access_rules')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch access rules: ${error.message}`)
  }

  return data || []
}

export async function createAccessRule(rule: {
  specialization: string | null
  current_level: number | null
  folderId: string
  folderName: string
}) {
  const admin = await checkSuperAdmin()
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('drive_access_rules')
    .insert({
      specialization: rule.specialization || null,
      current_level: rule.current_level || null,
      folder_id: rule.folderId,
      folder_name: rule.folderName
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: `Failed to create access rule: ${error.message}` }
  }

  await logAdminActionToDb(
    admin.auth_id,
    'CREATE_ACCESS_RULE',
    null,
    { rule: data }
  )

  revalidatePath('/admin')
  return { success: true, data }
}

export async function deleteAccessRule(id: string) {
  const admin = await checkSuperAdmin()
  const supabase = createAdminClient()

  // Fetch the rule first to log details
  const { data: rule } = await supabase
    .from('drive_access_rules')
    .select('*')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('drive_access_rules')
    .delete()
    .eq('id', id)

  if (error) {
    return { success: false, error: `Failed to delete access rule: ${error.message}` }
  }

  if (rule) {
    await logAdminActionToDb(
      admin.auth_id,
      'DELETE_ACCESS_RULE',
      null,
      { rule }
    )
  }

  revalidatePath('/admin')
  return { success: true }
}

/**
 * Fetch recent audit logs.
 */
export async function getAuditLogs() {
  await checkSuperAdmin()
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('admin_audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    throw new Error(`Failed to fetch audit logs: ${error.message}`)
  }

  return data || []
}
