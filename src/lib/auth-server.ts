import { cache } from 'react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { StudentUser } from './auth';

/**
 * Get current authenticated user from Supabase Auth + app database (SERVER SIDE)
 * Use this in API routes and Server Components ONLY.
 * Memoized using React.cache() to deduplicate requests within the same SSR render lifecycle.
 */
export const getServerStudentSession = cache(async (): Promise<StudentUser | null> => {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return null;
    }

    let userData: any = null;
    let dbError: any = null;

    const res = await supabase
      .from('chameleons')
      .select('auth_id, username, phone_number, specialization, age, current_level, status, is_admin, is_banned, created_at, profile_image, email, coins, inventory, Registrations, is_super_admin')
      .eq('auth_id', user.id)
      .single();

    userData = res.data;
    dbError = res.error;

    // Fallback if status column is not yet present
    if (dbError && dbError.message?.includes('status')) {
      const fallbackRes = await supabase
        .from('chameleons')
        .select('auth_id, username, phone_number, specialization, age, current_level, is_admin, is_banned, created_at, profile_image, email, coins, inventory, Registrations, is_super_admin')
        .eq('auth_id', user.id)
        .single();
      userData = fallbackRes.data;
      dbError = fallbackRes.error;
    }

    if (dbError || !userData) {
      return null;
    }

    const userStatus: 'student' | 'graduated' = (userData as any).status || (userData.current_level === null ? 'graduated' : 'student');

    return {
      auth_id: userData.auth_id,
      username: userData.username,
      phone_number: userData.phone_number,
      specialization: userData.specialization,
      age: userData.age,
      current_level: userData.current_level,
      status: userStatus,
      is_admin: userData.is_admin,
      is_banned: userData.is_banned,
      created_at: userData.created_at,
      profile_image: userData.profile_image,
      email: userData.email,
      coins: userData.coins || 0,
      inventory: userData.inventory || [],
      Registrations: userData.Registrations || null,
      is_super_admin: userData.is_super_admin || false
    };
  } catch (error) {
    console.error('Error getting server student session:', error);
    return null;
  }
})
