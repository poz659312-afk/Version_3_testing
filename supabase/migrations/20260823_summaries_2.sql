-- ============================================================================
-- Chameleon Summaries 2.0 Migration
-- Replaces old Word-like summary editor with Contributor + Google Drive system.
-- Includes Atomic Support Operation (100 Coins = 60 to Contributor + 40 to Chameleon).
-- NO vote/transaction ledger tables created.
-- ============================================================================

-- 1. Create contributors table
CREATE TABLE IF NOT EXISTS public.contributors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL UNIQUE REFERENCES public.chameleons(auth_id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    bio TEXT,
    avatar_url TEXT,
    drive_folder_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create / update summaries table
CREATE TABLE IF NOT EXISTS public.summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contributor_id UUID NOT NULL REFERENCES public.contributors(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    subject_id TEXT,
    drive_file_id TEXT NOT NULL,
    drive_folder_id TEXT,
    drive_url TEXT,
    file_name TEXT NOT NULL,
    file_type TEXT DEFAULT 'pdf',
    file_size BIGINT DEFAULT 0,
    votes INTEGER NOT NULL DEFAULT 0,
    earned_coins INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'published',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Gracefully ensure columns exist if summaries was created in previous schema
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'summaries' AND column_name = 'id') THEN
        ALTER TABLE public.summaries ADD COLUMN id UUID DEFAULT gen_random_uuid();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'summaries' AND column_name = 'contributor_id') THEN
        ALTER TABLE public.summaries ADD COLUMN contributor_id UUID REFERENCES public.contributors(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'summaries' AND column_name = 'description') THEN
        ALTER TABLE public.summaries ADD COLUMN description TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'summaries' AND column_name = 'subject_id') THEN
        ALTER TABLE public.summaries ADD COLUMN subject_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'summaries' AND column_name = 'drive_file_id') THEN
        ALTER TABLE public.summaries ADD COLUMN drive_file_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'summaries' AND column_name = 'drive_folder_id') THEN
        ALTER TABLE public.summaries ADD COLUMN drive_folder_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'summaries' AND column_name = 'drive_url') THEN
        ALTER TABLE public.summaries ADD COLUMN drive_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'summaries' AND column_name = 'file_name') THEN
        ALTER TABLE public.summaries ADD COLUMN file_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'summaries' AND column_name = 'file_type') THEN
        ALTER TABLE public.summaries ADD COLUMN file_type TEXT DEFAULT 'pdf';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'summaries' AND column_name = 'file_size') THEN
        ALTER TABLE public.summaries ADD COLUMN file_size BIGINT DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'summaries' AND column_name = 'votes') THEN
        ALTER TABLE public.summaries ADD COLUMN votes INTEGER NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'summaries' AND column_name = 'earned_coins') THEN
        ALTER TABLE public.summaries ADD COLUMN earned_coins INTEGER NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'summaries' AND column_name = 'status') THEN
        ALTER TABLE public.summaries ADD COLUMN status TEXT NOT NULL DEFAULT 'published';
    END IF;
END $$;

-- 3. Create Indexes
CREATE INDEX IF NOT EXISTS idx_contributors_admin_id ON public.contributors(admin_id);
CREATE INDEX IF NOT EXISTS idx_contributors_username ON public.contributors(username);
CREATE INDEX IF NOT EXISTS idx_summaries_contributor_id ON public.summaries(contributor_id);
CREATE INDEX IF NOT EXISTS idx_summaries_subject_id ON public.summaries(subject_id);
CREATE INDEX IF NOT EXISTS idx_summaries_status ON public.summaries(status);
CREATE INDEX IF NOT EXISTS idx_summaries_votes ON public.summaries(votes DESC);

-- 4. Enable RLS
ALTER TABLE public.contributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.summaries ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for contributors
DROP POLICY IF EXISTS "Public can view contributor profiles" ON public.contributors;
CREATE POLICY "Public can view contributor profiles" ON public.contributors
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Admins can create their own contributor profile" ON public.contributors;
CREATE POLICY "Admins can create their own contributor profile" ON public.contributors
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = admin_id
        AND EXISTS (
            SELECT 1 FROM public.chameleons
            WHERE public.chameleons.auth_id = auth.uid()
            AND (public.chameleons.is_admin = true OR public.chameleons.is_super_admin = true)
        )
    );

