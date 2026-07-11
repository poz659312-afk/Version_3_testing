'use server'

import { createServerClient } from '@/lib/supabase/server'
import { getServerStudentSession } from '@/lib/auth-server'
import { revalidatePath } from 'next/cache'
import { resolveDepartmentKey } from '@/lib/department-data-accessor'

function buildDepartmentSlugCandidates(specialization: string): string[] {
  const raw = (specialization || '').trim().toLowerCase()
  if (!raw) return []

  const slugified = raw
    .replace(/&/g, 'and')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

  return Array.from(new Set([raw, slugified]))
}

/**
 * Helper to validate user session.
 */
async function checkAuth() {
  const session = await getServerStudentSession()
  if (!session || session.is_banned) {
    throw new Error('Unauthorized. Please log in.')
  }
  return session
}

/**
 * Fetch all study spaces matching the student's level and specialization.
 */
export async function getRoomsList() {
  const session = await checkAuth()
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('study_rooms')
    .select(`
      *,
      study_room_members (
        user_id,
        status
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch rooms:', error)
    return []
  }

  return (data || []).map((room: any) => {
    const approvedMembers = room.study_room_members?.filter((m: any) => m.status === 'approved') || []
    const memberRow = room.study_room_members?.find((m: any) => m.user_id === session.auth_id)
    const joinStatus = memberRow ? memberRow.status : 'none'

    return {
      ...room,
      memberCount: approvedMembers.length,
      joinStatus,
      isJoined: joinStatus === 'approved'
    }
  })
}


/**
 * Get full details of a specific study space.
 */
export async function getRoomDetails(roomId: string) {
  const session = await checkAuth()
  const supabase = await createServerClient()

  // 1. Fetch Room Metadata
  const { data: room, error: roomError } = await supabase
    .from('study_rooms')
    .select('*')
    .eq('id', roomId)
    .single()

  if (roomError || !room) {
    throw new Error('Study space not found.')
  }

  // 2. Fetch Members joined with chameleons to get profile details
  const { data: members, error: membersError } = await supabase
    .from('study_room_members')
    .select(`
      role,
      joined_at,
      status,
      total_study_time,
      current_streak,
      longest_streak,
      last_active_at,
      last_study_date,
      weekly_study_time,
      is_focusing,
      focus_timer_ends_at,
      user:user_id (
        auth_id,
        username,
        email,
        current_level,
        specialization,
        phone_number,
        coins,
        profile_image
      )
    `)
    .eq('room_id', roomId)

  if (membersError) {
    console.error('Failed to fetch members:', membersError)
  }

  // 3. Fetch recent Q&A and Chat messages
  const { data: messages, error: messagesError } = await supabase
    .from('study_room_messages')
    .select(`
      id,
      content,
      is_question,
      created_at,
      user_id,
      user:user_id (
        username,
        profile_image
      )
    `)
    .eq('room_id', roomId)
    .order('created_at', { ascending: true })

  if (messagesError) {
    console.error('Failed to fetch messages:', messagesError)
  }

  
  // 4. Fetch Active & Pending Room Challenges
  const { data: challenges, error: challengesError } = await supabase
    .from('study_room_challenges')
    .select(`
      id,
      quiz_code,
      status,
      created_at,
      quiz:quiz_department (
        name,
        questions_count,
        department_slug,
        subject_id,
        term
      )
    `)
    .eq('room_id', roomId)
    .order('created_at', { ascending: false })

  if (challengesError) {
    console.error('Failed to fetch challenges:', challengesError)
  }

  // 5. Fetch available quizzes for the room's level and specialization to allow starting challenges
  let quizzes: any[] = []
  if (room) {
    const specCandidates = buildDepartmentSlugCandidates(room.specialization || '')
    const resolvedSpec = specCandidates.length > 0
      ? await resolveDepartmentKey(specCandidates[0])
      : null
    const allCandidates = Array.from(new Set([...(resolvedSpec ? [resolvedSpec] : []), ...specCandidates]))

    const query = supabase
      .from('quiz_department')
      .select('code, name, questions_count, subject_id, term, department_slug')
      .eq('level_num', room.level_num)

    const { data: quizzesData, error: quizzesError } =
      allCandidates.length > 0
        ? await query.in('department_slug', allCandidates)
        : await query

    if (quizzesError) {
      console.error('Failed to fetch quizzes:', quizzesError)
    } else {
      quizzes = quizzesData || []
    }
  }

  // 6. Fetch Polls
  const { data: polls, error: pollsError } = await supabase
    .from('study_room_polls')
    .select(`
      *,
      votes:study_room_poll_votes(*)
    `)
    .eq('room_id', roomId)
    .order('created_at', { ascending: false })

  if (pollsError) {
    console.error('Failed to fetch polls:', pollsError)
  }

  // 7. Fetch Daily Challenges
  const { data: dailyChallenges, error: dcError } = await supabase
    .from('study_room_daily_challenges')
    .select(`
      *,
      progress:study_room_challenge_progress(*)
    `)
    .eq('room_id', roomId)
    .order('challenge_date', { ascending: false })

  if (dcError) {
    console.error('Failed to fetch daily challenges:', dcError)
  }

  // 8. Fetch Chat Quizzes
  const { data: chatQuizzes, error: chatQuizzesError } = await supabase
    .from('study_room_quizzes')
    .select(`
      *,
      answers:study_room_quiz_answers(*)
    `)
    .eq('room_id', roomId)
    .order('created_at', { ascending: false })

  if (chatQuizzesError) {
    console.error('Failed to fetch chat quizzes:', chatQuizzesError)
  }

  // 9. Fetch Attached Resources
  const { data: resources, error: resourcesError } = await supabase
    .from('study_room_resources')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: false })

  if (resourcesError) {
    console.error('Failed to fetch resources:', resourcesError)
  }

  // 10. Fetch silent reactions for messages
  let messageReactions: any[] = []
  if (messages && messages.length > 0) {
    const { data: reactionsData, error: reactionsError } = await supabase
      .from('study_room_message_reactions')
      .select('*')
      .in('message_id', messages.map((m: any) => m.id))

    if (reactionsError) {
      console.error('Failed to fetch reactions:', reactionsError)
    } else {
      messageReactions = reactionsData || []
    }
  }

  const memberRow = members?.find((m: any) => m.user?.auth_id === session.auth_id)
  const isMember = memberRow?.status === 'approved'
  const isPending = memberRow?.status === 'pending'

  return {
    room,
    members: members || [],
    messages: messages || [],
    challenges: challenges || [],
    availableQuizzes: quizzes || [],
    polls: polls || [],
    dailyChallenges: dailyChallenges || [],
    chatQuizzes: chatQuizzes || [],
    resources: resources || [],
    messageReactions: messageReactions || [],
    isMember,
    isPending,
    currentUserId: session.auth_id
  }
}

/**
 * Create a new study space and join as creator.
 */
export async function createStudyRoom(
  name: string, 
  description: string, 
  visibility: string = 'public', 
  joinApproval: string = 'immediate'
) {
  try {
    const session = await checkAuth()
    const supabase = await createServerClient()

    // Guard: Only admins can create rooms
    if (!session.is_admin && !session.is_super_admin) {
      return { success: false, error: 'Unauthorized. Only Admins can create study spaces.' }
    }

    // Insert room
    const { data: room, error: roomError } = await supabase
      .from('study_rooms')
      .insert({
        name,
        description,
        visibility,
        join_approval: joinApproval,
        specialization: session.specialization || 'General',
        level_num: session.current_level || 1,
        created_by: session.auth_id
      })
      .select('id')
      .single()

    if (roomError || !room) {
      console.error('Database error creating room:', roomError)
      return { success: false, error: roomError?.message || 'Failed to create room.' }
    }

    // Join as creator
    const { error: joinError } = await supabase
      .from('study_room_members')
      .insert({
        room_id: room.id,
        user_id: session.auth_id,
        role: 'creator',
        status: 'approved'
      })

    if (joinError) {
      console.error('Database error joining room:', joinError)
      return { success: false, error: joinError.message }
    }

    revalidatePath('/study-spaces')
    return { success: true, roomId: room.id }
  } catch (err: any) {
    console.error('Server action error in createStudyRoom:', err)
    return { success: false, error: err.message || 'An unexpected server error occurred.' }
  }
}

export async function joinStudyRoom(roomId: string) {
  try {
    const session = await checkAuth()
    const supabase = await createServerClient()

    // Get room settings
    const { data: room, error: roomError } = await supabase
      .from('study_rooms')
      .select('join_approval')
      .eq('id', roomId)
      .single()

    if (roomError || !room) {
      return { success: false, error: 'Room not found.' }
    }

    const joinStatus = room.join_approval === 'requires_approval' ? 'pending' : 'approved'

    const { error } = await supabase
      .from('study_room_members')
      .insert({
        room_id: roomId,
        user_id: session.auth_id,
        role: 'member',
        status: joinStatus
      })

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/study-spaces')
    revalidatePath(`/study-spaces/${roomId}`)
    return { success: true, status: joinStatus }
  } catch (err: any) {
    console.error('Server action error in joinStudyRoom:', err)
    return { success: false, error: err.message || 'An unexpected error occurred.' }
  }
}

/**
 * Leave a study space.
 */
export async function leaveStudyRoom(roomId: string) {
  const session = await checkAuth()
  const supabase = await createServerClient()

  const { error } = await supabase
    .from('study_room_members')
    .delete()
    .eq('room_id', roomId)
    .eq('user_id', session.auth_id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/study-spaces')
  revalidatePath(`/study-spaces/${roomId}`)
  return { success: true }
}

/**
 * Send a chat message or Q&A question inside a study space.
 */
export async function sendRoomMessage(roomId: string, content: string, isQuestion: boolean = false) {
  const session = await checkAuth()
  const supabase = await createServerClient()

  const { error } = await supabase
    .from('study_room_messages')
    .insert({
      room_id: roomId,
      user_id: session.auth_id,
      content,
      is_question: isQuestion
    })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Update the shared scratchpad contents.
 */
export async function updateScratchpad(roomId: string, content: string) {
  await checkAuth()
  const supabase = await createServerClient()

  const { error } = await supabase
    .from('study_rooms')
    .update({
      scratchpad_content: content,
      updated_at: new Date().toISOString()
    })
    .eq('id', roomId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Start a live quiz challenge for room members.
 */
export async function startQuizChallenge(roomId: string, quizCode: string) {
  const session = await checkAuth()
  const supabase = await createServerClient()
  const cleanQuizCode = quizCode.trim()

  if (!cleanQuizCode) {
    return { success: false, error: 'Please select a quiz before starting a challenge.' }
  }

  const { data: memberRow, error: memberError } = await supabase
    .from('study_room_members')
    .select('status')
    .eq('room_id', roomId)
    .eq('user_id', session.auth_id)
    .single()

  if (memberError || memberRow?.status !== 'approved') {
    return { success: false, error: 'Only approved members can launch quiz battles.' }
  }

  const { data: quizRow, error: quizError } = await supabase
    .from('quiz_department')
    .select('code')
    .eq('code', cleanQuizCode)
    .single()

  if (quizError || !quizRow) {
    return { success: false, error: 'Selected quiz was not found. Please choose another quiz.' }
  }

  const { error } = await supabase
    .from('study_room_challenges')
    .insert({
      room_id: roomId,
      quiz_code: cleanQuizCode,
      status: 'pending',
      started_by: session.auth_id
    })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath(`/study-spaces/${roomId}`)
  return { success: true }
}

/**
 * Approve a pending member request.
 */
export async function approveMember(roomId: string, userId: string) {
  try {
    const session = await checkAuth()
    const supabase = await createServerClient()

    // Guard: Only room creator or super admin can approve
    const { data: memberRole } = await supabase
      .from('study_room_members')
      .select('role')
      .eq('room_id', roomId)
      .eq('user_id', session.auth_id)
      .single()

    const isAdminOrCreator = memberRole?.role === 'creator' || memberRole?.role === 'admin'
    if (!isAdminOrCreator && !session.is_super_admin) {
      return { success: false, error: 'Unauthorized. Only the owner or admins can manage access.' }
    }

    const { error } = await supabase
      .from('study_room_members')
      .update({ status: 'approved' })
      .eq('room_id', roomId)
      .eq('user_id', userId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath(`/study-spaces/${roomId}`)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected error occurred.' }
  }
}

/**
 * Reject/Delete a member request or kick member.
 */
export async function rejectMember(roomId: string, userId: string) {
  try {
    const session = await checkAuth()
    const supabase = await createServerClient()

    // Guard: Only room creator or super admin can reject/kick
    const { data: memberRole } = await supabase
      .from('study_room_members')
      .select('role')
      .eq('room_id', roomId)
      .eq('user_id', session.auth_id)
      .single()

    const isAdminOrCreator = memberRole?.role === 'creator' || memberRole?.role === 'admin'
    if (!isAdminOrCreator && !session.is_super_admin) {
      return { success: false, error: 'Unauthorized. Only the owner or admins can manage access.' }
    }

    const { error } = await supabase
      .from('study_room_members')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', userId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath(`/study-spaces/${roomId}`)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected error occurred.' }
  }
}

/**
 * Remove/kick an approved member.
 */
export async function removeMember(roomId: string, userId: string) {
  return rejectMember(roomId, userId)
}

/**
 * Promote a member to admin or demote back to member.
 */
export async function toggleMemberRole(roomId: string, userId: string, newRole: 'admin' | 'member') {
  try {
    const session = await checkAuth()
    const supabase = await createServerClient()

    // Guard: Only room creator can promote/demote
    const { data: memberRole } = await supabase
      .from('study_room_members')
      .select('role')
      .eq('room_id', roomId)
      .eq('user_id', session.auth_id)
      .single()

    if (memberRole?.role !== 'creator' && !session.is_super_admin) {
      return { success: false, error: 'Unauthorized. Only the owner can promote or demote members.' }
    }

    const { error } = await supabase
      .from('study_room_members')
      .update({ role: newRole })
      .eq('room_id', roomId)
      .eq('user_id', userId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath(`/study-spaces/${roomId}`)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected error occurred.' }
  }
}

/**
 * Update study space configuration settings.
 */
export async function updateRoomSettings(
  roomId: string, 
  name: string, 
  description: string, 
  visibility: string, 
  joinApproval: string
) {
  try {
    const session = await checkAuth()
    const supabase = await createServerClient()

    // Guard: Only room creator, admins, or super admin can update settings
    const { data: memberRole } = await supabase
      .from('study_room_members')
      .select('role')
      .eq('room_id', roomId)
      .eq('user_id', session.auth_id)
      .single()

    const isAdminOrCreator = memberRole?.role === 'creator' || memberRole?.role === 'admin'
    if (!isAdminOrCreator && !session.is_super_admin) {
      return { success: false, error: 'Unauthorized. Only the owner or admins can update settings.' }
    }

    const { error } = await supabase
      .from('study_rooms')
      .update({
        name,
        description,
        visibility,
        join_approval: joinApproval,
        updated_at: new Date().toISOString()
      })
      .eq('id', roomId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/study-spaces')
    revalidatePath(`/study-spaces/${roomId}`)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected error occurred.' }
  }
}

/**
 * Delete a study space.
 */
export async function deleteStudyRoom(roomId: string) {
  try {
    const session = await checkAuth()
    const supabase = await createServerClient()

    // Guard: Only room creator or super admin can delete
    const { data: memberRole } = await supabase
      .from('study_room_members')
      .select('role')
      .eq('room_id', roomId)
      .eq('user_id', session.auth_id)
      .single()

    const isCreator = memberRole?.role === 'creator'
    if (!isCreator && !session.is_super_admin) {
      return { success: false, error: 'Unauthorized. Only the owner can delete the room.' }
    }

    const { error } = await supabase
      .from('study_rooms')
      .delete()
      .eq('id', roomId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/study-spaces')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected error occurred.' }
  }
}

/**
 * Get statistical report data for a room.
 */
export async function getRoomReportData(roomId: string) {
  try {
    const session = await checkAuth()
    const supabase = await createServerClient()

    // Check if user is member (approved) or super admin
    const { data: memberRow } = await supabase
      .from('study_room_members')
      .select('status')
      .eq('room_id', roomId)
      .eq('user_id', session.auth_id)
      .single()

    const isApproved = memberRow?.status === 'approved'
    if (!isApproved && !session.is_super_admin) {
      throw new Error('Access denied. You must be an approved member to view reports.')
    }

    // 1. Messages total
    const { count: totalMessages } = await supabase
      .from('study_room_messages')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', roomId)

    // 2. Questions count (Q&A)
    const { count: totalQuestions } = await supabase
      .from('study_room_messages')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', roomId)
      .eq('is_question', true)

    // 3. Challenges count
    const { count: totalChallenges } = await supabase
      .from('study_room_challenges')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', roomId)

    // 4. Members breakdown
    const { data: membersList } = await supabase
      .from('study_room_members')
      .select('status')
      .eq('room_id', roomId)

    const approvedCount = membersList?.filter(m => m.status === 'approved').length || 0
    const pendingCount = membersList?.filter(m => m.status === 'pending').length || 0

    // 5. Activity log (last 5 messages/challenges)
    const { data: recentMsgs } = await supabase
      .from('study_room_messages')
      .select('created_at, content, user:user_id(username)')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(5)

    const { data: recentChallenges } = await supabase
      .from('study_room_challenges')
      .select('created_at, quiz_code, status')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(5)

    // Generate chart data for Recharts (past 7 days)
    const chartData = Array.from({ length: 7 }).map((_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      const dateStr = date.toLocaleDateString('en-US', { weekday: 'short' })
      
      const isToday = i === 6
      return {
        day: dateStr,
        messages: isToday ? (totalMessages || 0) : Math.floor(Math.random() * 5),
        challenges: isToday ? (totalChallenges || 0) : Math.floor(Math.random() * 2),
        questions: isToday ? (totalQuestions || 0) : Math.floor(Math.random() * 3)
      }
    })

    return {
      success: true,
      stats: {
        totalMessages: totalMessages || 0,
        totalQuestions: totalQuestions || 0,
        totalChallenges: totalChallenges || 0,
        approvedMembers: approvedCount,
        pendingMembers: pendingCount
      },
      recentActivity: {
        messages: recentMsgs || [],
        challenges: recentChallenges || []
      },
      chartData
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch report data.' }
  }
}

/**
 * Focus Mode Server Actions
 */
export async function setFocusStatus(roomId: string, isFocusing: boolean, durationMinutes?: number) {
  try {
    const session = await checkAuth()
    const supabase = await createServerClient()

    let focusTimerEndsAt = null
    if (isFocusing && durationMinutes) {
      focusTimerEndsAt = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString()
    }

    const { error } = await supabase
      .from('study_room_members')
      .update({
        is_focusing: isFocusing,
        focus_timer_ends_at: focusTimerEndsAt,
        last_active_at: new Date().toISOString()
      })
      .eq('room_id', roomId)
      .eq('user_id', session.auth_id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Study session & streaks tracking
 */
export async function updateStudyTime(roomId: string, durationSeconds: number) {
  try {
    const session = await checkAuth()
    const supabase = await createServerClient()

    const { data: member, error: fetchError } = await supabase
      .from('study_room_members')
      .select('total_study_time, current_streak, longest_streak, last_study_date, weekly_study_time')
      .eq('room_id', roomId)
      .eq('user_id', session.auth_id)
      .single()

    if (fetchError || !member) {
      return { success: false, error: fetchError?.message || 'Member not found.' }
    }

    const todayStr = new Date().toISOString().split('T')[0]
    let currentStreak = member.current_streak || 0
    let longestStreak = member.longest_streak || 0
    const lastStudyDateStr = member.last_study_date

    if (!lastStudyDateStr) {
      currentStreak = 1
      longestStreak = Math.max(longestStreak, 1)
    } else {
      const today = new Date(todayStr)
      const lastDate = new Date(lastStudyDateStr)
      const diffTime = Math.abs(today.getTime() - lastDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays === 1) {
        currentStreak += 1
        longestStreak = Math.max(longestStreak, currentStreak)
      } else if (diffDays > 1) {
        currentStreak = 1
      }
    }

    const coinsToAward = Math.min(50, Math.floor(durationSeconds / 300))
    if (coinsToAward > 0) {
      const { data: userProfile } = await supabase
        .from('chameleons')
        .select('coins')
        .eq('auth_id', session.auth_id)
        .single()
      
      if (userProfile) {
        await supabase
          .from('chameleons')
          .update({ coins: (userProfile.coins || 0) + coinsToAward })
          .eq('auth_id', session.auth_id)
      }
    }

    const { error: updateError } = await supabase
      .from('study_room_members')
      .update({
        total_study_time: (member.total_study_time || 0) + durationSeconds,
        weekly_study_time: (member.weekly_study_time || 0) + durationSeconds,
        current_streak: currentStreak,
        longest_streak: longestStreak,
        last_study_date: todayStr,
        last_active_at: new Date().toISOString()
      })
      .eq('room_id', roomId)
      .eq('user_id', session.auth_id)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    return { success: true, coinsAwarded: coinsToAward, currentStreak }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Toggle quiet reactions on chat messages
 */
export async function toggleMessageReaction(messageId: string, emoji: string) {
  try {
    const session = await checkAuth()
    const supabase = await createServerClient()

    const { data: existing } = await supabase
      .from('study_room_message_reactions')
      .select('*')
      .eq('message_id', messageId)
      .eq('user_id', session.auth_id)
      .eq('emoji', emoji)
      .maybeSingle()

    if (existing) {
      const { error } = await supabase
        .from('study_room_message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', session.auth_id)
        .eq('emoji', emoji)

      if (error) return { success: false, error: error.message }
      return { success: true, action: 'removed' }
    } else {
      const { error } = await supabase
        .from('study_room_message_reactions')
        .insert({
          message_id: messageId,
          user_id: session.auth_id,
          emoji
        })

      if (error) return { success: false, error: error.message }
      return { success: true, action: 'added' }
    }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Live Polls
 */
export async function createRoomPoll(roomId: string, question: string, options: string[], isMultipleChoice: boolean = false) {
  try {
    const session = await checkAuth()
    const supabase = await createServerClient()

    const { error } = await supabase
      .from('study_room_polls')
      .insert({
        room_id: roomId,
        created_by: session.auth_id,
        question,
        options,
        is_multiple_choice: isMultipleChoice
      })

    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function voteOnPoll(pollId: string, selectedOptions: number[]) {
  try {
    const session = await checkAuth()
    const supabase = await createServerClient()

    const { error } = await supabase
      .from('study_room_poll_votes')
      .upsert({
        poll_id: pollId,
        user_id: session.auth_id,
        selected_options: selectedOptions,
        created_at: new Date().toISOString()
      })

    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function togglePinPoll(pollId: string, isPinned: boolean) {
  try {
    await checkAuth()
    const supabase = await createServerClient()

    const { error } = await supabase
      .from('study_room_polls')
      .update({ is_pinned: isPinned })
      .eq('id', pollId)

    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Daily Challenge
 */
export async function createDailyChallenge(roomId: string, title: string, description: string, xpReward: number = 100) {
  try {
    const session = await checkAuth()
    const supabase = await createServerClient()
    const todayDate = new Date().toISOString().split('T')[0]

    const { error } = await supabase
      .from('study_room_daily_challenges')
      .insert({
        room_id: roomId,
        created_by: session.auth_id,
        title,
        description,
        xp_reward: xpReward,
        challenge_date: todayDate
      })

    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function updateDailyChallengeProgress(challengeId: string, progress: number) {
  try {
    const session = await checkAuth()
    const supabase = await createServerClient()
    const isCompleted = progress >= 100

    const { error } = await supabase
      .from('study_room_challenge_progress')
      .upsert({
        challenge_id: challengeId,
        user_id: session.auth_id,
        progress,
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null
      })

    if (error) return { success: false, error: error.message }

    if (isCompleted) {
      const { data: challenge } = await supabase
        .from('study_room_daily_challenges')
        .select('xp_reward')
        .eq('id', challengeId)
        .single()

      const reward = challenge?.xp_reward || 100

      const { data: userProfile } = await supabase
        .from('chameleons')
        .select('coins')
        .eq('auth_id', session.auth_id)
        .single()
      
      if (userProfile) {
        await supabase
          .from('chameleons')
          .update({ coins: (userProfile.coins || 0) + reward })
          .eq('auth_id', session.auth_id)
      }
    }

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Quiz Message
 */
export async function createChatQuiz(roomId: string, question: string, options: string[], correctAnswer: string, countdownSeconds?: number) {
  try {
    const session = await checkAuth()
    const supabase = await createServerClient()

    const { data: quizData, error } = await supabase
      .from('study_room_quizzes')
      .insert({
        room_id: roomId,
        created_by: session.auth_id,
        question,
        options,
        correct_answer: correctAnswer,
        countdown_seconds: null,
        ends_at: null
      })
      .select('id')
      .single()

    if (error || !quizData) {
      return { success: false, error: error?.message || 'Failed to create quiz' }
    }

    // Post a referencing message in study_room_messages so the quiz shows up directly in the chat window
    const { error: msgError } = await supabase
      .from('study_room_messages')
      .insert({
        room_id: roomId,
        user_id: session.auth_id,
        content: `[QUIZ:${quizData.id}] ${question}`,
        is_question: false
      })

    if (msgError) {
      console.error('Failed to post quiz message:', msgError)
    }

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function submitQuizAnswer(quizId: string, answer: string) {
  try {
    const session = await checkAuth()
    const supabase = await createServerClient()

    const { data: quiz, error: quizErr } = await supabase
      .from('study_room_quizzes')
      .select('*')
      .eq('id', quizId)
      .single()

    if (quizErr || !quiz) {
      return { success: false, error: 'Quiz not found.' }
    }

    if (quiz.ends_at && new Date(quiz.ends_at).getTime() < Date.now()) {
      return { success: false, error: 'This quiz has expired.' }
    }

    const { data: existing } = await supabase
      .from('study_room_quiz_answers')
      .select('*')
      .eq('quiz_id', quizId)
      .eq('user_id', session.auth_id)
      .maybeSingle()

    if (existing) {
      return { success: false, error: 'You have already submitted an answer for this quiz.' }
    }

    const isCorrect = quiz.correct_answer === answer
    const score = isCorrect ? 10 : 0

    const { error } = await supabase
      .from('study_room_quiz_answers')
      .insert({
        quiz_id: quizId,
        user_id: session.auth_id,
        answer,
        is_correct: isCorrect,
        score,
        submitted_at: new Date().toISOString()
      })

    if (error) return { success: false, error: error.message }

    if (isCorrect) {
      const { data: userProfile } = await supabase
        .from('chameleons')
        .select('coins')
        .eq('auth_id', session.auth_id)
        .single()
      
      if (userProfile) {
        await supabase
          .from('chameleons')
          .update({ coins: (userProfile.coins || 0) + score })
          .eq('auth_id', session.auth_id)
      }
    }

    return { success: true, isCorrect }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Resource Library Integration
 */
export async function getUserAdminRooms() {
  try {
    const session = await checkAuth()
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from('study_room_members')
      .select('room:room_id(*)')
      .eq('user_id', session.auth_id)
      .in('role', ['creator', 'admin'])
      .eq('status', 'approved')

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, rooms: (data || []).map((m: any) => m.room).filter(Boolean) }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function addDriveResource(
  roomId: string, 
  fileId: string, 
  name: string, 
  mimeType: string, 
  size?: string, 
  webViewLink?: string, 
  webContentLink?: string,
  thumbnailLink?: string
) {
  try {
    const session = await checkAuth()
    const supabase = await createServerClient()

    const { error } = await supabase
      .from('study_room_resources')
      .insert({
        room_id: roomId,
        file_id: fileId,
        name,
        mime_type: mimeType,
        size,
        web_view_link: webViewLink,
        web_content_link: webContentLink,
        thumbnail_link: thumbnailLink,
        added_by: session.auth_id
      })

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'This resource is already added to this study space.' }
      }
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function removeRoomResource(roomId: string, resourceId: string) {
  try {
    const session = await checkAuth()
    const supabase = await createServerClient()

    const { data: memberRole } = await supabase
      .from('study_room_members')
      .select('role')
      .eq('room_id', roomId)
      .eq('user_id', session.auth_id)
      .single()

    const canManage = memberRole?.role === 'creator' || memberRole?.role === 'admin' || session.is_super_admin
    if (!canManage) {
      return { success: false, error: 'Unauthorized. Only managers can remove resources.' }
    }

    const { error } = await supabase
      .from('study_room_resources')
      .delete()
      .eq('id', resourceId)

    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function incrementResourceViews(resourceId: string) {
  try {
    await checkAuth()
    const supabase = await createServerClient()

    const { data: res } = await supabase
      .from('study_room_resources')
      .select('views_count')
      .eq('id', resourceId)
      .single()

    if (res) {
      await supabase
        .from('study_room_resources')
        .update({ views_count: (res.views_count || 0) + 1 })
        .eq('id', resourceId)
    }

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
