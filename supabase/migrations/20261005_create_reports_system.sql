-- Migration: 20261005_create_reports_system.sql
-- Description: Create user complaints and issues reporting table, RLS policies, and indexes

-- 1. Create the reports table
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.chameleons(auth_id) ON DELETE SET NULL,
    username TEXT NOT NULL,
    user_email TEXT,
    user_phone TEXT,
    category TEXT NOT NULL CHECK (category IN ('bug', 'content', 'account', 'feature_request', 'other')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'urgent')),
    page_url TEXT,
    screenshot_url TEXT,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    admin_reply TEXT,
    admin_id UUID REFERENCES public.chameleons(auth_id) ON DELETE SET NULL,
    admin_name TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON public.reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_category ON public.reports(category);

-- 3. Automatic updated_at trigger
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_reports_updated_at ON public.reports;
CREATE TRIGGER trigger_reports_updated_at
    BEFORE UPDATE ON public.reports
    FOR EACH ROW
    EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Users can view their own reports
DROP POLICY IF EXISTS "Users can view their own reports" ON public.reports;
CREATE POLICY "Users can view their own reports" ON public.reports
    FOR SELECT
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.chameleons
            WHERE public.chameleons.auth_id = auth.uid()
            AND (public.chameleons.is_admin = true OR public.chameleons.is_super_admin = true)
        )
    );

-- Authenticated users can insert their own reports
DROP POLICY IF EXISTS "Users can insert their own reports" ON public.reports;
CREATE POLICY "Users can insert their own reports" ON public.reports
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        OR user_id IS NULL
    );

-- Admins can update any report (status, admin_reply, etc.)
DROP POLICY IF EXISTS "Admins can update reports" ON public.reports;
CREATE POLICY "Admins can update reports" ON public.reports
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.chameleons
            WHERE public.chameleons.auth_id = auth.uid()
            AND (public.chameleons.is_admin = true OR public.chameleons.is_super_admin = true)
        )
    );

-- Admins can delete reports if needed
DROP POLICY IF EXISTS "Admins can delete reports" ON public.reports;
CREATE POLICY "Admins can delete reports" ON public.reports
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.chameleons
            WHERE public.chameleons.auth_id = auth.uid()
            AND (public.chameleons.is_admin = true OR public.chameleons.is_super_admin = true)
        )
    );
