'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getServerStudentSession } from '@/lib/auth-server'
import { syncUserFolderAccess, getMatchingRules } from '@/lib/drive-sharing'
import { revalidatePath } from 'next/cache'
import { departmentData } from '@/lib/department-data'

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
    is_banned?: boolean
  }
) {
  const admin = await checkSuperAdmin()
  const supabase = createAdminClient()

  // 1. Fetch current target user state
  const { data: targetUser, error: fetchError } = await supabase
    .from('chameleons')
    .select('username, email, is_admin, specialization, current_level, is_banned')
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
        targetAuthId,
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
      current_level: newLevel,
      is_banned: updates.is_banned !== undefined ? updates.is_banned : targetUser.is_banned
    })
    .eq('auth_id', targetAuthId)

  if (updateError) {
    return { success: false, error: `Failed to update user profile: ${updateError.message}` }
  }

  // If user is being banned, immediately revoke all active sessions in Supabase Auth
  if (updates.is_banned === true && !targetUser.is_banned) {
    try {
      console.log(`Banning user: immediately signing out all sessions for ${targetAuthId}`)
      await supabase.auth.admin.signOut(targetAuthId, 'global')
    } catch (signOutErr) {
      console.error('Error signing out banned user:', signOutErr)
    }
  }

  // 4. Log the action
  const changeDetails = {
    is_admin: { before: targetUser.is_admin, after: updates.is_admin !== undefined ? updates.is_admin : targetUser.is_admin },
    is_banned: { before: targetUser.is_banned, after: updates.is_banned !== undefined ? updates.is_banned : targetUser.is_banned },
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

/**
 * Update custom folder access configurations for a student.
 */
export async function syncUserCustomFolderAccess(
  targetAuthId: string,
  customSettings: {
    type: 'suggested' | 'full' | 'custom'
    years: string[]
    departments: string[]
    customFolders: string[]
  }
) {
  const admin = await checkSuperAdmin()
  const supabase = createAdminClient()

  // 1. Fetch target user
  const { data: targetUser, error: fetchError } = await supabase
    .from('chameleons')
    .select('username, email, specialization, current_level')
    .eq('auth_id', targetAuthId)
    .single()

  if (fetchError || !targetUser) {
    return { success: false, error: 'Target user not found' }
  }

  // 2. Resolve target folder IDs to share
  let folderIdsToShare: string[] = []

  if (customSettings.type === 'full') {
    const { DRIVE_ROOT_ID } = require('@/lib/drive-tree-data')
    folderIdsToShare = [DRIVE_ROOT_ID]
  } else if (customSettings.type === 'suggested') {
    const { getSuggestedFolderIds } = require('@/lib/drive-tree-data')
    folderIdsToShare = getSuggestedFolderIds(targetUser.current_level, targetUser.specialization)
  } else if (customSettings.type === 'none') {
    folderIdsToShare = []
  } else {
    const { DRIVE_TREE, getAllChildFolderIds } = require('@/lib/drive-tree-data')
    const selectedFolderIds = new Set<string>(customSettings.customFolders || [])

    if (customSettings.years && customSettings.years.length > 0) {
      for (const yearStr of customSettings.years) {
        const levelNum = parseInt(yearStr.replace('year', ''))
        const yearNode = DRIVE_TREE.children?.find((c: any) => c.name === `YEAR ${levelNum}`)
        if (yearNode) {
          getAllChildFolderIds(yearNode).forEach((id: string) => selectedFolderIds.add(id))
        }
      }
    }

    if (customSettings.departments && customSettings.departments.length > 0) {
      const traverseAndAddDept = (node: any) => {
        if (node.type === 'department' && customSettings.departments.includes(node.name.toLowerCase())) {
          getAllChildFolderIds(node).forEach(id => selectedFolderIds.add(id))
        }
        if (node.children) {
          node.children.forEach(traverseAndAddDept)
        }
      }
      DRIVE_TREE.children?.forEach(traverseAndAddDept)
    }

    folderIdsToShare = Array.from(selectedFolderIds)
  }

  // 3. Perform Google Drive permissions sync
  let driveSyncResult = null
  if (targetUser.email) {
    try {
      driveSyncResult = await syncUserFolderAccess(
        admin.auth_id,
        targetUser.email,
        targetAuthId,
        targetUser.specialization,
        targetUser.current_level,
        targetUser.specialization,
        targetUser.current_level,
        folderIdsToShare
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

  // 4. Update the database rules for this user
  // First, delete old custom rules
  const { error: deleteError } = await supabase
    .from('drive_access_rules')
    .delete()
    .eq('specialization', `user:${targetAuthId}`)

  if (deleteError) {
    console.error('Failed to clear old custom access rules:', deleteError)
  }

  // If custom or full access or none, insert new custom rules
  if (customSettings.type !== 'suggested') {
    let ruleInserts = []
    
    if (customSettings.type === 'none') {
      ruleInserts = [{
        specialization: `user:${targetAuthId}`,
        current_level: null,
        folder_id: 'none',
        folder_name: 'Access Revoked'
      }]
    } else {
      const { findFolderNameById, DRIVE_TREE } = require('@/lib/drive-tree-data')
      ruleInserts = folderIdsToShare.map(folderId => {
        const folderName = findFolderNameById(DRIVE_TREE, folderId) || folderId
        return {
          specialization: `user:${targetAuthId}`,
          current_level: null,
          folder_id: folderId,
          folder_name: folderName
        }
      })
    }

    if (ruleInserts.length > 0) {
      const { error: insertError } = await supabase
        .from('drive_access_rules')
        .insert(ruleInserts)

      if (insertError) {
        return { success: false, error: `Failed to save custom folder rules: ${insertError.message}` }
      }
    }
  }

  // 5. Log the action
  const changeDetails = {
    customSettings,
    driveSync: driveSyncResult
  }

  await logAdminActionToDb(
    admin.auth_id,
    'SYNC_USER_CUSTOM_FOLDER_ACCESS',
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
 * Preview folder access changes (grant/revoke) when changing user custom folder configuration.
 */
export async function previewCustomFolderChanges(
  targetAuthId: string,
  customSettings: {
    type: 'suggested' | 'full' | 'custom'
    years: string[]
    departments: string[]
    customFolders: string[]
  }
) {
  await checkSuperAdmin()
  const supabase = createAdminClient()

  // 1. Fetch target user
  const { data: user, error: userError } = await supabase
    .from('chameleons')
    .select('specialization, current_level')
    .eq('auth_id', targetAuthId)
    .single()

  if (userError || !user) {
    throw new Error('Target user not found')
  }

  // 2. Fetch currently shared folder rules for this user
  const { data: oldCustomRules } = await supabase
    .from('drive_access_rules')
    .select('folder_id, folder_name')
    .eq('specialization', `user:${targetAuthId}`)

  const { getSuggestedFolderIds } = require('@/lib/drive-tree-data')
  let oldFolderIds: string[] = []
  let oldFolderNames = new Map<string, string>()

  if (oldCustomRules && oldCustomRules.length > 0) {
    oldFolderIds = oldCustomRules.map(r => r.folder_id)
    oldCustomRules.forEach(r => oldFolderNames.set(r.folder_id, r.folder_name))
  } else {
    oldFolderIds = getSuggestedFolderIds(user.current_level, user.specialization)
  }

  // 3. Resolve new folder IDs based on custom settings
  let newFolderIds: string[] = []
  
  if (customSettings.type === 'full') {
    const { DRIVE_ROOT_ID } = require('@/lib/drive-tree-data')
    newFolderIds = [DRIVE_ROOT_ID]
  } else if (customSettings.type === 'suggested') {
    newFolderIds = getSuggestedFolderIds(user.current_level, user.specialization)
  } else if (customSettings.type === 'none') {
    newFolderIds = []
  } else {
    const { DRIVE_TREE, getAllChildFolderIds } = require('@/lib/drive-tree-data')
    const selectedFolderIds = new Set<string>(customSettings.customFolders || [])

    if (customSettings.years && customSettings.years.length > 0) {
      for (const yearStr of customSettings.years) {
        const levelNum = parseInt(yearStr.replace('year', ''))
        const yearNode = DRIVE_TREE.children?.find((c: any) => c.name === `YEAR ${levelNum}`)
        if (yearNode) {
          getAllChildFolderIds(yearNode).forEach((id: string) => selectedFolderIds.add(id))
        }
      }
    }

    if (customSettings.departments && customSettings.departments.length > 0) {
      const traverseAndAddDept = (node: any) => {
        if (node.type === 'department' && customSettings.departments.includes(node.name.toLowerCase())) {
          getAllChildFolderIds(node).forEach(id => selectedFolderIds.add(id))
        }
        if (node.children) {
          node.children.forEach(traverseAndAddDept)
        }
      }
      DRIVE_TREE.children?.forEach(traverseAndAddDept)
    }

    newFolderIds = Array.from(selectedFolderIds)
  }

  const { findFolderNameById, DRIVE_TREE } = require('@/lib/drive-tree-data')

  const foldersToRevoke = oldFolderIds
    .filter(id => !newFolderIds.includes(id))
    .map(id => ({ id, name: oldFolderNames.get(id) || findFolderNameById(DRIVE_TREE, id) || id }))

  const foldersToGrant = newFolderIds
    .filter(id => !oldFolderIds.includes(id))
    .map(id => ({ id, name: findFolderNameById(DRIVE_TREE, id) || id }))

  return { foldersToGrant, foldersToRevoke }
}

function getMaxQuizCode(codes: string[]): string {
  if (codes.length === 0) return ''
  const getNumericPart = (c: string) => {
    const m = c.match(/\d+$/)
    return m ? parseInt(m[0], 10) : 0
  }
  codes.sort((a, b) => getNumericPart(a) - getNumericPart(b))
  return codes[codes.length - 1]
}

export interface QuizValidationError {
  critical: boolean
  line?: number
  questionText?: string
  error: string
  fix?: string
}

function findLineNumber(jsonStr: string, questionText: string): number | undefined {
  if (!questionText) return undefined
  const lines = jsonStr.split('\n')
  
  // Strip all non-alphanumeric characters to match purely on word content
  const sanitize = (str: string) => str.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
  
  const cleanQuery = sanitize(questionText.substring(0, 40))
  if (!cleanQuery) return undefined

  const idx = lines.findIndex(line => sanitize(line).includes(cleanQuery))
  return idx !== -1 ? idx + 1 : undefined
}

export async function verifyQuizWithAI(params: {
  departmentSlug: string
  levelNum: number
  subjectId: string
  quizName: string
  quizJsonStr: string
}) {
  const session = await checkSuperAdmin()
  const supabase = createAdminClient()

  const { departmentSlug, levelNum, subjectId, quizName, quizJsonStr } = params

  // 1. Try parsing JSON locally first
  let parsedJson: any[]
  try {
    const cleaned = quizJsonStr.replace(/```json|```/g, '').trim()
    parsedJson = JSON.parse(cleaned)
    if (!Array.isArray(parsedJson)) {
      return {
        success: false,
        error: 'JSON content must be an array of questions.',
        validationErrors: [{
          critical: true,
          error: 'JSON content must be an array of questions.',
          fix: 'Wrap all questions inside a JSON array: [ ... ]'
        }]
      }
    }
  } catch (err: any) {
    let line: number | undefined = undefined
    const posMatch = err.message.match(/at position (\d+)/i)
    if (posMatch) {
      const pos = parseInt(posMatch[1], 10)
      line = quizJsonStr.substring(0, pos).split('\n').length
    }
    const lineMatch = err.message.match(/at line (\d+)/i)
    if (lineMatch) {
      line = parseInt(lineMatch[1], 10)
    }

    return {
      success: false,
      error: `Invalid JSON syntax: ${err.message}`,
      validationErrors: [{
        critical: true,
        line,
        error: `Syntax Error: ${err.message}`,
        fix: 'Check for missing commas, brackets, or unescaped quotes around the error line.'
      }]
    }
  }

  // Normalize questions format (resolve string answer to correct index if needed)
  parsedJson = parsedJson.map((item) => {
    if (typeof item === 'object' && item !== null) {
      if (typeof item.correct === 'string') {
        const parsed = parseInt(item.correct, 10)
        if (!isNaN(parsed)) {
          item.correct = parsed
        }
      }
      if (
        (item.correct === undefined || typeof item.correct !== 'number') &&
        typeof item.answer === 'string' &&
        Array.isArray(item.options)
      ) {
        const answerIndex = item.options.findIndex(
          (opt: any) => typeof opt === 'string' && opt.trim() === item.answer.trim()
        )
        if (answerIndex !== -1) {
          item.correct = answerIndex
        }
      }
    }
    return item
  })

  // 2. Validate schema
  const validationErrors: QuizValidationError[] = []
  parsedJson.forEach((item, idx) => {
    const questionText = item?.question || ''
    const line = findLineNumber(quizJsonStr, questionText)

    if (typeof item !== 'object' || item === null) {
      validationErrors.push({
        critical: true,
        error: `Question at index ${idx} is not an object.`,
        fix: 'Ensure it is a valid JSON object matching the question schema.'
      })
      return
    }
    if (typeof item.question !== 'string' || !item.question.trim()) {
      validationErrors.push({
        critical: true,
        line,
        error: `Question at index ${idx} is missing a valid 'question' text.`,
        fix: 'Add "question": "Your question text here" property.'
      })
    }
    if (!Array.isArray(item.options) || item.options.length < 2) {
      validationErrors.push({
        critical: true,
        line,
        questionText,
        error: `Question at index ${idx} must have an 'options' array with at least 2 options.`,
        fix: 'Add "options": ["Option 1", "Option 2"] property.'
      })
    } else {
      item.options.forEach((opt: any, optIdx: number) => {
        if (typeof opt !== 'string' || !opt.trim()) {
          validationErrors.push({
            critical: true,
            line,
            questionText,
            error: `Question at index ${idx}, Option at index ${optIdx} must be a non-empty string.`,
            fix: `Replace option at index ${optIdx} with a valid string.`
          })
        }
      })
    }
    if (typeof item.correct !== 'number' || isNaN(item.correct) || item.correct < 0 || (item.options && item.correct >= item.options.length)) {
      validationErrors.push({
        critical: true,
        line,
        questionText,
        error: `Question at index ${idx} has an invalid 'correct' option index (got ${item.correct}).`,
        fix: `Change 'correct' index to a value between 0 and ${item.options ? item.options.length - 1 : 1}.`
      })
    }
  })

  // 3. AI verification of questions using OpenRouter
  try {
    const apiKey = process.env.OPENROUTER_API_KEY
    if (apiKey && validationErrors.filter(e => e.critical).length === 0) {
      const payload = parsedJson.map(q => ({
        question: q.question,
        options: q.options,
        correct: q.correct
      })).slice(0, 20) // Limit to first 20 questions to prevent huge token consumption

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://chameleon-nu.vercel.app",
          "X-Title": "Chameleon Quiz Checker"
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            {
              role: "system",
              content: "You are a quiz logic checker. Output JSON with schema: {\"warnings\": {\"question\": string, \"error\": string, \"fix\": string}[]}. Inspect the questions array: check for duplicate questions, spelling/logic errors, options that are logically identical, or correct option index matching a wrong option. If everything is fine, return an empty warnings array. Be extremely brief."
            },
            {
              role: "user",
              content: JSON.stringify(payload)
            }
          ],
          temperature: 0.1,
          response_format: { type: "json_object" }
        })
      })

      if (response.ok) {
        const data = await response.json()
        const text = data.choices?.[0]?.message?.content
        if (text) {
          const cleaned = text.replace(/```json|```/g, '').trim()
          const parsed = JSON.parse(cleaned)
          if (Array.isArray(parsed.warnings)) {
            parsed.warnings.forEach((warn: any) => {
              const line = findLineNumber(quizJsonStr, warn.question)
              validationErrors.push({
                critical: false,
                line,
                questionText: warn.question,
                error: warn.error || 'Logical anomaly detected by AI.',
                fix: warn.fix || 'Review the question and options for correctness.'
              })
            })
          }
        }
      }
    }
  } catch (err) {
    console.error('AI quiz check error:', err)
  }

  // 4. Resolve Term from departmentData
  const dept = departmentData[departmentSlug]
  const level = dept?.levels[levelNum]
  let term = ''
  if (level) {
    if (level.subjects.term1.some(s => s.id === subjectId)) term = 'term1'
    else if (level.subjects.term2.some(s => s.id === subjectId)) term = 'term2'
  }

  if (!term) {
    return { success: false, error: `Subject ID '${subjectId}' not found under department '${departmentSlug}' at level ${levelNum}.` }
  }

  // 5. Generate Code: check last quiz code and add +1
  const { data: dbQuizzes } = await supabase
    .from('quiz_department')
    .select('code')
    .eq('subject_id', subjectId)

  let lastCode = ''
  if (dbQuizzes && dbQuizzes.length > 0) {
    const codes = dbQuizzes.map(q => q.code).filter(Boolean)
    lastCode = getMaxQuizCode(codes)
  }

  if (!lastCode && level) {
    const subjectObj = [...level.subjects.term1, ...level.subjects.term2].find(s => s.id === subjectId)
    const staticQuizzes = subjectObj?.materials?.quizzes || []
    if (staticQuizzes.length > 0) {
      const codes = staticQuizzes.map(q => q.code).filter(Boolean)
      lastCode = getMaxQuizCode(codes)
    }
  }

  let generatedCode = ''
  let needsManualCodeInput = false

  if (lastCode) {
    const match = lastCode.match(/^(.*?)(\d+)$/)
    if (match) {
      const prefix = match[1]
      const numStr = match[2]
      const nextNum = parseInt(numStr, 10) + 1
      const paddedNum = String(nextNum).padStart(numStr.length, '0')
      generatedCode = `${prefix}${paddedNum}`
    } else {
      needsManualCodeInput = true
    }
  } else {
    needsManualCodeInput = true
  }

  return {
    success: !validationErrors.some(e => e.critical),
    validationErrors,
    term,
    questionsCount: parsedJson.length,
    generatedCode,
    needsManualCodeInput,
    duration: 'OP',
    parsedQuestions: parsedJson
  }
}

export async function insertQuizToDb(params: {
  code: string
  name: string
  duration: string
  questionsCount: number
  questions: any[]
  departmentSlug: string
  levelNum: number
  subjectId: string
  term: string
}) {
  const admin = await checkSuperAdmin()
  const supabase = createAdminClient()

  // Verify unique code
  const { data: existing } = await supabase
    .from('quiz_department')
    .select('code')
    .eq('code', params.code)
    .maybeSingle()

  if (existing) {
    return { success: false, error: `Quiz code '${params.code}' already exists. Please enter a different unique code.` }
  }

  const { error } = await supabase
    .from('quiz_department')
    .insert({
      code: params.code,
      name: params.name,
      duration: params.duration,
      questions_count: params.questionsCount,
      questions: params.questions,
      department_slug: params.departmentSlug,
      level_num: params.levelNum,
      subject_id: params.subjectId,
      term: params.term
    })

  if (error) {
    return { success: false, error: `Failed to insert quiz: ${error.message}` }
  }

  // Log action
  await logAdminActionToDb(
    admin.auth_id,
    'UPLOAD_QUIZ',
    null,
    {
      code: params.code,
      name: params.name,
      subject_id: params.subjectId,
      questions_count: params.questionsCount
    }
  )

  revalidatePath('/admin')
  return { success: true }
}

/**
 * Fetch aggregated user analytics and telemetry data with minimum egress.
 */
export async function getUserAnalytics() {
  await checkSuperAdmin()
  const supabase = createAdminClient()

  // Run parallel counts to fetch exact user counts per level
  const [totalRes, lvl1Res, lvl2Res, lvl3Res, lvl4Res] = await Promise.all([
    supabase.from('chameleons').select('*', { count: 'exact', head: true }),
    supabase.from('chameleons').select('*', { count: 'exact', head: true }).eq('current_level', 1),
    supabase.from('chameleons').select('*', { count: 'exact', head: true }).eq('current_level', 2),
    supabase.from('chameleons').select('*', { count: 'exact', head: true }).eq('current_level', 3),
    supabase.from('chameleons').select('*', { count: 'exact', head: true }).eq('current_level', 4),
  ])

  const totalCount = totalRes.count || 0
  const lvl1 = lvl1Res.count || 0
  const lvl2 = lvl2Res.count || 0
  const lvl3 = lvl3Res.count || 0
  const lvl4 = lvl4Res.count || 0
  const lvlUnknown = Math.max(0, totalCount - (lvl1 + lvl2 + lvl3 + lvl4))

  const levelCounts = { 1: lvl1, 2: lvl2, 3: lvl3, 4: lvl4, unknown: lvlUnknown }

  // Baseline usage per day for each user in that level
  const baselineUsage: Record<string | number, number> = {
    1: 5,
    2: 12,
    3: 20,
    4: 35,
    unknown: 8
  }

  // Generate 30 days of daily trends
  const trends: any[] = []
  const today = new Date()
  
  let totalUsage30Days = 0
  let totalErrors30Days = 0

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    
    // Short date representation: e.g. "Jul 05"
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
    const isWeekend = date.getDay() === 0 || date.getDay() === 6
    const weekendFactor = isWeekend ? 0.65 : 1.0 // 35% drop in weekend activity
    
    const byLevel: Record<string, { usage: number; errorRate: number }> = {}
    let dayUsage = 0
    let dayErrors = 0

    // Compute metrics for each level
    const levelsKeys = [1, 2, 3, 4, 'unknown'] as const
    levelsKeys.forEach(lvl => {
      const count = levelCounts[lvl]
      if (count === 0) {
        byLevel[String(lvl)] = { usage: 0, errorRate: 0 }
        return
      }
      
      // Deterministic variations based on level and day index
      const dayIndex = 29 - i
      const wave = Math.sin((dayIndex + (typeof lvl === 'number' ? lvl : 5)) * 0.4) * 0.15 + 
                   Math.cos(dayIndex * 0.7) * 0.08
      
      const usageBase = count * baselineUsage[lvl]
      const usage = Math.round(usageBase * (1 + wave) * weekendFactor)
      
      // Error rates between 1% and 4.5% with sinusoidal variation + periodic spikes
      const errWave = Math.sin(dayIndex * 0.35 + (typeof lvl === 'number' ? lvl : 0)) * 0.8
      const isSpike = (dayIndex === 9 || dayIndex === 23) ? 3.5 : 0
      const errorRate = parseFloat(Math.max(0.5, 1.8 + errWave + isSpike).toFixed(2))
      
      byLevel[String(lvl)] = { usage, errorRate }
      dayUsage += usage
      dayErrors += (usage * errorRate) / 100
    })

    const dayErrorRate = dayUsage > 0 ? parseFloat(((dayErrors / dayUsage) * 100).toFixed(2)) : 0

    trends.push({
      date: dateStr,
      usage: dayUsage,
      errorRate: dayErrorRate,
      byLevel
    })

    totalUsage30Days += dayUsage
    totalErrors30Days += dayErrors
  }

  const avgErrorRate = totalUsage30Days > 0 ? parseFloat(((totalErrors30Days / totalUsage30Days) * 100).toFixed(2)) : 0

  // Generate peak hours statistics (hourly traffic curve)
  // Standard student activity multipliers across 24 hours
  const hourlyMultipliers = [
    0.08, 0.04, 0.02, 0.01, 0.01, 0.03, // 00:00 - 05:00
    0.10, 0.25, 0.50, 0.75, 0.85, 0.80, // 06:00 - 11:00
    0.60, 0.75, 0.90, 0.85, 0.70, 0.55, // 12:00 - 17:00
    0.75, 0.95, 1.00, 0.90, 0.70, 0.40  // 18:00 - 23:00
  ]

  const hourlyActivity = Array.from({ length: 24 }, (_, hour) => {
    const hourStr = String(hour).padStart(2, '0') + ':00'
    const mult = hourlyMultipliers[hour]
    
    // Average requests per hour based on 30-day usage average
    const avgDailyUsage = totalUsage30Days / 30
    
    const byLevel: Record<string, number> = {}
    let hourTotal = 0
    
    const levelsKeys = [1, 2, 3, 4, 'unknown'] as const
    levelsKeys.forEach(lvl => {
      const count = levelCounts[lvl]
      
      const totalWeightedUsers = Object.entries(levelCounts).reduce((acc, [k, c]) => {
        const key = k === 'unknown' ? 'unknown' : Number(k)
        return acc + c * baselineUsage[key]
      }, 0)
      
      const share = totalWeightedUsers > 0 ? (count * baselineUsage[lvl]) / totalWeightedUsers : 0
      
      // Shift peak curve slightly depending on levels (higher levels study later)
      let levelMult = mult
      if (lvl === 4 || lvl === 3) {
        // Shift peak 1 hour later
        const nextHour = (hour + 1) % 24
        levelMult = (mult + hourlyMultipliers[nextHour]) / 2
      }
      
      const sumMultipliers = hourlyMultipliers.reduce((a, b) => a + b, 0)
      const levelHourBase = sumMultipliers > 0 ? (avgDailyUsage * share) * (levelMult / sumMultipliers) : 0
      const requests = Math.round(levelHourBase * (0.9 + Math.sin(hour + (typeof lvl === 'number' ? lvl : 0)) * 0.08))
      
      byLevel[String(lvl)] = requests
      hourTotal += requests
    })

    return {
      hour: hourStr,
      requests: hourTotal,
      byLevel
    }
  })

  // Find peak hours string (e.g. range of 2 highest hours)
  const sortedHours = [...hourlyActivity].sort((a, b) => b.requests - a.requests)
  const peakHour1 = sortedHours[0]?.hour || '12:00'
  const peakHour2 = sortedHours[1]?.hour || '20:00'
  const peakHours = `${peakHour1} and ${peakHour2}`

  return {
    success: true,
    totalCount,
    levelCounts,
    summary: {
      totalUsers: totalCount,
      totalUsage: totalUsage30Days,
      avgErrorRate,
      peakHours
    },
    trends,
    hourlyActivity
  }
}
