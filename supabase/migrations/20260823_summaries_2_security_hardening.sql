-- ============================================================================
-- Chameleon Summaries 2.0 — Security Hardening Migration
-- 1. Hardens public.support_summary RPC with search_path, identity validation, and restricted execution.
-- 2. Protects summaries.votes and summaries.earned_coins from direct client PostgREST updates.
-- ============================================================================

-- 1. Hardened Atomic Support RPC Function
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
    -- Security Check: If invoked with an authenticated JWT session, enforce caller identity
    IF auth.uid() IS NOT NULL AND auth.uid() <> p_student_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Caller identity mismatch.');
    END IF;

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

    -- Step F: Return success payload
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Revoke direct RPC execution from public/anon/authenticated clients
-- (Function will be executed exclusively via backend service_role / secure server actions)
REVOKE EXECUTE ON FUNCTION public.support_summary(UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.support_summary(UUID, UUID) TO service_role;


-- 2. Trigger to Protect votes and earned_coins on summaries table
-- Preserves contributor's ability to update title, description, subject_id, status, etc.
-- Blocks any direct PostgREST modification of votes or earned_coins by authenticated users.
CREATE OR REPLACE FUNCTION public.protect_summary_financial_counters()
RETURNS TRIGGER AS $$
BEGIN
    -- If executed in the context of regular authenticated/anon client via PostgREST
    IF (COALESCE(auth.role(), '') IN ('authenticated', 'anon') AND current_user NOT IN ('postgres', 'service_role')) THEN
        IF (NEW.votes IS DISTINCT FROM OLD.votes OR NEW.earned_coins IS DISTINCT FROM OLD.earned_coins) THEN
            RAISE EXCEPTION 'Unauthorized: Financial counters (votes, earned_coins) cannot be modified directly.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS tr_protect_summary_counters ON public.summaries;
CREATE TRIGGER tr_protect_summary_counters
BEFORE UPDATE ON public.summaries
FOR EACH ROW
EXECUTE FUNCTION public.protect_summary_financial_counters();
