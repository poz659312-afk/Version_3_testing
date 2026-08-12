import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

// Security: Optional secret verification for Vercel Cron or external service calls
const CRON_SECRET = process.env.CRON_SECRET

export const dynamic = "force-dynamic"
export const revalidate = 0

async function handleResetAICredits(request: NextRequest) {
  try {
    // 1. Verify service role key is configured
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: "Internal Server Error: SUPABASE_SERVICE_ROLE_KEY is missing from environment variables" },
        { status: 500 }
      )
    }

    // 2. Verify request authorization (if CRON_SECRET is configured)
    const authHeader = request.headers.get("authorization")
    const cronHeader = request.headers.get("x-cron-secret")
    const urlSecret = request.nextUrl.searchParams.get("secret")
    const providedSecret = cronHeader || urlSecret || authHeader?.replace("Bearer ", "")

    if (CRON_SECRET && providedSecret !== CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized: Invalid cron secret" }, { status: 401 })
    }

    const supabaseAdmin = createAdminClient()
    const DEFAULT_DAILY_CREDITS = 5

    // 3. Reset ai_credits to DEFAULT_DAILY_CREDITS for ALL users in chameleons table
    const { data, error, count } = await (supabaseAdmin as any)
      .from("chameleons")
      .update({ ai_credits: DEFAULT_DAILY_CREDITS })
      .not("auth_id", "is", null)

    if (error) {
      console.error("Cron Error refreshing ai_credits in chameleons table:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to reset AI credits in database",
          details: error.message
        },
        { status: 500 }
      )
    }

    const now = new Date().toISOString()
    console.log(`[CRON] Successfully refreshed ai_credits to ${DEFAULT_DAILY_CREDITS} for all users in chameleons table at ${now}`)

    return NextResponse.json({
      success: true,
      message: `Successfully refreshed ai_credits to ${DEFAULT_DAILY_CREDITS} for all users in chameleons table.`,
      defaultCredits: DEFAULT_DAILY_CREDITS,
      timestamp: now
    })
  } catch (err: any) {
    console.error("Cron Exception in reset-ai-credits route:", err)
    return NextResponse.json(
      { success: false, error: err.message || "Internal Server Error" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return handleResetAICredits(request)
}

export async function POST(request: NextRequest) {
  return handleResetAICredits(request)
}
