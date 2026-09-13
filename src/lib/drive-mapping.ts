// lib/drive-mapping.ts

import * as crypto from 'crypto'
import { departmentData } from './department-data'

import { FACULTY_ELECTIVE_COURSES, DEPARTMENT_PROGRAM_ELECTIVES } from './electives-data'
import { DRIVE_TREE } from './drive-tree-data'
import driveLiveLinks from './drive-live-links.json'

// Secret key for hashing (in production, move this to environment variables)
const HASH_SECRET = process.env.DRIVE_HASH_SECRET || 'XYZ123!@#_CHANGE_ME'

// Lazy-initialized maps — populated on first use, not at module load time
let _validDriveIds: Set<string> | null = null
let _validYouTubeIds: Set<string> | null = null
let _driveIdToHashMap: Map<string, string> | null = null
let _hashToDriveIdMap: Map<string, string> | null = null
let _driveIdToSubjectMap: Map<string, string> | null = null

function extractFromMaterials(materials: any, subjectName: string | undefined, driveIds: Set<string>, youTubeIds: Set<string>, driveToSubject?: Map<string, string>) {
  if (!materials) return
  const materialFields = [
    materials.lectures,
    materials.sections,
    materials.summaries,
    materials.exams
  ]

  if (materials.videos) {
    if (Array.isArray(materials.videos)) {
      materialFields.push(...materials.videos)
    } else {
      materialFields.push(materials.videos)
    }
  }

  for (const field of materialFields) {
    if (field && typeof field === 'string') {
      let id: string | null = null
      if (field.includes('drive.google.com/drive/folders/')) {
        const match = field.match(/\/folders\/([^/?]+)/)
        if (match && match[1]) id = match[1]
      } else if (field.includes('drive.google.com/file/d/')) {
        const match = field.match(/\/file\/d\/([^/?]+)/)
        if (match && match[1]) id = match[1]
      } else if (field.includes('id=')) {
        const match = field.match(/[?&]id=([^&]+)/)
        if (match && match[1]) id = match[1]
      }

      if (id) {
        driveIds.add(id)
        if (driveToSubject && subjectName) {
          driveToSubject.set(id, subjectName)
        }
      }

      if (field.includes('youtube.com/playlist')) {
        const match = field.match(/[?&]list=([^#\\&\\?]*)/)
        if (match && match[1]) youTubeIds.add(match[1])
      }
    }
  }
}

function extractFromTree(node: any, driveIds: Set<string>) {
  if (!node) return
  if (node.id) driveIds.add(node.id)
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      extractFromTree(child, driveIds)
    }
  }
}

function extractFromAnyJson(obj: any, driveIds: Set<string>) {
  if (!obj) return
  if (typeof obj === 'string') {
    const match = obj.match(/\/folders\/([^/?]+)/)
    if (match && match[1]) driveIds.add(match[1])
  } else if (typeof obj === 'object') {
    for (const val of Object.values(obj)) {
      extractFromAnyJson(val, driveIds)
    }
  }
}

function populateSets() {
  if (_validDriveIds && _validYouTubeIds && _driveIdToSubjectMap) return
  _validDriveIds = new Set<string>()
  _validYouTubeIds = new Set<string>()
  _driveIdToSubjectMap = new Map<string, string>()

  // 1. Department data levels & electives
  for (const department of Object.values(departmentData)) {
    if ((department as any).levels) {
      for (const level of Object.values((department as any).levels)) {
        const subjects = (level as any).subjects || level
        for (const termOrGroup of Object.values(subjects as any)) {
          const termArrays = Array.isArray(termOrGroup) ? [termOrGroup] : Object.values(termOrGroup as any)
          for (const arr of termArrays) {
            if (!Array.isArray(arr)) continue
            for (const subject of arr) {
              extractFromMaterials((subject as any)?.materials, (subject as any)?.name, _validDriveIds, _validYouTubeIds, _driveIdToSubjectMap)
            }
          }
        }
      }
    }
    if (Array.isArray((department as any).facultyElectives)) {
      for (const sub of (department as any).facultyElectives) {
        extractFromMaterials(sub?.materials, sub?.name, _validDriveIds, _validYouTubeIds, _driveIdToSubjectMap)
      }
    }
    if (Array.isArray((department as any).programElectives)) {
      for (const sub of (department as any).programElectives) {
        extractFromMaterials(sub?.materials, sub?.name, _validDriveIds, _validYouTubeIds, _driveIdToSubjectMap)
      }
    }
  }

  // 2. Faculty Electives courses
  if (Array.isArray(FACULTY_ELECTIVE_COURSES)) {
    for (const course of FACULTY_ELECTIVE_COURSES) {
      extractFromMaterials(course?.materials, course?.name, _validDriveIds, _validYouTubeIds, _driveIdToSubjectMap)
    }
  }

  // 3. Department Program Electives
  if (DEPARTMENT_PROGRAM_ELECTIVES && typeof DEPARTMENT_PROGRAM_ELECTIVES === 'object') {
    for (const list of Object.values(DEPARTMENT_PROGRAM_ELECTIVES)) {
      if (Array.isArray(list)) {
        for (const course of list) {
          extractFromMaterials(course?.materials, course?.name, _validDriveIds, _validYouTubeIds, _driveIdToSubjectMap)
        }
      }
    }
  }

  // 4. Drive Tree
  extractFromTree(DRIVE_TREE, _validDriveIds)

  // 5. Drive live links crawler json with subject mapping
  const liveLinks = driveLiveLinks as any
  if (liveLinks) {
    if (liveLinks.facultyElectives) {
      for (const [cName, subs] of Object.entries(liveLinks.facultyElectives)) {
        for (const url of Object.values(subs as Record<string, string>)) {
          const match = typeof url === 'string' && url.match(/\/folders\/([^/?]+)/)
          if (match && match[1]) {
            _validDriveIds.add(match[1])
            _driveIdToSubjectMap.set(match[1], cName)
          }
        }
      }
    }
    if (liveLinks.programElectives) {
      for (const [dept, courses] of Object.entries(liveLinks.programElectives)) {
        for (const [cName, subs] of Object.entries(courses as Record<string, any>)) {
          for (const url of Object.values(subs as Record<string, string>)) {
            const match = typeof url === 'string' && url.match(/\/folders\/([^/?]+)/)
            if (match && match[1]) {
              _validDriveIds.add(match[1])
              _driveIdToSubjectMap.set(match[1], cName)
            }
          }
        }
      }
    }
    if (liveLinks.departmentCourses) {
      for (const [cName, subs] of Object.entries(liveLinks.departmentCourses)) {
        for (const url of Object.values(subs as Record<string, string>)) {
          const match = typeof url === 'string' && url.match(/\/folders\/([^/?]+)/)
          if (match && match[1]) {
            _validDriveIds.add(match[1])
            _driveIdToSubjectMap.set(match[1], cName)
          }
        }
      }
    }
  }
}

// Lazy extraction — only runs when first accessed
function getValidDriveIds(): Set<string> {
  populateSets()
  return _validDriveIds!
}

function getValidYouTubeIds(): Set<string> {
  populateSets()
  return _validYouTubeIds!
}

// Look up subject name associated with a Drive folder ID
export function getSubjectNameByDriveId(driveId: string): string | null {
  if (!driveId) return null
  populateSets()
  if (_driveIdToSubjectMap?.has(driveId)) {
    return _driveIdToSubjectMap.get(driveId)!
  }
  const resolved = resolveActualDriveId(driveId)
  if (resolved && _driveIdToSubjectMap?.has(resolved)) {
    return _driveIdToSubjectMap.get(resolved)!
  }
  return null
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
