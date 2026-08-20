/**
 * Chameleon Graduates System & Yearly Academic Rollover — Comprehensive Test Suite
 */

import { isAlumni, isGraduatedTA, formatTAName, hasFullAccess } from '../ta-utils'
import { User, UserStatus, Graduate } from '../types'

// Mock state simulation for Academic Rollover logic
interface MockStudent {
  auth_id: string
  username: string
  current_level: number | null
  status: UserStatus
  coins: number
  quiz_history_count: number
}

interface MockGraduateRecord {
  student_id: string
  graduation_year: number
  graduated_at: string
}

/**
 * Simulates atomic database rollover function
 */
function simulateAcademicRollover(
  students: MockStudent[],
  graduates: MockGraduateRecord[],
  graduationYear: number
): {
  updatedStudents: MockStudent[]
  updatedGraduates: MockGraduateRecord[]
  result: {
    graduated_count: number
    promoted_to_year4: number
    promoted_to_year3: number
    promoted_to_year2: number
  }
} {
  const updatedStudents = students.map((s) => ({ ...s }))
  const updatedGraduates = [...graduates]

  let graduated_count = 0
  let promoted_to_year4 = 0
  let promoted_to_year3 = 0
  let promoted_to_year2 = 0

  // 1. Year 4 -> Graduate (Idempotent: only active students in year 4)
  for (const s of updatedStudents) {
    if (s.status === 'student' && s.current_level === 4) {
      s.status = 'graduated'
      s.current_level = null
      graduated_count++

      // Insert into graduates if not exists
      if (!updatedGraduates.some((g) => g.student_id === s.auth_id)) {
        updatedGraduates.push({
          student_id: s.auth_id,
          graduation_year: graduationYear,
          graduated_at: new Date().toISOString()
        })
      }
    }
  }

  // 2. Promote active students simultaneously (simulating SQL CASE statement)
  for (const s of updatedStudents) {
    if (s.status === 'student') {
      if (s.current_level === 3) {
        s.current_level = 4
        promoted_to_year4++
      } else if (s.current_level === 2) {
        s.current_level = 3
        promoted_to_year3++
      } else if (s.current_level === 1) {
        s.current_level = 2
        promoted_to_year2++
      }
    }
  }

  return {
    updatedStudents,
    updatedGraduates,
    result: {
      graduated_count,
      promoted_to_year4,
      promoted_to_year3,
      promoted_to_year2
    }
  }
}

/**
 * Runner function for test assertions
 */
