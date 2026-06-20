// lib/drive-sharing.ts

import { google } from 'googleapis'
import { createAdminClient } from './supabase/admin'
import { getValidAccessToken } from './google-oauth'

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
    
    // Find the first admin with an active, authorized refresh token
    const { data: authorizedAdmins, error } = await (supabase
      .from('admins') as any)
      .select('auth_id, google_email')
      .eq('authorized', true)
      .not('refresh_token', 'is', null)
      .limit(1)

    if (error) {
      console.error('Error finding fallback admin:', error)
    }
    
    if (authorizedAdmins && authorizedAdmins.length > 0) {
      effectiveAuthId = authorizedAdmins[0].auth_id
      token = await getValidAccessToken(effectiveAuthId)
      console.log(`🛡️ Fallback: Using authorized admin ${authorizedAdmins[0].google_email} (${effectiveAuthId})`)
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
 * Grant read access (view-only) to a user's email for a specific folder.
 */
export async function grantFolderAccess(drive: any, folderId: string, email: string) {
  try {
    console.log(`Granting read permission on folder ${folderId} to ${email}`)
    const response = await drive.permissions.create({
      fileId: folderId,
      sendNotificationEmail: false, // Prevents email spam
      requestBody: {
        role: 'reader', // View-only access
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
    console.error(`Error revoking access from ${email} for folder ${folderId}:`, error)
    return { success: false, error: error.message || String(error) }
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
 * Sync Google Drive folder access when a user's specialization or level changes.
 * Grants access to new folders and revokes access to old folders.
 */
export async function syncUserFolderAccess(
  adminAuthId: string,
  userEmail: string,
  oldSpec: string | null,
  oldLevel: number | null,
  newSpec: string | null,
  newLevel: number | null
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
    
    // Get all current access rules
    const { data: allRules, error: rulesError } = await supabase
      .from('drive_access_rules')
      .select('*')

    if (rulesError) {
      throw new Error(`Failed to fetch access rules: ${rulesError.message}`)
    }

    if (!allRules || allRules.length === 0) {
      console.log('No access rules defined in the database.')
      return result // Nothing to sync
    }

    // Determine old folders and new folders
    const oldMatchedRules = getMatchingRules(oldSpec, oldLevel, allRules)
    const newMatchedRules = getMatchingRules(newSpec, newLevel, allRules)

    const oldFolderIds = oldMatchedRules.map(r => r.folder_id)
    const newFolderIds = newMatchedRules.map(r => r.folder_id)

    // Revoke folders: previously matched folders that are not matched now
    const folderIdsToRevoke = oldFolderIds.filter(id => !newFolderIds.includes(id))
    
    // Grant folders: newly matched folders that were not matched previously
    const folderIdsToGrant = newFolderIds.filter(id => !oldFolderIds.includes(id))

    if (folderIdsToRevoke.length === 0 && folderIdsToGrant.length === 0) {
      console.log('No folder access changes required.')
      return result
    }

    // Initialize Google Drive Client
    const drive = await getAdminDriveClient(adminAuthId)

    // Perform revocations
    for (const folderId of folderIdsToRevoke) {
      const rule = oldMatchedRules.find(r => r.folder_id === folderId)
      const folderName = rule ? rule.folder_name : folderId
      
      const revokeRes = await revokeFolderAccess(drive, folderId, userEmail)
      if (revokeRes.success) {
        result.revoked.push(folderName)
      } else {
        result.errors.push(`Failed to revoke access to "${folderName}": ${revokeRes.error}`)
      }
    }

    // Perform grants
    for (const folderId of folderIdsToGrant) {
      const rule = newMatchedRules.find(r => r.folder_id === folderId)
      const folderName = rule ? rule.folder_name : folderId
      
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
