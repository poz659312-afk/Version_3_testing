-- ====================================================================
-- CHAMELEON GRADUATES SYSTEM & ACADEMIC ROLLOVER
-- Migration: 20260820_create_graduates_system.sql
-- Description:
--   1. Adds `status` column to existing `public.chameleons` table.
--   2. Creates dedicated `public.graduates` table for alumni metadata.
--   3. Sets up constraints, indexes, and Row Level Security (RLS).
--   4. Creates atomic & idempotent `execute_academic_rollover` RPC.
--   5. Safely backfills existing active students without graduating Year 4.
-- ====================================================================

-- ====================================================================
-- SECTION 1: SAFE SCHEMA MIGRATION ON `public.chameleons`
-- ====================================================================

-- 1.1 Add `status` column if it does not already exist
ALTER TABLE public.chameleons
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'student';

-- 1.2 Add check constraint for valid status values
ALTER TABLE public.chameleons
DROP CONSTRAINT IF EXISTS chameleons_status_check;

ALTER TABLE public.chameleons
ADD CONSTRAINT chameleons_status_check
CHECK (status IN ('student', 'graduated'));

-- 1.3 Add status & level consistency check
-- Active students have current_level 1..5; Graduated users have current_level = NULL
ALTER TABLE public.chameleons
DROP CONSTRAINT IF EXISTS chameleons_graduated_level_check;

ALTER TABLE public.chameleons
ADD CONSTRAINT chameleons_graduated_level_check
CHECK (
    (status = 'graduated' AND current_level IS NULL) OR
    (status = 'student' AND (current_level IS NULL OR current_level BETWEEN 1 AND 5))
);

-- ====================================================================
-- SECTION 2: CREATE DEDICATED `public.graduates` TABLE
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.graduates (
    student_id UUID PRIMARY KEY,
    graduation_year INTEGER NOT NULL,
    graduated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT graduates_student_fk
        FOREIGN KEY (student_id)
        REFERENCES public.chameleons(auth_id)
        ON DELETE CASCADE,

    CONSTRAINT graduates_year_check
        CHECK (
            graduation_year >= 2000
            AND graduation_year <= 2100
        )
);

-- ====================================================================
-- SECTION 3: PERFORMANCE INDEXES
-- ====================================================================

CREATE INDEX IF NOT EXISTS idx_graduates_graduation_year 
    ON public.graduates(graduation_year);

CREATE INDEX IF NOT EXISTS idx_chameleons_status_level 
    ON public.chameleons(status, current_level);

-- ====================================================================
-- SECTION 4: ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.graduates ENABLE ROW LEVEL SECURITY;

-- 4.1 Authenticated users can read their own graduate record
DROP POLICY IF EXISTS "Allow users to read own graduate record" ON public.graduates;
CREATE POLICY "Allow users to read own graduate record" ON public.graduates
    FOR SELECT
    TO authenticated
    USING (student_id = auth.uid());

-- 4.2 Read access for alumni directories and verified alumni credentials
DROP POLICY IF EXISTS "Allow public read access to alumni list" ON public.graduates;
CREATE POLICY "Allow public read access to alumni list" ON public.graduates
    FOR SELECT
    USING (true);

-- 4.3 Only platform administrators can insert/update/delete graduate records
DROP POLICY IF EXISTS "Allow admins to manage graduates" ON public.graduates;
CREATE POLICY "Allow admins to manage graduates" ON public.graduates
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.chameleons
            WHERE public.chameleons.auth_id = auth.uid()
            AND (public.chameleons.is_admin = true OR public.chameleons.is_super_admin = true)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.chameleons
            WHERE public.chameleons.auth_id = auth.uid()
            AND (public.chameleons.is_admin = true OR public.chameleons.is_super_admin = true)
        )
    );

-- ====================================================================
-- SECTION 5: ATOMIC & IDEMPOTENT ACADEMIC ROLLOVER RPC FUNCTION
-- ====================================================================