DROP POLICY IF EXISTS "Contributors can update their own profile" ON public.contributors;
CREATE POLICY "Contributors can update their own profile" ON public.contributors
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = admin_id)
    WITH CHECK (auth.uid() = admin_id);

-- 6. RLS Policies for summaries
DROP POLICY IF EXISTS "Public can view published summaries" ON public.summaries;
CREATE POLICY "Public can view published summaries" ON public.summaries
    FOR SELECT
    USING (status = 'published');

DROP POLICY IF EXISTS "Contributors can view all their own summaries" ON public.summaries;
CREATE POLICY "Contributors can view all their own summaries" ON public.summaries
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.contributors c
            WHERE c.id = public.summaries.contributor_id
            AND c.admin_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.chameleons
            WHERE public.chameleons.auth_id = auth.uid()
            AND (public.chameleons.is_admin = true OR public.chameleons.is_super_admin = true)
        )
    );

DROP POLICY IF EXISTS "Contributors can insert their own summaries" ON public.summaries;
CREATE POLICY "Contributors can insert their own summaries" ON public.summaries
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.contributors c
            WHERE c.id = contributor_id
            AND c.admin_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Contributors can update their own summaries metadata" ON public.summaries;
CREATE POLICY "Contributors can update their own summaries metadata" ON public.summaries
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.contributors c
            WHERE c.id = public.summaries.contributor_id
            AND c.admin_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.contributors c
            WHERE c.id = public.summaries.contributor_id
            AND c.admin_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Contributors can delete their own summaries" ON public.summaries;
CREATE POLICY "Contributors can delete their own summaries" ON public.summaries
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.contributors c
            WHERE c.id = public.summaries.contributor_id
            AND c.admin_id = auth.uid()
        )
    );

-- 7. Atomic Server-Side Support RPC Function
-- Deducts 100 coins from student, credits 60 to contributor, increments votes by 1 and earned_coins by 60.
-- Platform retains 40 coins conceptually without ledger row.
CREATE OR REPLACE FUNCTION public.support_summary(p_summary_id UUID, p_student_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_student_coins INTEGER;
    v_summary RECORD;
    v_contributor_admin_id UUID;
    v_new_student_coins INTEGER;
    v_new_votes INTEGER;
    v_new_earned_coins INTEGER;
BEGIN
    -- Step A: Validate and lock student account
    SELECT coins INTO v_student_coins
    FROM public.chameleons
    WHERE auth_id = p_student_id
    FOR UPDATE;

    IF v_student_coins IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Student user not found.');
    END IF;

    IF v_student_coins < 100 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient coins. You need at least 100 Chameleon Coins.');
    END IF;

    -- Step B: Validate and lock summary & find contributor
    SELECT s.id, s.status, s.contributor_id, s.votes, s.earned_coins, c.admin_id
    INTO v_summary
    FROM public.summaries s
    JOIN public.contributors c ON c.id = s.contributor_id
    WHERE s.id = p_summary_id
    FOR UPDATE;

    IF v_summary.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Summary not found.');
    END IF;

    IF v_summary.status <> 'published' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Summary is not published.');
    END IF;

    v_contributor_admin_id := v_summary.admin_id;

    -- Step C: Deduct 100 Coins from student
    UPDATE public.chameleons
    SET coins = coins - 100
    WHERE auth_id = p_student_id
    RETURNING coins INTO v_new_student_coins;

    -- Step D: Credit 60 Coins to Contributor (Admin)
    UPDATE public.chameleons
    SET coins = coins + 60
    WHERE auth_id = v_contributor_admin_id;

    -- Step E: Increment summary counters
    UPDATE public.summaries
    SET votes = votes + 1,
        earned_coins = earned_coins + 60,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_summary_id
    RETURNING votes, earned_coins INTO v_new_votes, v_new_earned_coins;

    -- Step F: Commit & return success payload
    RETURN jsonb_build_object(
        'success', true,
        'summary_id', p_summary_id,
        'new_balance', v_new_student_coins,
        'votes', v_new_votes,
        'earned_coins', v_new_earned_coins
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
