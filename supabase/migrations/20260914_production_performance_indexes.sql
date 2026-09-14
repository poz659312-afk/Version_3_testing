-- ==============================================================================
-- Production Performance & Scalability Indexes Migration
-- Date: 2026-09-14
-- Purpose: Eliminate sequential table scans across high-volume tables
--          (Notifications 31k+ rows, quiz_data 18k+ rows, chameleons 4k+ rows)
--          and provide atomic transactional RPCs for coins and AI credits.
-- ==============================================================================

-- 1. Notifications table performance indexes
-- Solves sequential scans on notifications list and unread badge count
CREATE INDEX IF NOT EXISTS idx_notifications_auth_id_created_at 
ON public."Notifications" (auth_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_auth_id_is_read 
ON public."Notifications" (auth_id, is_read);

-- 2. Quiz Data performance indexes
-- Accelerates student profile stats, leaderboards, and subject performance lookups
CREATE INDEX IF NOT EXISTS idx_quiz_data_auth_id_created_at 
ON public.quiz_data (auth_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_quiz_data_quiz_id 
ON public.quiz_data (quiz_id);

CREATE INDEX IF NOT EXISTS idx_quiz_data_quiz_level 
ON public.quiz_data (quiz_level);

-- 3. Chameleons table performance indexes
-- Optimizes academic queries, auth lookups, and cron sweep operations
CREATE INDEX IF NOT EXISTS idx_chameleons_auth_id 
ON public.chameleons (auth_id);

CREATE INDEX IF NOT EXISTS idx_chameleons_specialization_level 
ON public.chameleons (specialization, current_level);

CREATE INDEX IF NOT EXISTS idx_chameleons_deletion_scheduled 
ON public.chameleons (deletion_scheduled_at) 
WHERE deletion_scheduled_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_chameleons_is_banned 
ON public.chameleons (is_banned) 
WHERE is_banned = TRUE;

-- 4. Study Spaces messaging and membership indexes
-- Speeds up room chat pagination, member lookups, and reaction aggregations
CREATE INDEX IF NOT EXISTS idx_study_room_messages_room_created 
ON public.study_room_messages (room_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_study_room_members_room_user 
ON public.study_room_members (room_id, user_id, status);

CREATE INDEX IF NOT EXISTS idx_study_room_members_user_status 
ON public.study_room_members (user_id, status);

CREATE INDEX IF NOT EXISTS idx_study_room_reactions_msg 
ON public.study_room_message_reactions (message_id);

-- 5. Atomic RPC: Increment User Coins
-- Prevents lost updates and race conditions during concurrent quiz submissions
CREATE OR REPLACE FUNCTION public.increment_user_coins(
  p_auth_id UUID,
  p_amount INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  IF p_amount <= 0 THEN
    SELECT coins INTO v_new_balance FROM public.chameleons WHERE auth_id = p_auth_id;
    RETURN COALESCE(v_new_balance, 0);
  END IF;

  UPDATE public.chameleons
  SET coins = COALESCE(coins, 0) + p_amount
  WHERE auth_id = p_auth_id
  RETURNING coins INTO v_new_balance;

  RETURN COALESCE(v_new_balance, 0);
END;
$$;

-- 6. Atomic RPC: Deduct AI Credits
-- Prevents double-spend and ensures non-negative daily balance
CREATE OR REPLACE FUNCTION public.deduct_ai_credit(
  p_auth_id UUID,
  p_cost INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated_rows INTEGER;
BEGIN
  UPDATE public.chameleons
  SET ai_credits = ai_credits - p_cost
  WHERE auth_id = p_auth_id
    AND ai_credits >= p_cost;

  GET DIAGNOSTICS v_updated_rows = ROW_COUNT;
  RETURN v_updated_rows > 0;
END;
$$;