CREATE OR REPLACE FUNCTION public.execute_academic_rollover(p_graduation_year INTEGER DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_target_year INTEGER;
    v_graduated_count INTEGER := 0;
    v_promoted_to_year4 INTEGER := 0;
    v_promoted_to_year3 INTEGER := 0;
    v_promoted_to_year2 INTEGER := 0;
BEGIN
    -- 5.1 Authorization Check: When called via Supabase Client RPC, verify Admin access
    IF auth.uid() IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.chameleons
        WHERE auth_id = auth.uid()
        AND (is_admin = true OR is_super_admin = true)
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Platform administrator access required.';
    END IF;

    -- 5.2 Determine graduation year (default to current year if null or invalid)
    IF p_graduation_year IS NULL OR p_graduation_year < 2000 OR p_graduation_year > 2100 THEN
        v_target_year := EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;
    ELSE
        v_target_year := p_graduation_year;
    END IF;

    -- 5.3 Idempotently insert Year 4 students into graduates table
    INSERT INTO public.graduates (student_id, graduation_year, graduated_at)
    SELECT auth_id, v_target_year, NOW()
    FROM public.chameleons
    WHERE status = 'student' AND current_level = 4
    ON CONFLICT (student_id) DO NOTHING;

    -- 5.4 Update Year 4 students to 'graduated' status and clear current_level to NULL
    WITH graduated_rows AS (
        UPDATE public.chameleons
        SET status = 'graduated', current_level = NULL
        WHERE status = 'student' AND current_level = 4
        RETURNING auth_id
    )
    SELECT COUNT(*) INTO v_graduated_count FROM graduated_rows;

    -- 5.5 Simultaneously promote active students (1->2, 2->3, 3->4) in a single CASE update
    -- This atomic CASE operation guarantees students are promoted exactly once
    WITH promoted_rows AS (
        UPDATE public.chameleons
        SET current_level = CASE
            WHEN current_level = 3 THEN 4
            WHEN current_level = 2 THEN 3
            WHEN current_level = 1 THEN 2
            ELSE current_level
        END
        WHERE status = 'student' AND current_level IN (1, 2, 3)
        RETURNING current_level
    )
    SELECT
        COALESCE(COUNT(*) FILTER (WHERE current_level = 4), 0),
        COALESCE(COUNT(*) FILTER (WHERE current_level = 3), 0),
        COALESCE(COUNT(*) FILTER (WHERE current_level = 2), 0)
    INTO v_promoted_to_year4, v_promoted_to_year3, v_promoted_to_year2
    FROM promoted_rows;

    -- 5.6 Return structured JSON response
    RETURN jsonb_build_object(
        'success', true,
        'graduation_year', v_target_year,
        'graduated_count', v_graduated_count,
        'promoted_to_year4', v_promoted_to_year4,
        'promoted_to_year3', v_promoted_to_year3,
        'promoted_to_year2', v_promoted_to_year2,
        'executed_at', NOW()
    );
END;
$$;

-- ====================================================================
-- SECTION 6: SAFE DATA BACKFILL (DO NOT GRADUATE YEAR 4 HERE)
-- ====================================================================

-- Safely backfill any existing users without a status to 'student'
UPDATE public.chameleons
SET status = 'student'
WHERE status IS NULL OR status = '';

-- Note: Active Year 4 students are intentionally kept as students with current_level = 4.
-- They will only graduate when the administrator triggers execute_academic_rollover().

-- ====================================================================
-- SECTION 7: AUTOMATIC TRIGGER FOR MANUAL STATUS CHANGES
-- ====================================================================

-- Trigger function: automatically inserts into `public.graduates`
-- whenever a user's status is changed to 'graduated' (e.g. from Table Editor or SQL)
CREATE OR REPLACE FUNCTION public.handle_graduate_sync_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NEW.status = 'graduated' THEN
        INSERT INTO public.graduates (student_id, graduation_year, graduated_at)
        VALUES (
            NEW.auth_id,
            EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
            NOW()
        )
        ON CONFLICT (student_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_chameleons_graduates ON public.chameleons;
CREATE TRIGGER trg_sync_chameleons_graduates
AFTER INSERT OR UPDATE OF status ON public.chameleons
FOR EACH ROW
WHEN (NEW.status = 'graduated')
EXECUTE FUNCTION public.handle_graduate_sync_trigger();

-- Initial sync for anyone currently marked as 'graduated'
INSERT INTO public.graduates (student_id, graduation_year, graduated_at)
SELECT auth_id, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER, NOW()
FROM public.chameleons
WHERE status = 'graduated'
ON CONFLICT (student_id) DO NOTHING;

