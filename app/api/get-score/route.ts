import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"
import { calculateTournamentPoints } from "@/lib/utils"
import { unstable_cache } from "next/cache"
import { checkRateLimit, getRequestIdentifier, RateLimitTier } from '@/lib/rate-limit'

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    // Rate limit check
    const rateLimitId = getRequestIdentifier(request)
    const rateLimit = checkRateLimit(rateLimitId, RateLimitTier.READ)
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.reset - Date.now()) / 1000)) } }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const email = searchParams.get("email")
    const levelStr = searchParams.get("level")

    if (!email || !levelStr) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields: email and level"
      }, { status: 400 })
    }

  const level = parseInt(levelStr)
    if (![1, 2, 3].includes(level)) {
      return NextResponse.json({
        success: false,
        error: "Invalid level. Must be 1, 2, or 3"
      }, { status: 400 })
    }

    const getCachedScoreInfo = unstable_cache(
      async (emailToCheck: string, userLevel: number) => {
        const supabase = createAdminClient()
        
        const { data: userProfile, error: profileError } = await supabase
          .from("chameleons")
          .select("auth_id, username, current_level, email")
          .eq("email", emailToCheck)
          .single()

        if (profileError || !userProfile) {
          throw new Error(`User not found for email: ${emailToCheck}`)
        }

        const TOURNAMENT_START = new Date("2025-10-11T00:00:00.000Z")
        const TOURNAMENT_END = new Date("2026-06-30T23:59:59.999Z")

        const { data: quizData, error: quizError } = await supabase
          .from("quiz_data")
          .select(`
            quiz_id,
            score,
            duration_selected,
            answering_mode,
            how_finished,
            total_questions,
            solved_at
          `)
          .eq("auth_id", userProfile.auth_id)
          .eq("quiz_level", userLevel)
          .not("score", "is", null)
          .gte("solved_at", TOURNAMENT_START.toISOString())
          .lte("solved_at", TOURNAMENT_END.toISOString())
          .order("solved_at", { ascending: true })

        if (quizError) {
          throw new Error(`Error fetching quiz data: ${quizError.message}`)
        }

        const firstAttempts = new Map<number, any>()
        quizData?.forEach((quiz) => {
          const existing = firstAttempts.get(quiz.quiz_id)
          if (!existing || new Date(quiz.solved_at) < new Date(existing.solved_at)) {
            firstAttempts.set(quiz.quiz_id, quiz)
          }
        })

        let totalPoints = 0
        let validQuizCount = 0
        const quizBreakdown: any[] = []

        firstAttempts.forEach((quiz) => {
          const rawPoints = calculateTournamentPoints(
            quiz.score || 0,
            quiz.duration_selected || "15 minutes",
            quiz.answering_mode || "traditional",
            quiz.how_finished || "completed",
            quiz.total_questions || 10
          )

          const points = Math.round(rawPoints / 10)
          totalPoints += points
          validQuizCount++

          quizBreakdown.push({
            quizId: quiz.quiz_id,
            score: quiz.score,
            date: new Date(quiz.solved_at).toLocaleDateString(),
            duration: quiz.duration_selected || "15 minutes",
            mode: quiz.answering_mode || "traditional",
            points
          })
        })

        return {
          email: userProfile.email,
          username: userProfile.username,
          level: userLevel,
          points: totalPoints,
          validQuizzes: validQuizCount,
          breakdown: quizBreakdown
        }
      },
      ['api-get-score', email, String(level)],
      { revalidate: 300, tags: ['api-get-score', email, String(level)] } // Cache for 5 minutes
    )

    try {
      const data = await getCachedScoreInfo(email, level)
      return NextResponse.json({
        success: true,
        data
      })
    } catch (cachedError: any) {
      if (cachedError.message?.includes("User not found")) {
        return NextResponse.json({
          success: false,
          error: cachedError.message
        }, { status: 404 })
      }
      throw cachedError
    }

  } catch (error: any) {
    console.error("Error calculating points:", error)
    return NextResponse.json({
      success: false,
      error: error.message || "An unexpected error occurred"
    }, { status: 500 })
  }
}

// export const dynamic = 'force-dynamic';
