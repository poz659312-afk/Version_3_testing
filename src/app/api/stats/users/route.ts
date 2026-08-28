import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// In-memory server-side cache — survives across requests within the same serverless instance
let cachedResult: { data: any; timestamp: number } | null = null
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Cache for 5 minutes – user count changes slowly
export const revalidate = 300

export async function GET() {
  try {
    // Return cached result if still valid
    if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_TTL) {
      return NextResponse.json(cachedResult.data, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'X-Cache': 'HIT',
        },
      })
    }

    // Use service role to bypass RLS and get ALL users
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Efficient parallel exact count queries (0 row payload, sub-10ms response)
    const [totalRes, l1Res, l2Res, l3Res, l4Res] = await Promise.all([
      supabase.from('chameleons').select('*', { count: 'exact', head: true }),
      supabase.from('chameleons').select('*', { count: 'exact', head: true }).eq('current_level', 1),
      supabase.from('chameleons').select('*', { count: 'exact', head: true }).eq('current_level', 2),
      supabase.from('chameleons').select('*', { count: 'exact', head: true }).eq('current_level', 3),
      supabase.from('chameleons').select('*', { count: 'exact', head: true }).eq('current_level', 4),
    ])

    if (totalRes.error) {
      console.error('Error fetching users count:', totalRes.error)
      return NextResponse.json(
        { error: 'Failed to fetch user statistics' },
        { status: 500 }
      )
    }

    const totalUsers = totalRes.count || 0
    const countL1 = l1Res.count || 0
    const countL2 = l2Res.count || 0
    const countL3 = l3Res.count || 0
    const countL4 = l4Res.count || 0
    const countL0 = Math.max(0, totalUsers - (countL1 + countL2 + countL3 + countL4))

    const levelStats: Record<number, number> = {
      1: countL1,
      2: countL2,
      3: countL3,
      4: countL4,
    }
    if (countL0 > 0) {
      levelStats[0] = countL0
    }

    // Sort levels and create array matching existing API contract
    const levels = Object.entries(levelStats)
      .map(([level, count]) => ({
        level: parseInt(level),
        count,
      }))
      .sort((a, b) => a.level - b.level)

    const responseData = {
      totalUsers,
      levels,
      timestamp: new Date().toISOString(),
    }

    // Store in server-side cache
    cachedResult = { data: responseData, timestamp: Date.now() }

    return NextResponse.json(
      responseData,
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'X-Cache': 'MISS',
        },
      }
    )
  } catch (error) {
    console.error('Unexpected error in user stats API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


export const dynamic = 'force-dynamic';
