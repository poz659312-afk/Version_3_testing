import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('chameleons')
      .select('Registrations')
      .eq('email', 'tokyo9900777@gmail.com')
      .maybeSingle()

    if (error || !data) {
      return NextResponse.json({ paused: false })
    }

    const regs = (data as any)?.Registrations
    const paused = regs?.pause_chameleon === true

    return NextResponse.json({ paused })
  } catch (error) {
    console.error('Error fetching platform status:', error)
    return NextResponse.json({ paused: false }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
