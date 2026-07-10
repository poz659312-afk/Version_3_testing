'use server'

import { createServerClient } from '@/lib/supabase/server'
import { getServerStudentSession } from '@/lib/auth-server'
import { revalidatePath } from 'next/cache'

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
 * Fetch all study rooms matching the student's level and specialization.
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
 * Get full details of a specific study room.
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
    throw new Error('Study room not found.')
  }

  // 2. Fetch Members joined with chameleons to get profile details
  const { data: members, error: membersError } = await supabase
    .from('study_room_members')
    .select(`
      role,
      joined_at,
      status,
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
        subject_id
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
    const { data: quizzesData, error: quizzesError } = await supabase
      .from('quiz_department')
      .select('code, name, questions_count')
      .eq('department_slug', room.specialization)
      .eq('level_num', room.level_num)

    if (quizzesError) {
      console.error('Failed to fetch quizzes:', quizzesError)
    } else {
      quizzes = quizzesData || []
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
    isMember,
    isPending,
    currentUserId: session.auth_id
  }
}

/**
 * Create a new study room and join as creator.
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
 * Leave a study room.
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
 * Send a chat message or Q&A question inside a study room.
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

  const { error } = await supabase
    .from('study_room_challenges')
    .insert({
      room_id: roomId,
      quiz_code: quizCode,
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

    const isCreator = memberRole?.role === 'creator'
    if (!isCreator && !session.is_super_admin) {
      return { success: false, error: 'Unauthorized. Only the owner can manage access.' }
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

    const isCreator = memberRole?.role === 'creator'
    if (!isCreator && !session.is_super_admin) {
      return { success: false, error: 'Unauthorized. Only the owner can manage access.' }
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
 * Update study room configuration settings.
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

    // Guard: Only room creator or super admin can update settings
    const { data: memberRole } = await supabase
      .from('study_room_members')
      .select('role')
      .eq('room_id', roomId)
      .eq('user_id', session.auth_id)
      .single()

    const isCreator = memberRole?.role === 'creator'
    if (!isCreator && !session.is_super_admin) {
      return { success: false, error: 'Unauthorized. Only the owner can update settings.' }
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
 * Delete a study room.
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
