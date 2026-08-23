import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: summaryId } = await params

    if (!summaryId) {
      return NextResponse.json(
        { success: false, error: 'Summary ID is required.' },
        { status: 400 }
      )
    }

    // 1. Authenticate caller server-side
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please sign in to support summaries.' },
        { status: 401 }
      )
    }

    const studentId = user.id

    // 2. Call the atomic PostgreSQL RPC function
    const adminSupabase = createAdminClient()
    const { data: rpcResult, error: rpcError } = await (adminSupabase.rpc as any)('support_summary', {
      p_summary_id: summaryId,
      p_student_id: studentId
    })

    if (rpcError) {
      console.error('Support RPC execution error:', rpcError)
      return NextResponse.json(
        { success: false, error: rpcError.message || 'Support transaction failed.' },
        { status: 500 }
      )
    }

    const result = rpcResult as {
      success: boolean
      error?: string
      new_balance?: number
      votes?: number
      earned_coins?: number
    }

    if (!result || !result.success) {
      return NextResponse.json(
        { success: false, error: result?.error || 'Support operation failed.' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        summaryId,
        newBalance: result.new_balance,
        votes: result.votes,
        earnedCoins: result.earned_coins
      }
    })
  } catch (err: any) {
    console.error('Support API Route Error:', err)
    return NextResponse.json(
      { success: false, error: err.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}
