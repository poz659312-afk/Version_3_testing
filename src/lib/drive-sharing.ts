// lib/drive-sharing.ts

import { google } from 'googleapis'
import { createAdminClient } from './supabase/admin'
import { getValidAccessToken } from './google-oauth'
import { getSuggestedFolderIds, DRIVE_ROOT_ID, findFolderNameById, DRIVE_TREE } from './drive-tree-data'

/**
 * Get an authenticated Google Drive client.
 * Tries the current admin first; falls back to the first available authorized admin.
 */
export async function getAdminDriveClient(adminAuthId: string) {
  let token = await getValidAccessToken(adminAuthId)
  let effectiveAuthId = adminAuthId
  
  if (!token) {
    console.log(`⚠️ Admin ${adminAuthId} does not have valid tokens. Searching for fallback...`)
    const supabase = createAdminClient()
    
    // Find all admins with active, authorized refresh tokens
    const { data: authorizedAdmins, error } = await (supabase
      .from('admins') as any)
      .select('auth_id, google_email')
      .eq('authorized', true)
      .not('refresh_token', 'is', null)

    if (error) {
      console.error('Error finding fallback admin:', error)
    }
    
    if (authorizedAdmins && authorizedAdmins.length > 0) {
      for (const admin of authorizedAdmins) {
        const fallbackToken = await getValidAccessToken(admin.auth_id)
        if (fallbackToken) {
          token = fallbackToken
          effectiveAuthId = admin.auth_id
          console.log(`🛡️ Fallback: Using authorized admin ${admin.google_email} (${effectiveAuthId})`)
          break
        } else {
          console.log(`⚠️ Fallback admin ${admin.google_email} token check failed, trying next...`)
        }
      }
    }
  }

  if (!token) {
    throw new Error('No authorized admin Google Drive tokens found. Please authorize your Google Drive access in the admin panel.')
  }

  const sanitizeRedirectUri = (uri: string | undefined): string | undefined => {
    if (!uri) return uri
    return uri.replace(/(www\.)?chameleon-nu\.tech/g, 'chameleon-nu.vercel.app')
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    sanitizeRedirectUri(process.env.GOOGLE_REDIRECT_URI)
  )
  oauth2Client.setCredentials({ access_token: token })

  return google.drive({ version: 'v3', auth: oauth2Client })
}

/**
 * Grant editor access to a user's email for a specific folder.
 */
export async function grantFolderAccess(drive: any, folderId: string, email: string) {
  try {
    console.log(`Granting editor permission on folder ${folderId} to ${email}`)
    const response = await drive.permissions.create({
      fileId: folderId,
      sendNotificationEmail: false, // Prevents email spam
      requestBody: {
        role: 'writer', // Editor access
        type: 'user',
        emailAddress: email
      },
      supportsAllDrives: true
    })
    return { success: true, permissionId: response.data.id }
  } catch (error: any) {
    console.error(`Error granting access to ${email} for folder ${folderId}:`, error)
    // Google Drive returns 400 if user email is not a valid Google account, or if already exists
    return { success: false, error: error.message || String(error) }
  }
}

/**
 * Revoke access to a user's email from a specific folder.
 */
export async function revokeFolderAccess(drive: any, folderId: string, email: string) {
  try {
    console.log(`Revoking permission on folder ${folderId} from ${email}`)
    
    // 1. List current permissions on the folder to find the matching permissionId
    const response = await drive.permissions.list({
      fileId: folderId,
      fields: 'permissions(id, emailAddress)',
      supportsAllDrives: true
    })

    const permissions = response.data.permissions || []
    const permission = permissions.find(
      (p: any) => p.emailAddress?.toLowerCase() === email.toLowerCase()
    )

    if (permission?.id) {
      // 2. Delete the permission
      await drive.permissions.delete({
        fileId: folderId,
        permissionId: permission.id,
        supportsAllDrives: true
      })
      console.log(`✅ Revoked permission ID ${permission.id} for ${email} on folder ${folderId}`)
      return { success: true }
    } else {
      console.log(`ℹ️ No permission found for ${email} on folder ${folderId}`)
      return { success: true, message: 'No permission found to revoke' }
    }
  } catch (error: any) {
    const errorMsg = error.message || String(error)
    if (errorMsg.includes('cannot delete the permission') || errorMsg.includes('permission is inherited')) {
      console.log(`ℹ️ Permission for ${email} on folder ${folderId} is inherited. Skipping deletion.`)
      return { success: true, message: 'Permission is inherited' }
    }
    console.error(`Error revoking access from ${email} for folder ${folderId}:`, error)
    return { success: false, error: errorMsg }
  }
}

/**
 * Filter access rules matching a given specialization and current_level
 */
export function getMatchingRules(specialization: string | null, level: number | null, allRules: any[]) {
  return allRules.filter(rule => {
    // If rule specifies a specialization, it must match the user's specialization
    const specMatches = !rule.specialization || (specialization && rule.specialization.toLowerCase() === specialization.toLowerCase());
    
    // If rule specifies a level, it must match the user's level
    const levelMatches = !rule.current_level || (level && Number(rule.current_level) === Number(level));
    
    // A rule must have at least one criteria to prevent matching everyone
    const hasCriteria = !!rule.specialization || !!rule.current_level;

    return specMatches && levelMatches && hasCriteria;
  })
}

