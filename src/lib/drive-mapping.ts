// lib/drive-mapping.ts

import * as crypto from 'crypto'
import { departmentData } from './department-data'

// Secret key for hashing (in production, move this to environment variables)
const HASH_SECRET = process.env.DRIVE_HASH_SECRET || 'XYZ123!@#_CHANGE_ME'

// Lazy-initialized maps — populated on first use, not at module load time
let _validDriveIds: Set<string> | null = null
let _validYouTubeIds: Set<string> | null = null
let _driveIdToHashMap: Map<string, string> | null = null
let _hashToDriveIdMap: Map<string, string> | null = null

// Lazy extraction — only runs when first accessed
function getValidDriveIds(): Set<string> {
  if (_validDriveIds) return _validDriveIds
  _validDriveIds = new Set<string>()
  
  for (const department of Object.values(departmentData)) {
    for (const level of Object.values((department as any).levels)) {
      // level = { subjects: { term1: [...], term2: [...] } }
      const subjects = (level as any).subjects || level
      for (const termOrGroup of Object.values(subjects as any)) {
        // termOrGroup could be the term array or another nested object
        const termArrays = Array.isArray(termOrGroup) ? [termOrGroup] : Object.values(termOrGroup as any)
        for (const arr of termArrays) {
          if (!Array.isArray(arr)) continue
          for (const subject of arr) {
            const materials = (subject as any).materials
            if (!materials) continue
            const materialFields = [materials.lectures, materials.sections, materials.summaries, materials.exams]

            if (materials.videos) {
              if (Array.isArray(materials.videos)) {
                materialFields.push(...materials.videos)
              } else {
                materialFields.push(materials.videos)
              }
            }

            for (const field of materialFields) {
              if (field && typeof field === 'string' && field.includes('drive.google.com/drive/folders/')) {
                const match = field.match(/\/folders\/([^/?]+)/)
                if (match && match[1]) {
                  _validDriveIds!.add(match[1])
                }
              }
            }
          }
        }
      }
    }
  }
  
  return _validDriveIds
}

function getValidYouTubeIds(): Set<string> {
  if (_validYouTubeIds) return _validYouTubeIds
  _validYouTubeIds = new Set<string>()
  
  for (const department of Object.values(departmentData)) {
    for (const level of Object.values((department as any).levels)) {
      const subjects = (level as any).subjects || level
      for (const termOrGroup of Object.values(subjects as any)) {
        const termArrays = Array.isArray(termOrGroup) ? [termOrGroup] : Object.values(termOrGroup as any)
        for (const arr of termArrays) {
          if (!Array.isArray(arr)) continue
          for (const subject of arr) {
            const materials = (subject as any).materials
            if (!materials) continue
            if (materials.videos) {
              const videos = Array.isArray(materials.videos) ? materials.videos : [materials.videos]
              for (const video of videos) {
                if (video && typeof video === 'string' && video.includes('youtube.com/playlist')) {
                  const match = video.match(/[?&]list=([^#\\&\\?]*)/)
                  if (match && match[1]) {
                    _validYouTubeIds!.add(match[1])
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  
  return _validYouTubeIds
}

// Simple hash function for basic obfuscation
function createSimpleHash(input: string): string {
  return crypto.createHash('md5').update(input + HASH_SECRET).digest('hex').substring(0, 12)
}

// Lazy-initialized hash maps
function ensureHashMaps() {
  if (_driveIdToHashMap) return
  _driveIdToHashMap = new Map<string, string>()
  _hashToDriveIdMap = new Map<string, string>()
  
  try {
    const validIds = getValidDriveIds()
    for (const driveId of Array.from(validIds)) {
      const hash = createSimpleHash(driveId)
      _driveIdToHashMap.set(driveId, hash)
      _hashToDriveIdMap!.set(hash, driveId)
    }
  } catch (e) {
    // crypto.createHash may not be available on client side
    console.warn('Hash map initialization failed (expected on client):', e)
  }
}

// Exported as getter to access the YouTube IDs set
export function getYouTubeWhitelist(): Set<string> {
  return getValidYouTubeIds()
}

// For backwards compat — lazy accessor
export const validYouTubeIds = {
  has: (id: string) => getValidYouTubeIds().has(id)
}

// Convert drive ID to hash
export function driveIdToHash(driveId: string): string | null {
  ensureHashMaps()
  return _driveIdToHashMap!.get(driveId) || null
}

// Convert hash back to drive ID
export function hashToDriveId(hash: string): string | null {
  ensureHashMaps()
  return _hashToDriveIdMap!.get(hash) || null
}

// Check if a string is a valid drive ID
export function isValidDriveId(id: string): boolean {
  return getValidDriveIds().has(id)
}

// Check if a string is a valid hash
export function isValidHash(hash: string): boolean {
  ensureHashMaps()
  return _hashToDriveIdMap!.has(hash)
}

// Check if a string is a valid YouTube playlist ID
export function isValidYouTubeId(id: string): boolean {
  return getValidYouTubeIds().has(id)
}

// Check if a URL is a valid drive or YouTube link
export function isValidLink(url: string): boolean {
  if (url.includes('drive.google.com/drive/folders/')) {
    const match = url.match(/\/folders\/([^/?]+)/)
    if (match && match[1]) {
      return isValidDriveId(match[1])
    }
  }
  
  if (url.includes('youtube.com/playlist')) {
    const match = url.match(/[?&]list=([^#\\&\\?]*)/)
    if (match && match[1]) {
      return isValidYouTubeId(match[1])
    }
  }
  
  return false
}

// Get the actual drive ID from URL parameter (could be hash or drive ID)
export function resolveActualDriveId(urlParam: string): string | null {
  // Check raw drive ID FIRST (no crypto needed)
  if (isValidDriveId(urlParam)) {
    return urlParam
  }
  
  // Then try hash resolution (needs crypto, may fail on client)
  try {
    if (isValidHash(urlParam)) {
      return hashToDriveId(urlParam)
    }
  } catch {
    // Hash resolution not available on client
  }
  
  return null
}

// For backwards compatibility with secure URLs
export function createSecureDriveUrl(driveId: string, folderPath?: string): string | null {
  const hash = driveIdToHash(driveId)
  if (!hash) return null
  
  let url = `/drive/${hash}`
  if (folderPath) {
    url += `/${folderPath}`
  }
  
  return url
}

// Generate a shareable URL with hashed drive ID
export function createShareableUrl(driveId: string, folderPath?: string): string | null {
  return createSecureDriveUrl(driveId, folderPath)
}
