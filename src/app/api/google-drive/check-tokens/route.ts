import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { refreshAllAdminTokens } from '@/lib/google-oauth';

export async function GET(request: NextRequest) {
  try {
    // Require authenticated admin user to manually trigger token refresh
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminSupabase = createAdminClient();
    const { data: chameleon } = await adminSupabase
      .from('chameleons')
      .select('is_admin')
      .eq('auth_id', user.id)
      .single();

    if (!chameleon?.is_admin) {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    console.log('Authorized manual token check initiated by admin:', user.id);

    const result = await refreshAllAdminTokens();

    return NextResponse.json({
      success: true,
      message: 'Token refresh completed',
      refreshedCount: result.refreshedCount,
      failedCount: result.failedCount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Manual token refresh failed:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Token refresh failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
