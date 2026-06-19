-- ==========================================
-- Secure Admin Management Database Setup
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. Create drive_access_rules table
CREATE TABLE IF NOT EXISTS public.drive_access_rules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  specialization text,
  current_level integer,
  folder_id text NOT NULL,
  folder_name text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on drive_access_rules
ALTER TABLE public.drive_access_rules ENABLE ROW LEVEL SECURITY;

-- 2. Create admin_audit_logs table
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  admin_auth_id uuid NOT NULL REFERENCES public.chameleons(auth_id) ON DELETE CASCADE,
  admin_email text,
  admin_username text,
  action text NOT NULL, -- e.g., 'UPDATE_USER_PERMISSIONS', 'CREATE_ACCESS_RULE', 'DELETE_ACCESS_RULE'
  target_auth_id uuid REFERENCES public.chameleons(auth_id) ON DELETE SET NULL,
  target_email text,
  target_username text,
  details jsonb NOT NULL
);

-- Enable RLS on admin_audit_logs
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- 3. Setup RLS Policies

-- Policy for drive_access_rules: only super admins can perform actions
DROP POLICY IF EXISTS "Super admins can manage access rules" ON public.drive_access_rules;
CREATE POLICY "Super admins can manage access rules"
  ON public.drive_access_rules
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chameleons
      WHERE chameleons.auth_id = auth.uid() AND chameleons.is_super_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chameleons
      WHERE chameleons.auth_id = auth.uid() AND chameleons.is_super_admin = true
    )
  );

-- Policy for admin_audit_logs: only super admins can select logs
DROP POLICY IF EXISTS "Super admins can select audit logs" ON public.admin_audit_logs;
CREATE POLICY "Super admins can select audit logs"
  ON public.admin_audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chameleons
      WHERE chameleons.auth_id = auth.uid() AND chameleons.is_super_admin = true
    )
  );

-- Policy for admin_audit_logs: admins or super admins can insert logs
DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can insert audit logs"
  ON public.admin_audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chameleons
      WHERE chameleons.auth_id = auth.uid() AND (chameleons.is_admin = true OR chameleons.is_super_admin = true)
    )
  );

-- 4. Promote developer account to Super Admin (Modify email if needed)
UPDATE public.chameleons 
SET is_super_admin = true, is_admin = true
WHERE email = 'poz659312@gmail.com';
