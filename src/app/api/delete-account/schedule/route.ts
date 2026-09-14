import { NextRequest, NextResponse } from "next/server"
import { getServerStudentSession } from "@/lib/auth-server"
import { createAdminClient } from "@/lib/supabase/admin"
import { checkRateLimit, getRequestIdentifier, RateLimitTier } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  try {
    // Rate limit sensitive operations
    const identifier = getRequestIdentifier(request)
    const rateLimit = checkRateLimit(identifier, RateLimitTier.SENSITIVE)
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429 }
      )
    }

    // 1. Authenticate caller server-side
    const session = await getServerStudentSession()
    if (!session || !session.auth_id) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to manage your account." },
        { status: 401 }
      )
    }

    if (session.is_banned) {
      return NextResponse.json(
        { error: "Account is restricted." },
        { status: 403 }
      )
    }

    const supabaseAdmin = createAdminClient()

    // Retrieve user record to get numeric user_id and verify identity
    const { data: userRecord, error: userFetchError } = await (supabaseAdmin
      .from("chameleons") as any)
      .select("user_id, auth_id, email")
      .eq("auth_id", session.auth_id)
      .single()

    if (userFetchError || !userRecord) {
      return NextResponse.json(
        { error: "Account record not found." },
        { status: 404 }
      )
    }

    // Optional payload verification
    const body = await request.json().catch(() => ({}))
    if (body.userId && Number(body.userId) !== Number(userRecord.user_id)) {
      return NextResponse.json(
        { error: "Forbidden. You cannot schedule deletion for another user." },
        { status: 403 }
      )
    }

    // Calculate deletion date (14 days from now)
    const deletionDate = new Date()
    deletionDate.setDate(deletionDate.getDate() + 14)

    // Update user with scheduled deletion date
    const { error: updateError } = await (supabaseAdmin
      .from("chameleons") as any)
      .update({ 
        deletion_scheduled_at: deletionDate.toISOString() 
      })
      .eq("auth_id", session.auth_id)

    if (updateError) {
      console.error("Error scheduling deletion:", updateError)
      return NextResponse.json(
        { error: "Failed to schedule deletion. Please try again." },
        { status: 500 }
      )
    }

    // Add a farewell notification
    await (supabaseAdmin
      .from("Notifications") as any)
      .insert({
        user_id: userRecord.user_id,
        auth_id: session.auth_id,
        title: "Account Deletion Scheduled 💔",
        provider: "System",
        type: "warning",
        message_content: `Your account is scheduled for deletion on ${deletionDate.toLocaleDateString()}. We'll miss you! (You can cancel this anytime in the next 14 days if you change your mind.)`,
        seen: "false"
      })

    return NextResponse.json({
      success: true,
      message: "Deletion scheduled. The countdown begins... 💀",
      deletionDate: deletionDate.toISOString(),
      daysRemaining: 14
    })
  } catch (error) {
    console.error("Error in schedule deletion:", error)
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic';
