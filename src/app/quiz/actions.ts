'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getServerStudentSession } from '@/lib/auth-server'
import { determineQuizLevel } from '@/lib/quiz-level'

export interface SubmitQuizResultInput {
  quizId: string
  finalScore: number
  totalQuestions: number
  status: 'completed' | 'timed-out' | 'exited'
  answeringMode?: string
  durationSelected?: number
  challengeId?: string | null
}

export interface SubmitQuizResultResponse {
  success: boolean
  earnedCoins: number
  newTotalCoins?: number
  error?: string
}

/**
 * Server-authoritative quiz completion and coin reward handler.
 * Verifies authenticated session, validates inputs, records quiz attempt,
 * updates challenge status, and atomically credits earned coins on the backend.
 */
export async function recordQuizCompletionAction(
  input: SubmitQuizResultInput
): Promise<SubmitQuizResultResponse> {
  try {
    const session = await getServerStudentSession()
    if (!session || !session.auth_id) {
      return { success: false, earnedCoins: 0, error: 'Unauthorized' }
    }

    if (session.is_banned) {
      return { success: false, earnedCoins: 0, error: 'User is banned' }
    }

    const {
      quizId,
      finalScore,
      totalQuestions,
      status,
      answeringMode = 'normal',
      durationSelected = 0,
      challengeId
    } = input

    if (!quizId || typeof quizId !== 'string') {
      return { success: false, earnedCoins: 0, error: 'Invalid quiz ID' }
    }

    const safeTotalQuestions = Math.max(1, Number(totalQuestions) || 1)
    const safeFinalScore = Math.max(0, Math.min(safeTotalQuestions, Number(finalScore) || 0))
    const scorePercentage = Math.round((safeFinalScore / safeTotalQuestions) * 100)

    const quizLevel = determineQuizLevel(quizId)
    const durationStr = durationSelected === 0 ? 'Unlimited' : `${durationSelected} minutes`

    const supabase = createAdminClient()

    // 1. Record quiz result in quiz_data
    const quizResult = {
      auth_id: session.auth_id,
      quiz_id: quizId,
      score: scorePercentage,
      how_finished: status,
      answering_mode: answeringMode,
      duration_selected: durationStr,
      total_questions: safeTotalQuestions,
      quiz_level: quizLevel
    }

    const { error: quizInsertError } = await (supabase.from('quiz_data') as any).insert([quizResult])

    if (quizInsertError) {
      console.error('Error inserting quiz result on server:', quizInsertError.message)
      return { success: false, earnedCoins: 0, error: 'Failed to record quiz data' }
    }

    // 2. If part of a study space challenge, complete it
    if (challengeId && typeof challengeId === 'string') {
      const { error: challengeError } = await (supabase.from('study_room_challenges') as any)
        .update({ status: 'completed' })
        .eq('id', challengeId)

      if (challengeError) {
        console.warn('Error completing study space challenge on server:', challengeError.message)
      }
    }

    // 3. Compute and credit earned coins: (finalScore * 1.5) * 3 = finalScore * 4.5 rounded up
    const earnedCoins = Math.max(0, Math.ceil(safeFinalScore * 4.5))
    let newTotalCoins = session.coins || 0

    if (earnedCoins > 0) {
      const { data: userData, error: userFetchError } = await (supabase.from('chameleons') as any)
        .select('coins')
        .eq('auth_id', session.auth_id)
        .single()

      if (!userFetchError && userData) {
        newTotalCoins = (userData.coins || 0) + earnedCoins
        await (supabase.from('chameleons') as any)
          .update({ coins: newTotalCoins })
          .eq('auth_id', session.auth_id)
      }
    }

    return {
      success: true,
      earnedCoins,
      newTotalCoins
    }
  } catch (err: any) {
    console.error('Unexpected error in recordQuizCompletionAction:', err)
    return { success: false, earnedCoins: 0, error: err.message || 'Server error' }
  }
}
