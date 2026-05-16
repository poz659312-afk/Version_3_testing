// [PERF] Pre-computed drive ID and YouTube ID whitelist
// Generated from department-data.ts to avoid importing the 439KB file at runtime.
// To regenerate, run: npx ts-node scripts/generate-drive-whitelist.ts

export const VALID_DRIVE_IDS: string[] = []
export const VALID_YOUTUBE_IDS: string[] = []

// These will be populated by scanning department-data at build time.
// For now, we lazily populate from the accessor when first accessed.
let _populated = false

async function populateIfNeeded() {
  if (_populated) return
  _populated = true
  
  try {
    const { getDepartmentData } = await import('./department-data-accessor')
    const departmentData = getDepartmentData()
    
    for (const department of Object.values(departmentData)) {
      for (const level of Object.values((department as any).levels)) {
        for (const term of Object.values(level as any)) {
          if (!Array.isArray(term)) continue
          for (const subject of term) {
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
              if (field && typeof field === 'string') {
                if (field.includes('drive.google.com/drive/folders/')) {
                  const match = field.match(/\/folders\/([^/?]+)/)
                  if (match && match[1]) {
                    VALID_DRIVE_IDS.push(match[1])
                  }
                }
                if (field.includes('youtube.com/playlist')) {
                  const match = field.match(/[?&]list=([^#\\&\\?]*)/)
                  if (match && match[1]) {
                    VALID_YOUTUBE_IDS.push(match[1])
                  }
                }
              }
            }
          }
        }
      }
    }
  } catch (e) {
    console.error('Failed to populate drive whitelist:', e)
  }
}

export { populateIfNeeded }