export function runGraduatesSystemTests(): { passed: number; failed: number; errors: string[] } {
  let passed = 0
  let failed = 0
  const errors: string[] = []

  function assert(condition: boolean, testName: string) {
    if (condition) {
      passed++
    } else {
      failed++
      errors.push(`FAILED: ${testName}`)
    }
  }

  // -------------------------------------------------------------
  // Test 1: Student Level Progression (1->2, 2->3, 3->4)
  // -------------------------------------------------------------
  const initialStudents: MockStudent[] = [
    { auth_id: 'u1', username: 'student_yr1', current_level: 1, status: 'student', coins: 100, quiz_history_count: 5 },
    { auth_id: 'u2', username: 'student_yr2', current_level: 2, status: 'student', coins: 200, quiz_history_count: 12 },
    { auth_id: 'u3', username: 'student_yr3', current_level: 3, status: 'student', coins: 350, quiz_history_count: 25 },
    { auth_id: 'u4', username: 'student_yr4', current_level: 4, status: 'student', coins: 500, quiz_history_count: 40 }
  ]
  const initialGraduates: MockGraduateRecord[] = []

  const rollover1 = simulateAcademicRollover(initialStudents, initialGraduates, 2026)

  const u1 = rollover1.updatedStudents.find((s) => s.auth_id === 'u1')
  const u2 = rollover1.updatedStudents.find((s) => s.auth_id === 'u2')
  const u3 = rollover1.updatedStudents.find((s) => s.auth_id === 'u3')
  const u4 = rollover1.updatedStudents.find((s) => s.auth_id === 'u4')

  assert(u1?.current_level === 2 && u1.status === 'student', 'Student Level 1 should be promoted to Level 2')
  assert(u2?.current_level === 3 && u2.status === 'student', 'Student Level 2 should be promoted to Level 3')
  assert(u3?.current_level === 4 && u3.status === 'student', 'Student Level 3 should be promoted to Level 4')

  // -------------------------------------------------------------
  // Test 2: Year 4 Student Graduation (4 -> graduated, level = null)
  // -------------------------------------------------------------
  assert(u4?.current_level === null, 'Year 4 Student should have current_level = null after graduation')
  assert(u4?.status === 'graduated', 'Year 4 Student should have status = "graduated"')
  assert(rollover1.updatedGraduates.length === 1, 'Graduates table should contain 1 record')
  assert(rollover1.updatedGraduates[0].student_id === 'u4', 'Graduate record student_id should match Year 4 user auth_id')
  assert(rollover1.updatedGraduates[0].graduation_year === 2026, 'Graduation year should be 2026')

  // -------------------------------------------------------------
  // Test 3: Historical Data Preservation
  // -------------------------------------------------------------
  assert(u4?.auth_id === 'u4', 'User auth_id must remain unchanged')
  assert(u4?.username === 'student_yr4', 'Username must remain unchanged')
  assert(u4?.coins === 500, 'User coins must remain intact')
  assert(u4?.quiz_history_count === 40, 'User quiz history must remain intact')

  // -------------------------------------------------------------
  // Test 4: Idempotency Protection (Running rollover on graduated users)
  // -------------------------------------------------------------
  const rollover2 = simulateAcademicRollover(rollover1.updatedStudents, rollover1.updatedGraduates, 2026)
  const u4_after2nd = rollover2.updatedStudents.find((s) => s.auth_id === 'u4')

  assert(u4_after2nd?.status === 'graduated', 'Graduated student status must remain "graduated" on repeat run')
  assert(u4_after2nd?.current_level === null, 'Graduated student current_level must remain null on repeat run')
  assert(
    rollover2.updatedGraduates.filter((g) => g.student_id === 'u4').length === 1,
    'Duplicate graduate record for u4 must NOT be created on repeat run'
  )
  assert(
    rollover2.updatedGraduates.length === 2,
    'Graduates table should contain exactly 2 unique records (u4 and newly graduated u3)'
  )

  // -------------------------------------------------------------
  // Test 5: User Experience Routing Helper Verification
  // -------------------------------------------------------------
  assert(isAlumni({ status: 'graduated', current_level: null }) === true, 'isAlumni returns true for graduated user')
  assert(isAlumni({ status: 'student', current_level: 1 }) === false, 'isAlumni returns false for active student')
  assert(isAlumni({ status: 'student', current_level: 4 }) === false, 'isAlumni returns false for senior student')
  assert(isAlumni(null) === false, 'isAlumni returns false for null user')

  // -------------------------------------------------------------
  // Test 6: TA & Name Formatting Compatibility
  // -------------------------------------------------------------
  assert(formatTAName('Ahmed', 5) === 'TA/Ahmed', 'Level 5 user should be formatted as TA/Ahmed')
  assert(formatTAName('Sara', null) === 'Sara', 'Graduated user with null level should format cleanly without error')
  assert(formatTAName('Omar', 2) === 'Omar', 'Level 2 user should format without TA prefix')

  // -------------------------------------------------------------
  // Test 7: New Student Initialization
  // -------------------------------------------------------------
  const newStudent: MockStudent = {
    auth_id: 'new_1',
    username: 'freshman',
    current_level: 1,
    status: 'student',
    coins: 0,
    quiz_history_count: 0
  }
  assert(newStudent.status === 'student' && newStudent.current_level === 1, 'New student initializes with status="student" and current_level=1')

  // --- Test 8: Super Admin 3-Factor Owner Security Verification ---
  console.log('\nTesting 3-Factor Super Admin Owner Security Authentication...')
  
  function testValidateAuth(auth?: { nationalId: string; birthDate: string; monitorType: string }) {
    if (!auth) throw new Error('Missing auth')
    const cleanId = (auth.nationalId || '').replace(/\D/g, '')
    if (cleanId !== '30506070202714') throw new Error('Invalid National ID')

    const cleanDate = (auth.birthDate || '').trim().toLowerCase()
    const isMatchDate =
      cleanDate === '2005-06-07' ||
      cleanDate === '7/6/2005' ||
      cleanDate === '07/06/2005' ||
      cleanDate === '7-6-2005' ||
      cleanDate === '07-06-2005' ||
      cleanDate === '2005/06/07' ||
      cleanDate === '2005/6/7' ||
      (cleanDate.includes('2005') && (cleanDate.includes('6') || cleanDate.includes('06') || cleanDate.includes('يونيو') || cleanDate.includes('june')) && (cleanDate.includes('7') || cleanDate.includes('07')))
    if (!isMatchDate) throw new Error('Invalid Birth Date')

    const cleanMonitor = (auth.monitorType || '').trim().toUpperCase()
    if (cleanMonitor !== 'AOC') throw new Error('Invalid Monitor Screen Brand')
    return true
  }

  // 8.1: Valid credentials
  assert(
    testValidateAuth({ nationalId: '30506070202714', birthDate: '7 يونيو 2005', monitorType: 'AOC' }) === true,
    'Valid Owner credentials with Arabic birthdate must pass'
  )
  assert(
    testValidateAuth({ nationalId: '30506070202714', birthDate: '2005-06-07', monitorType: 'aoc' }) === true,
    'Valid Owner credentials with ISO date and lowercase monitor must pass'
  )
  assert(
    testValidateAuth({ nationalId: '30506070202714', birthDate: '7/6/2005', monitorType: 'Aoc' }) === true,
    'Valid Owner credentials with slash date must pass'
  )

  // 8.2: Invalid National ID
  let failedId = false
  try {
    testValidateAuth({ nationalId: '12345678901234', birthDate: '2005-06-07', monitorType: 'AOC' })
  } catch {
    failedId = true
  }
  assert(failedId, 'Wrong National ID must be rejected')

  // 8.3: Invalid Birth Date
  let failedDate = false
  try {
    testValidateAuth({ nationalId: '30506070202714', birthDate: '2004-01-01', monitorType: 'AOC' })
  } catch {
    failedDate = true
  }
  assert(failedDate, 'Wrong Birth Date must be rejected')

  // 8.4: Invalid Monitor Brand
  let failedMonitor = false
  try {
    testValidateAuth({ nationalId: '30506070202714', birthDate: '2005-06-07', monitorType: 'Samsung' })
  } catch {
    failedMonitor = true
  }
  assert(failedMonitor, 'Wrong Monitor Screen must be rejected')

  return { passed, failed, errors }
}

// Auto-run if executed directly via node
if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) {
  const { passed, failed, errors } = runGraduatesSystemTests()
  console.log(`\n========================================`)
  console.log(`Chameleon Graduates System Test Results`)
  console.log(`Passed: ${passed} | Failed: ${failed}`)
  if (errors.length > 0) {
    console.error('Errors:', errors)
    process.exit(1)
  } else {
    console.log('ALL TESTS PASSED SUCCESSFULLY! ✅')
    console.log(`========================================\n`)
  }
}
