import { google } from 'googleapis'
import { getValidAccessToken } from './google-oauth'
import { getDriveClient as getServiceAccountDriveClient } from './google-service-account'
import { Readable } from 'stream'

/**
 * Gets an authenticated Google Drive client for the contributor/admin.
 * Uses admin's OAuth token if connected, or falls back to service account.
 */
export async function getContributorDriveClient(authId: string) {
  try {
    const accessToken = await getValidAccessToken(authId)
    if (accessToken) {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      )
      oauth2Client.setCredentials({ access_token: accessToken })
      return google.drive({ version: 'v3', auth: oauth2Client })
    }
  } catch (err) {
    console.warn('Could not get OAuth token for admin, attempting service account fallback:', err)
  }

  // Fallback to service account if available
  try {
    const serviceClient = await getServiceAccountDriveClient()
    if (serviceClient) return serviceClient
  } catch (saErr) {
    console.warn('Service account also unavailable:', saErr)
  }

  throw new Error('Google Drive credentials not available. Please connect Google Drive in Admin settings.')
}

/**
 * Creates the root Google Drive folder for a new Contributor Profile.
 */
export async function createContributorRootFolder(authId: string, contributorName: string): Promise<string> {
  const drive = await getContributorDriveClient(authId)

  const folderMetadata: any = {
    name: `Chameleon Summaries - ${contributorName.trim()}`,
    mimeType: 'application/vnd.google-apps.folder',
  }

  const response = await drive.files.create({
    requestBody: folderMetadata,
    fields: 'id, name, webViewLink',
    supportsAllDrives: true
  })

  const folderId = response.data.id
  if (!folderId) {
    throw new Error('Failed to retrieve created folder ID from Google Drive.')
  }

  // Set public view permissions so students can view summaries inside
  try {
    await drive.permissions.create({
      fileId: folderId,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      },
      supportsAllDrives: true
    })
  } catch (permError) {
    console.warn('Warning: Could not set public permission on root folder:', permError)
  }

  return folderId
}

/**
 * Creates a subfolder within the contributor's Google Drive folder hierarchy.
 */
export async function createContributorSubfolder(
  authId: string,
  parentFolderId: string,
  folderName: string
): Promise<{ id: string; name: string }> {
  const drive = await getContributorDriveClient(authId)

  const folderMetadata = {
    name: folderName.trim(),
    mimeType: 'application/vnd.google-apps.folder',
    parents: [parentFolderId]
  }

  const response = await drive.files.create({
    requestBody: folderMetadata,
    fields: 'id, name',
    supportsAllDrives: true
  })

  return {
    id: response.data.id || '',
    name: response.data.name || folderName
  }
}

/**
 * Lists subfolders belonging to a contributor's root folder.
 */
export async function listContributorSubfolders(
  authId: string,
  rootFolderId: string
): Promise<Array<{ id: string; name: string }>> {
  const drive = await getContributorDriveClient(authId)

  const query = `'${rootFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`

  const response = await drive.files.list({
    q: query,
    fields: 'files(id, name, createdTime)',
    orderBy: 'name asc',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true
  })

  return (response.data.files || []).map((f: any) => ({
    id: f.id || '',
    name: f.name || 'Untitled Folder'
  }))
}

/**
 * Uploads a summary document file to Google Drive and sets public read permissions.
 */
export async function uploadSummaryFileToDrive(
  authId: string,
  parentFolderId: string,
  file: {
    name: string
    mimeType: string
    buffer: Buffer
    size: number
  }
): Promise<{
  driveFileId: string
  driveUrl: string
  fileName: string
  fileType: string
  fileSize: number
}> {
  const drive = await getContributorDriveClient(authId)

  const fileMetadata: any = {
    name: file.name,
    parents: [parentFolderId]
  }

  const media = {
    mimeType: file.mimeType,
    body: Readable.from(file.buffer)
  }

  const response = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: 'id, name, size, mimeType, webViewLink, webContentLink',
    supportsAllDrives: true
  })

  const driveFileId = response.data.id
  if (!driveFileId) {
    throw new Error('Failed to upload file to Google Drive')
  }

  // Set file permission to public read
  try {
    await drive.permissions.create({
      fileId: driveFileId,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      },
      supportsAllDrives: true
    })
  } catch (permError) {
    console.warn('Warning: Could not set public permission on summary file:', permError)
  }

  const driveUrl = response.data.webViewLink || `https://drive.google.com/file/d/${driveFileId}/view`
  
  // Extract simple file type/extension
  const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf'

  return {
    driveFileId,
    driveUrl,
    fileName: response.data.name || file.name,
    fileType: ext,
    fileSize: Number(response.data.size) || file.size || 0
  }
}

/**
 * Deletes a summary file from Google Drive when removed by contributor.
 */
export async function deleteSummaryFileFromDrive(
  authId: string,
  driveFileId: string
): Promise<boolean> {
  if (!driveFileId) return true

  try {
    const drive = await getContributorDriveClient(authId)
    await drive.files.delete({
      fileId: driveFileId,
      supportsAllDrives: true
    })
    return true
  } catch (err) {
    console.warn(`Could not delete file ${driveFileId} from Google Drive:`, err)
    return false
  }
}
