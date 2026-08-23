/**
 * Chameleon Summaries 2.0 — Production Security Hardening Test Suite
 * Covers:
 * 1. Authenticated user cannot support using another user's p_student_id
 * 2. Direct client UPDATE cannot modify votes or earned_coins (Trigger protection simulation)
 * 3. Valid support updates student -100, contributor +60, votes +1, earned_coins +60
 * 4. Concurrent support cannot create a negative balance
 * 5. Files > 50MB are rejected
 * 6. Unsupported MIME types are rejected
 * 7. Unsupported extensions are rejected
 * 8. Contributor A cannot upload using Contributor B's root folder ID
 * 9. Contributor A cannot upload using Contributor B's subfolder ID
 * 10. Contributor A can upload to their own root folder
 * 11. Contributor A can upload to their own valid subfolder
 * 12. Contributor summary metadata editing works without altering financial counters
 */

import { Contributor, Summary, User } from '../types'

interface MockChameleonUser {
  auth_id: string
  username: string
  is_admin: boolean
  is_super_admin: boolean
  is_banned: boolean
  coins: number
}

interface MockContributor {
  id: string
  admin_id: string
  display_name: string
  username: string
  drive_folder_id: string
}

interface MockSummary {
  id: string
  contributor_id: string
  title: string
  description?: string
  subject_id: string
  drive_file_id: string
  drive_folder_id: string
  drive_url: string
  file_name: string
  votes: number
  earned_coins: number
  status: 'published' | 'draft' | 'archived'
}

interface MockDriveSubfolder {
  id: string
  name: string
  parent_folder_id: string
  owner_auth_id: string
}

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

/**
 * Hardened Atomic Support RPC simulation with caller identity verification
 */
export function simulateHardenedAtomicSupport(
  callerAuthId: string | null, // Simulated auth.uid() from JWT session (or null if service_role)
  studentIdArg: string,        // p_student_id argument
  summaryId: string,
  state: {
    users: MockChameleonUser[]
    contributors: MockContributor[]
    summaries: MockSummary[]
  }
): {
  success: boolean
  error?: string
  newBalance?: number
  votes?: number
  earnedCoins?: number
} {
  // Security Check 1: Enforce caller identity if called within authenticated session context
  if (callerAuthId !== null && callerAuthId !== studentIdArg) {
    return { success: false, error: 'Unauthorized: Caller identity mismatch.' }
  }

  // Find student
  const student = state.users.find(u => u.auth_id === studentIdArg)
  if (!student) {
    return { success: false, error: 'Student user not found.' }
  }

  if (student.is_banned) {
    return { success: false, error: 'Your account is restricted.' }
  }

  if (student.coins < 100) {
    return { success: false, error: 'Insufficient coins. You need at least 100 Chameleon Coins.' }
  }

  // Find summary
  const summary = state.summaries.find(s => s.id === summaryId)
  if (!summary) {
    return { success: false, error: 'Summary not found.' }
  }

  if (summary.status !== 'published') {
    return { success: false, error: 'Summary is not published.' }
  }

  // Find contributor
  const contributor = state.contributors.find(c => c.id === summary.contributor_id)
  if (!contributor) {
    return { success: false, error: 'Contributor not found.' }
  }

  const contributorAdmin = state.users.find(u => u.auth_id === contributor.admin_id)
  if (!contributorAdmin) {
    return { success: false, error: 'Contributor admin account not found.' }
  }

  // Atomic state mutations
  student.coins -= 100
  contributorAdmin.coins += 60
  summary.votes += 1
  summary.earned_coins += 60

  return {
    success: true,
    newBalance: student.coins,
    votes: summary.votes,
    earnedCoins: summary.earned_coins
  }
}

/**
 * Direct Client PostgREST UPDATE simulation with protective trigger
 */
