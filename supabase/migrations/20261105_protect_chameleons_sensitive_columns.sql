-- ============================================================================
-- Migration: Protect Sensitive Columns on public.chameleons
-- Description:
--   Prevents unauthorized privilege escalation (is_super_admin, is_admin),
--   ban evasion (is_banned), identity tampering (auth_id, email, pass, status),
--   and quota spoofing (ai_credits, CAPI_REQS) from client-side PostgREST calls.
-- ============================================================================

-- 1. Create Trigger Function to block modifications to sensitive columns by non-service_role callers
CREATE OR REPLACE FUNCTION public.protect_chameleons_sensitive_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- If executed by database superuser (postgres) or Supabase backend (service_role):
  -- allow legitimate admin operations and server actions.
  IF (COALESCE(auth.role(), '') = 'service_role' OR current_user IN ('postgres', 'service_role')) THEN
    RETURN NEW;
  END IF;

  -- Block client-side / authenticated attempts to elevate privileges or unban
  IF (NEW.is_super_admin IS DISTINCT FROM OLD.is_super_admin) THEN
    RAISE EXCEPTION 'Security violation: modification of is_super_admin is forbidden.';
  END IF;

  IF (NEW.is_admin IS DISTINCT FROM OLD.is_admin) THEN
    RAISE EXCEPTION 'Security violation: modification of is_admin is forbidden.';
  END IF;

  IF (NEW.is_banned IS DISTINCT FROM OLD.is_banned) THEN
    RAISE EXCEPTION 'Security violation: modification of is_banned is forbidden.';
  END IF;

  IF (NEW.auth_id IS DISTINCT FROM OLD.auth_id) THEN
    RAISE EXCEPTION 'Security violation: modification of auth_id is forbidden.';
  END IF;

  IF (NEW.email IS DISTINCT FROM OLD.email) THEN
    RAISE EXCEPTION 'Security violation: modification of email is forbidden.';
  END IF;

  IF (NEW.created_at IS DISTINCT FROM OLD.created_at) THEN
    RAISE EXCEPTION 'Security violation: modification of created_at is forbidden.';
  END IF;

  IF (NEW.pass IS DISTINCT FROM OLD.pass) THEN
    RAISE EXCEPTION 'Security violation: direct modification of pass is forbidden.';
  END IF;

  IF (NEW.status IS DISTINCT FROM OLD.status) THEN
    RAISE EXCEPTION 'Security violation: direct modification of status is forbidden.';
  END IF;

  IF (NEW.ai_credits IS DISTINCT FROM OLD.ai_credits) THEN
    RAISE EXCEPTION 'Security violation: modification of ai_credits is forbidden.';
  END IF;

  IF (NEW.CAPI_REQS IS DISTINCT FROM OLD.CAPI_REQS) THEN
    RAISE EXCEPTION 'Security violation: modification of CAPI_REQS is forbidden.';
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Attach Trigger to public.chameleons
DROP TRIGGER IF EXISTS trg_protect_chameleons_sensitive_columns ON public.chameleons;
CREATE TRIGGER trg_protect_chameleons_sensitive_columns
BEFORE UPDATE ON public.chameleons
FOR EACH ROW
EXECUTE FUNCTION public.protect_chameleons_sensitive_columns();

-- 3. Hardened RLS Policy on public.chameleons
-- Ensure RLS is enabled
ALTER TABLE public.chameleons ENABLE ROW LEVEL SECURITY;

-- Drop any existing overly permissive update policies if present
DROP POLICY IF EXISTS "Users can update their own profile" ON public.chameleons;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.chameleons;
DROP POLICY IF EXISTS "Allow individual update" ON public.chameleons;
DROP POLICY IF EXISTS "chameleons_update_policy" ON public.chameleons;
DROP POLICY IF EXISTS "Users can update own profile" ON public.chameleons;

CREATE POLICY "Users can update own profile safe fields"
ON public.chameleons
FOR UPDATE
TO authenticated
USING (auth.uid() = auth_id)
WITH CHECK (auth.uid() = auth_id);

-- 4. Column-Level Privilege Hardening
-- Revoke broad UPDATE permissions on the whole table from public, anon, and authenticated
REVOKE UPDATE ON public.chameleons FROM PUBLIC, anon, authenticated;

-- Grant column-level UPDATE only on non-sensitive, safe profile fields
GRANT UPDATE (
  username,
  age,
  phone_number,
  profile_image,
  dark_mode,
  specialization,
  current_level,
  "Registrations",
  inventory,
  coins
) ON public.chameleons TO authenticated;

-- Ensure service_role and postgres retain full permissions
GRANT ALL ON public.chameleons TO service_role;
GRANT ALL ON public.chameleons TO postgres;
