import { google } from 'googleapis'
import { configureOAuthClientForUser } from './google-oauth'
import { Readable } from 'stream'
import { createClient } from '@/lib/supabase/client'

// Initialize Google Drive API
export async function getDriveClient(userId) {
  try {
    // For public folder access, use API key instead of OAuth
    const drive = google.drive({
      version: 'v3',
      auth: process.env.GOOGLE_DRIVE_API_KEY
    })
    
    return drive
  } catch (error) {
    console.error('Error creating Drive client:', error)
    throw new Error('Failed to initialize Google Drive client')
  }
}

// Create OAuth-enabled Drive client for write operations
export async function getOAuthDriveClient(userId) {
  try {
    // 🔧 ADMIN FIX: All admins use User 1's OAuth tokens (Drive owner)
    let effectiveUserId = userId
    
    // Check if this user is an admin and not User 1
    if (userId !== 1) {
      const supabase = createClient()
      
      const { data: user, error } = await supabase
        .from('chameleons')
        .select('is_admin, Authorized')
        .eq('user_id', userId)
        .single()
      
      // If user is admin and authorized, use User 1's tokens (Drive owner)
      if (!error && user?.is_admin && user?.Authorized) {
        console.log(`🛡️ Admin user ${userId} using Drive owner's OAuth tokens`)
        effectiveUserId = 1 // Use User 1's OAuth tokens
      }
    }
    
    const auth = await configureOAuthClientForUser(effectiveUserId)
    return google.drive({ version: 'v3', auth })
  } catch (error) {
    console.error('Error creating OAuth Drive client:', error)
    throw new Error('Failed to initialize OAuth Google Drive client')
  }
}

// List files in user's Google Drive
export async function listUserFiles(
  userId,
  pageSize = 10,
  pageToken,
  query
) {
  try {
    const drive = await getOAuthDriveClient(userId)
    
    const params = {
      pageSize,
      fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, thumbnailLink)',
      orderBy: 'modifiedTime desc',
      q: query || "trashed=false"
    }

    if (pageToken) {
      params.pageToken = pageToken
    }

    const response = await drive.files.list(params)
    return response.data
  } catch (error) {
    console.error('Error listing user files:', error)
    throw new Error('Failed to list files from Google Drive')
  }
}

// Upload file to user's Google Drive (requires OAuth authentication)
export async function uploadFileToUserDrive(
  userId,
  fileBuffer,
  fileName,
  mimeType,
  parentFolderId
) {
  try {
    // Use OAuth-enabled Drive client for write operations
    const drive = await getOAuthDriveClient(userId)
    
    const fileMetadata = {
      name: fileName,
      parents: parentFolderId ? [parentFolderId] : undefined
    }

    // إنشاء stream صالح للـ Google Drive API
    const bufferStream = new Readable()
    bufferStream.push(fileBuffer)
    bufferStream.push(null) // End the stream

    const media = {
      mimeType,
      body: bufferStream
    }

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: 'id, name, webViewLink'
    })

    return response.data
  } catch (error) {
    console.error('Error uploading file to Drive:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('No access token found')) {
      throw new Error('Google Drive authentication required. Please authorize your Google Drive access first.')
    }
    throw new Error('Failed to upload file to Google Drive')
  }
}

// Update file in user's Google Drive (rename)
export async function updateFileInUserDrive(
  userId,
  fileId,
  fileBuffer,
  fileName,
  mimeType
) {
  try {
    const drive = await getOAuthDriveClient(userId)
    
    const updateParams = {
      fileId,
      fields: 'id, name, webViewLink, modifiedTime',
      requestBody: fileName ? { name: fileName } : undefined,
      media: fileBuffer && mimeType ? {
        mimeType,
        body: fileBuffer
      } : undefined
    }

    const response = await drive.files.update(updateParams)
    return response.data
  } catch (error) {
    console.error('Error updating file in Drive:', error)
    if ((error).message?.includes('No access token found')) {
      throw new Error('Google Drive authentication required. Please authorize your Google Drive access first.')
    }
    throw new Error('Failed to update file in Google Drive')
  }
}

// Delete file from user's Google Drive
export async function deleteFileFromUserDrive(userId, fileId) {
  try {
    console.log(`🗑️ Attempting to delete file ${fileId} for user ${userId}`)
    
    const drive = await getOAuthDriveClient(userId)
    
    // First, try to get file metadata to check if it exists
    try {
      const fileInfo = await drive.files.get({
        fileId,
        fields: 'id, name, owners'
      })
      console.log(`📄 File exists: ${fileInfo.data.name}`)
    } catch (getError) {
      if (getError.code === 404) {
        throw new Error('File not found')
      }
      console.warn('Could not get file info, proceeding with delete:', getError.message)
    }
    
    // Attempt to delete the file
    await drive.files.delete({ fileId })
    
    console.log(`✅ File ${fileId} deleted successfully`)
    return { success: true, message: 'File deleted successfully', fileId }
    
  } catch (error) {
    console.error('Error deleting file from Drive:', error)
    
    // Handle specific Google Drive API errors
    if (error.code === 404) {
      throw new Error('File not found')
    }
    
    if (error.code === 403) {
      throw new Error('Permission denied')
    }
    
    if (error.code === 401) {
      throw new Error('Authentication required')
    }
    
    if (error.message?.includes('No access token found')) {
      throw new Error('Google Drive authentication required. Please authorize your Google Drive access first.')
    }
    
    // Generic error
    const errorMessage = error.message || 'Unknown error occurred'
    throw new Error(`Failed to delete file from Google Drive: ${errorMessage}`)
  }
}

// Get file metadata from user's Google Drive
export async function getFileMetadata(userId, fileId) {
  try {
    const drive = await getOAuthDriveClient(userId)
    
    const response = await drive.files.get({
      fileId,
      fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, thumbnailLink, parents'
    })

    return response.data
  } catch (error) {
    console.error('Error getting file metadata:', error)
    throw new Error('Failed to get file metadata from Google Drive')
  }
}

// Download file from user's Google Drive
export async function downloadFileFromDrive(userId, fileId) {
  try {
    const drive = await getOAuthDriveClient(userId)
    const response = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'arraybuffer' }
    )
    return Buffer.from(response.data)
  } catch (error) {
    console.error('Error downloading file from Drive:', error)
    throw new Error('Failed to download file from Google Drive')
  }
}

// Export Google Doc/Slide/Sheet as text/plain
export async function exportGoogleDocContent(userId, fileId, mimeType = 'text/plain') {
  try {
    const drive = await getOAuthDriveClient(userId)
    const response = await drive.files.export(
      { fileId, mimeType },
      { responseType: 'text' }
    )
    return response.data
  } catch (error) {
    console.error('Error exporting Google Doc:', error)
    throw new Error('Failed to export Google Doc content')
  }
}

// Legacy functions for backward compatibility
export async function uploadFileToDrive(file, parentId) {
  // This function needs user context - will throw error if called directly
  throw new Error('Please use uploadFileToUserDrive with userId parameter')
}

export async function deleteFileFromDrive(fileId) {
  // This function needs user context - will throw error if called directly  
  throw new Error('Please use deleteFileFromUserDrive with userId parameter')
}

export async function renameFileInDrive(fileId, newName) {
  // This function needs user context - will throw error if called directly
  throw new Error('Please use updateFileInUserDrive with userId parameter')
}

// All functions are already exported via the 'export' keyword at their definitions.