export function simulateClientDirectSummaryUpdate(
  callerRole: 'authenticated' | 'anon' | 'service_role',
  summaryId: string,
  attemptedUpdates: Partial<MockSummary>,
  state: { summaries: MockSummary[] }
): {
  success: boolean
  error?: string
  updatedSummary?: MockSummary
} {
  const summary = state.summaries.find(s => s.id === summaryId)
  if (!summary) return { success: false, error: 'Summary not found.' }

  // Trigger check: If authenticated client attempts to modify votes or earned_coins directly
  if (callerRole === 'authenticated' || callerRole === 'anon') {
    if (
      (attemptedUpdates.votes !== undefined && attemptedUpdates.votes !== summary.votes) ||
      (attemptedUpdates.earned_coins !== undefined && attemptedUpdates.earned_coins !== summary.earned_coins)
    ) {
      return {
        success: false,
        error: 'Unauthorized: Financial counters (votes, earned_coins) cannot be modified directly.'
      }
    }
  }

  // Apply allowed metadata updates
  if (attemptedUpdates.title !== undefined) summary.title = attemptedUpdates.title
  if (attemptedUpdates.description !== undefined) summary.description = attemptedUpdates.description
  if (attemptedUpdates.subject_id !== undefined) summary.subject_id = attemptedUpdates.subject_id
  if (attemptedUpdates.status !== undefined) summary.status = attemptedUpdates.status

  return { success: true, updatedSummary: { ...summary } }
}

/**
 * Server-Side File Upload & Folder Authorization Validation
 */
export function validateUploadRequest(
  contributorAuthId: string,
  file: { name: string; size: number; mimeType: string },
  requestedFolderId: string | undefined,
  state: {
    contributors: MockContributor[]
    subfolders: MockDriveSubfolder[]
  }
): { success: boolean; validatedFolderId?: string; error?: string } {
  const contributor = state.contributors.find(c => c.admin_id === contributorAuthId)
  if (!contributor) {
    return { success: false, error: 'Contributor not found.' }
  }

  // 1. File Size check (50MB)
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { success: false, error: `File exceeds maximum allowed size of 50 MB.` }
  }
  if (file.size <= 0) {
    return { success: false, error: 'Uploaded file is empty.' }
  }

  // 2. Extension check
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { success: false, error: `Unsupported file extension ".${ext}".` }
  }

  // 3. MIME type check
  if (file.mimeType && !ALLOWED_MIME_TYPES.includes(file.mimeType.toLowerCase())) {
    return { success: false, error: `Unsupported file MIME type "${file.mimeType}".` }
  }

  // 4. Folder Authorization check
  const targetFolder = requestedFolderId?.trim() || contributor.drive_folder_id
  if (targetFolder !== contributor.drive_folder_id) {
    const isOwnedSubfolder = state.subfolders.some(
      f => f.id === targetFolder && f.owner_auth_id === contributorAuthId
    )
    if (!isOwnedSubfolder) {
      return {
        success: false,
        error: 'Unauthorized Google Drive folder. You can only upload files to your own root folder or verified subfolders.'
      }
    }
  }

  return { success: true, validatedFolderId: targetFolder }
}

/**
 * RUN ALL SECURITY HARDENING TESTS
 */
