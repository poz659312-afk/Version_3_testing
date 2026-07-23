import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

// Verify cron secret for security
const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: NextRequest) {
  try {
    // 1. Verify service role key is configured in environment variables
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: "Internal Server Error: SUPABASE_SERVICE_ROLE_KEY is missing from server environment variables" },
        { status: 500 }
      )
    }

    // Verify the request is from Vercel Cron (optional but recommended)
    const authHeader = request.headers.get("authorization")
    const cronHeader = request.headers.get("x-cron-secret")
    const providedSecret = cronHeader || authHeader?.replace("Bearer ", "")

    if (CRON_SECRET && providedSecret !== CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabaseAdmin = createAdminClient()

    const now = new Date()

    // Find all accounts where is_banned is true
    const { data: bannedUsers, error: fetchError } = (await supabaseAdmin
      .from("chameleons")
      .select("auth_id, username, email")
      .eq("is_banned", true)) as any

    if (fetchError) {
      return NextResponse.json(
        { error: "Failed to fetch banned users" },
        { status: 500 }
      )
    }

    if (!bannedUsers || bannedUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No banned users found",
        processedCount: 0
      })
    }

    const results = {
      processed: 0,
      failed: 0,
      details: [] as { authId: string; username: string; status: string }[]
    }

    // Sign out each banned user from all active sessions
    for (const user of bannedUsers) {
      if (!user.auth_id) continue
      try {
        const { error: signOutError } = await supabaseAdmin.auth.admin.signOut(user.auth_id, 'global')

        if (signOutError) {
          results.failed++
          results.details.push({
            authId: user.auth_id,
            username: user.username,
            status: `Failed: ${signOutError.message}`
          })
        } else {
          results.processed++
          results.details.push({
            authId: user.auth_id,
            username: user.username,
            status: "Sessions revoked"
          })
        }
      } catch (error) {
        results.failed++
        results.details.push({
          authId: user.auth_id,
          username: user.username,
          status: `Error: ${error}`
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.processed} session revocations, ${results.failed} failures`,
      ...results
    })
  } catch (error) {
    return NextResponse.json(
      { 
        error: "Failed to process banned users.",
        details: String(error)
      },
      { status: 500 }
    )
  }
}

// Also allow POST for manual triggering (with auth)
export async function POST(request: NextRequest) {
  return GET(request)
}

export const dynamic = 'force-dynamic';