/**
 * Retrieve the folder IDs this user is authorized to browse.
 * If user has user-specific custom rules (stored as "user:<authId>" in specialization column), use those.
 * Otherwise, return suggested folders based on their current_level and specialization.
 */
export async function getUserAllowedFolderIds(authId: string): Promise<string[]> {
  const supabase = createAdminClient()
  
  // 1. Fetch user profile
  const { data: user } = await (supabase
    .from('chameleons') as any)
    .select('specialization, current_level, is_admin, is_super_admin')
    .eq('auth_id', authId)
    .single()
    
  if (!user) return []
  
  // Admins always have access to the main root folder, or all files
  if (user.is_admin || user.is_super_admin) {
    return [DRIVE_ROOT_ID]
  }

  // 2. Fetch custom rules for this specific user
  const { data: customRules } = await (supabase
    .from('drive_access_rules') as any)
    .select('folder_id')
    .eq('specialization', `user:${authId}`)

  if (customRules && customRules.length > 0) {
    return customRules.map((r: any) => r.folder_id)
  }

  // 3. Otherwise return suggested access folders
  return getSuggestedFolderIds(user.current_level, user.specialization)
}

/**
 * Sync Google Drive folder access when a user's access configuration changes.
 * Grants access to new folders and revokes access to old folders.
 */
export async function syncUserFolderAccess(
  adminAuthId: string,
  userEmail: string,
  targetAuthId: string,
  oldSpec: string | null,
  oldLevel: number | null,
  newSpec: string | null,
  newLevel: number | null,
  newCustomFolderIds?: string[]
): Promise<{
  success: boolean
  granted: string[]
  revoked: string[]
  errors: string[]
}> {
  const result = {
    success: true,
    granted: [] as string[],
    revoked: [] as string[],
    errors: [] as string[]
  }

  if (!userEmail) {
    result.success = false
    result.errors.push('User email is required to sync folder access.')
    return result
  }

  try {
    const supabase = createAdminClient()
    
    // 1. Determine old folders that were shared with this user
    // First, check if they had user-specific custom rules in the DB
    const { data: oldCustomRules } = await (supabase
      .from('drive_access_rules') as any)
      .select('folder_id, folder_name')
      .eq('specialization', `user:${targetAuthId}`)

    let oldFolderIds: string[] = []
    let oldFoldersMap = new Map<string, string>()

    if (oldCustomRules && oldCustomRules.length > 0) {
      oldFolderIds = oldCustomRules.map((r: any) => r.folder_id)
      oldCustomRules.forEach((r: any) => oldFoldersMap.set(r.folder_id, r.folder_name))
    } else {
      // Otherwise, they had suggested folders based on oldSpec and oldLevel
      const oldSuggestedIds = getSuggestedFolderIds(oldLevel, oldSpec)
      oldFolderIds = oldSuggestedIds
    }

    // 2. Determine new folder IDs they should have access to
    let newFolderIds: string[] = []
    if (newCustomFolderIds) {
      newFolderIds = newCustomFolderIds
    } else {
      newFolderIds = getSuggestedFolderIds(newLevel, newSpec)
    }

    // Revoke folders: previously shared folder IDs that are not in new list
    const folderIdsToRevoke = oldFolderIds.filter(id => !newFolderIds.includes(id))
    
    // Grant folders: new folder IDs that are not in old list
    const folderIdsToGrant = newFolderIds.filter(id => !oldFolderIds.includes(id))

    if (folderIdsToRevoke.length === 0 && folderIdsToGrant.length === 0) {
      console.log('No folder access changes required.')
      return result
    }

    // Initialize Google Drive Client
    const drive = await getAdminDriveClient(adminAuthId)

    // Perform revocations
    for (const folderId of folderIdsToRevoke) {
      const folderName = oldFoldersMap.get(folderId) || findFolderNameById(DRIVE_TREE, folderId) || folderId
      
      const revokeRes = await revokeFolderAccess(drive, folderId, userEmail)
      if (revokeRes.success) {
        result.revoked.push(folderName)
      } else {
        result.errors.push(`Failed to revoke access to "${folderName}": ${revokeRes.error}`)
      }
    }

    // Perform grants
    for (const folderId of folderIdsToGrant) {
      const folderName = findFolderNameById(DRIVE_TREE, folderId) || folderId
      
      const grantRes = await grantFolderAccess(drive, folderId, userEmail)
      if (grantRes.success) {
        result.granted.push(folderName)
      } else {
        result.errors.push(`Failed to grant access to "${folderName}": ${grantRes.error}`)
      }
    }

    if (result.errors.length > 0) {
      result.success = false
    }

  } catch (error: any) {
    console.error('Error syncing user folder access:', error)
    result.success = false
    result.errors.push(error.message || String(error))
  }

  return result
}