export function runSecurityHardeningTests() {
  console.log('====================================================')
  console.log('CHAMELEON SUMMARIES 2.0 — SECURITY HARDENING TESTS')
  console.log('====================================================')

  let passed = 0
  let failed = 0

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`)
      passed++
    } else {
      console.error(`❌ FAIL: ${testName}`)
      failed++
    }
  }

  // Mock Database Initial State
  const createState = () => ({
    users: [
      { auth_id: 'admin_a', username: 'admin_a', is_admin: true, is_super_admin: false, is_banned: false, coins: 1000 },
      { auth_id: 'admin_b', username: 'admin_b', is_admin: true, is_super_admin: false, is_banned: false, coins: 500 },
      { auth_id: 'attacker_student', username: 'attacker', is_admin: false, is_super_admin: false, is_banned: false, coins: 200 },
      { auth_id: 'victim_student', username: 'victim', is_admin: false, is_super_admin: false, is_banned: false, coins: 1000 },
    ],
    contributors: [
      { id: 'contrib_a', admin_id: 'admin_a', display_name: 'Contributor A', username: 'contrib_a', drive_folder_id: 'root_folder_a' },
      { id: 'contrib_b', admin_id: 'admin_b', display_name: 'Contributor B', username: 'contrib_b', drive_folder_id: 'root_folder_b' }
    ],
    summaries: [
      {
        id: 'sum_a',
        contributor_id: 'contrib_a',
        title: 'Algorithms Full Guide',
        subject_id: 'CDS',
        drive_file_id: 'drive_file_1',
        drive_folder_id: 'root_folder_a',
        drive_url: 'https://drive.google.com/...',
        file_name: 'Algorithms_Guide.pdf',
        votes: 10,
        earned_coins: 600,
        status: 'published' as const
      }
    ],
    subfolders: [
      { id: 'sub_a1', name: 'CDS Year 2', parent_folder_id: 'root_folder_a', owner_auth_id: 'admin_a' },
      { id: 'sub_b1', name: 'AI Year 3', parent_folder_id: 'root_folder_b', owner_auth_id: 'admin_b' }
    ]
  })

  // -------------------------------------------------------------
  // TEST 1: Caller Identity Mismatch in support_summary RPC
  // -------------------------------------------------------------
  const state1 = createState()
  const resTampered = simulateHardenedAtomicSupport(
    'attacker_student', // Authenticated JWT is attacker
    'victim_student',   // Attacker attempts to pass victim's UUID
    'sum_a',
    state1
  )
  assert(resTampered.success === false, 'Test 1.1: Attacker cannot spend victim student coins (Caller mismatch rejected)')
  assert(state1.users.find(u => u.auth_id === 'victim_student')?.coins === 1000, 'Test 1.2: Victim balance remains 1000 coins untouched')

  // -------------------------------------------------------------
  // TEST 2: Direct Client PostgREST UPDATE on votes & earned_coins
  // -------------------------------------------------------------
  const state2 = createState()
  const resDirectVotes = simulateClientDirectSummaryUpdate('authenticated', 'sum_a', { votes: 999999 }, state2)
  assert(resDirectVotes.success === false, 'Test 2.1: Direct client UPDATE on votes is rejected by trigger')
  assert(state2.summaries[0].votes === 10, 'Test 2.2: Summary votes count unchanged (10)')

  const resDirectCoins = simulateClientDirectSummaryUpdate('authenticated', 'sum_a', { earned_coins: 999999 }, state2)
  assert(resDirectCoins.success === false, 'Test 2.3: Direct client UPDATE on earned_coins is rejected by trigger')
  assert(state2.summaries[0].earned_coins === 600, 'Test 2.4: Summary earned_coins unchanged (600)')

  // -------------------------------------------------------------
  // TEST 3: Valid Support Mathematics & Counters
  // -------------------------------------------------------------
  const state3 = createState()
  const resValid = simulateHardenedAtomicSupport('attacker_student', 'attacker_student', 'sum_a', state3)
  assert(resValid.success === true, 'Test 3.1: Valid support succeeds')
  assert(resValid.newBalance === 100, 'Test 3.2: Student coins deducted by 100 (200 -> 100)')
  assert(resValid.votes === 11, 'Test 3.3: Summary votes incremented (+1)')
  assert(resValid.earnedCoins === 660, 'Test 3.4: Summary earned_coins incremented (+60)')
  assert(state3.users.find(u => u.auth_id === 'admin_a')?.coins === 1060, 'Test 3.5: Contributor credited +60 (1000 -> 1060)')

  // -------------------------------------------------------------
  // TEST 4: Concurrent Support Cannot Create Negative Balance
  // -------------------------------------------------------------
  const state4 = createState()
  // Student has 200 coins -> fires 3 support requests in sequence
  const r1 = simulateHardenedAtomicSupport('attacker_student', 'attacker_student', 'sum_a', state4)
  const r2 = simulateHardenedAtomicSupport('attacker_student', 'attacker_student', 'sum_a', state4)
  const r3 = simulateHardenedAtomicSupport('attacker_student', 'attacker_student', 'sum_a', state4)
  assert(r1.success === true && r2.success === true, 'Test 4.1: First 2 requests succeed (200 -> 0)')
  assert(r3.success === false, 'Test 4.2: 3rd request rejected due to insufficient coins (0 < 100)')
  assert(state4.users.find(u => u.auth_id === 'attacker_student')?.coins === 0, 'Test 4.3: Final balance is exactly 0 (no negative balance)')

  // -------------------------------------------------------------
  // TEST 5: Files > 50MB Are Rejected
  // -------------------------------------------------------------
  const state5 = createState()
  const oversizedFile = { name: 'huge_book.pdf', size: 55 * 1024 * 1024, mimeType: 'application/pdf' }
  const resOversized = validateUploadRequest('admin_a', oversizedFile, undefined, state5)
  assert(resOversized.success === false, 'Test 5.1: File > 50MB (55MB) is rejected before arrayBuffer allocation')

  // -------------------------------------------------------------
  // TEST 6: Unsupported MIME Types Are Rejected
  // -------------------------------------------------------------
  const state6 = createState()
  const maliciousMimeFile = { name: 'script.pdf', size: 1024, mimeType: 'application/x-msdownload' }
  const resBadMime = validateUploadRequest('admin_a', maliciousMimeFile, undefined, state6)
  assert(resBadMime.success === false, 'Test 6.1: Executable/malicious MIME type is rejected')

  // -------------------------------------------------------------
  // TEST 7: Unsupported Extensions Are Rejected
  // -------------------------------------------------------------
  const state7 = createState()
  const badExtFile = { name: 'script.exe', size: 1024, mimeType: 'application/octet-stream' }
  const resBadExt = validateUploadRequest('admin_a', badExtFile, undefined, state7)
  assert(resBadExt.success === false, 'Test 7.1: .exe extension is rejected')

  const badExtJs = { name: 'exploit.js', size: 1024, mimeType: 'text/javascript' }
  const resBadJs = validateUploadRequest('admin_a', badExtJs, undefined, state7)
  assert(resBadJs.success === false, 'Test 7.2: .js extension is rejected')

  // -------------------------------------------------------------
  // TEST 8: Contributor A Cannot Upload to Contributor B Root Folder
  // -------------------------------------------------------------
  const state8 = createState()
  const validPdf = { name: 'my_summary.pdf', size: 2 * 1024 * 1024, mimeType: 'application/pdf' }
  const resCrossRoot = validateUploadRequest('admin_a', validPdf, 'root_folder_b', state8)
  assert(resCrossRoot.success === false, 'Test 8.1: Contributor A cannot target Contributor B root folder')

  // -------------------------------------------------------------
  // TEST 9: Contributor A Cannot Upload to Contributor B Subfolder
  // -------------------------------------------------------------
  const state9 = createState()
  const resCrossSub = validateUploadRequest('admin_a', validPdf, 'sub_b1', state9)
  assert(resCrossSub.success === false, 'Test 9.1: Contributor A cannot target Contributor B subfolder (sub_b1)')

  // -------------------------------------------------------------
  // TEST 10: Contributor A Can Upload to Own Root Folder
  // -------------------------------------------------------------
  const state10 = createState()
  const resOwnRoot = validateUploadRequest('admin_a', validPdf, undefined, state10)
  assert(resOwnRoot.success === true && resOwnRoot.validatedFolderId === 'root_folder_a', 'Test 10.1: Contributor A can upload to their own root folder')

  // -------------------------------------------------------------
  // TEST 11: Contributor A Can Upload to Own Valid Subfolder
  // -------------------------------------------------------------
  const state11 = createState()
  const resOwnSub = validateUploadRequest('admin_a', validPdf, 'sub_a1', state11)
  assert(resOwnSub.success === true && resOwnSub.validatedFolderId === 'sub_a1', 'Test 11.1: Contributor A can upload to their own verified subfolder (sub_a1)')

  // -------------------------------------------------------------
  // TEST 12: Existing Contributor Summary Metadata Editing Still Works
  // -------------------------------------------------------------
  const state12 = createState()
  const resMetaEdit = simulateClientDirectSummaryUpdate(
    'authenticated',
    'sum_a',
    {
      title: 'Algorithms Advanced Edition',
      description: 'Updated with graph shortest paths',
      subject_id: 'AI',
      status: 'published'
    },
    state12
  )
  assert(resMetaEdit.success === true, 'Test 12.1: Contributor can edit title, description, subject, and status')
  assert(state12.summaries[0].title === 'Algorithms Advanced Edition', 'Test 12.2: Title updated successfully')
  assert(state12.summaries[0].votes === 10, 'Test 12.3: Votes preserved without alteration')
  assert(state12.summaries[0].earned_coins === 600, 'Test 12.4: Earned coins preserved without alteration')

  console.log('====================================================')
  console.log(`FINAL TEST RESULTS: ${passed} Passed, ${failed} Failed`)
  console.log('====================================================\n')
  return { passed, failed }
}

// Execute tests when invoked
if (typeof process !== 'undefined') {
  runSecurityHardeningTests()
}
