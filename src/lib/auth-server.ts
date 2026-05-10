import { createServerSupabaseClient } from '@/lib/supabase/server';
import { StudentUser } from './auth';

/**
 * Get current authenticated user from Supabase Auth + app database (SERVER SIDE)
 * Use this in API routes and Server Components ONLY.
 * This file contains server-only imports (next/headers).
 */
export async function getServerStudentSession(): Promise<StudentUser | null> {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session?.user) {
      return null;
    }
    const user = session.user;

    const { data: userData, error: dbError } = await supabase
      .from('chameleons')
      .select('auth_id, username, phone_number, specialization, age, current_level, is_admin, is_banned, created_at, profile_image, email, coins, inventory')
      .eq('auth_id', user.id)
      .single();

    if (dbError || !userData) {
      return null;
    }

    return {
      auth_id: userData.auth_id,
      username: userData.username,
      phone_number: userData.phone_number,
      specialization: userData.specialization,
      age: userData.age,
      current_level: userData.current_level,
      is_admin: userData.is_admin,
      is_banned: userData.is_banned,
      created_at: userData.created_at,
      profile_image: userData.profile_image,
      email: userData.email,
      coins: userData.coins || 0,
      inventory: userData.inventory || []
    };
  } catch (error) {
    console.error('Error getting server student session:', error);
    return null;
  }
}
