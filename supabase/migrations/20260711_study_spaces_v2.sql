-- 1. Alter study_room_members table to add study metrics, streaks, and focus state
ALTER TABLE public.study_room_members 
ADD COLUMN IF NOT EXISTS total_study_time INTEGER NOT NULL DEFAULT 0, -- in seconds
ADD COLUMN IF NOT EXISTS current_streak INTEGER NOT NULL DEFAULT 0, -- in days
ADD COLUMN IF NOT EXISTS longest_streak INTEGER NOT NULL DEFAULT 0, -- in days
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_study_date DATE,
ADD COLUMN IF NOT EXISTS weekly_study_time INTEGER NOT NULL DEFAULT 0, -- in seconds
ADD COLUMN IF NOT EXISTS is_focusing BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS focus_timer_ends_at TIMESTAMP WITH TIME ZONE;

-- 2. Create study_room_polls table
CREATE TABLE IF NOT EXISTS public.study_room_polls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.chameleons(auth_id) ON DELETE SET NULL,
    question TEXT NOT NULL,
    options JSONB NOT NULL, -- e.g., ["Choice A", "Choice B"]
    is_multiple_choice BOOLEAN NOT NULL DEFAULT false,
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create study_room_poll_votes table
CREATE TABLE IF NOT EXISTS public.study_room_poll_votes (
    poll_id UUID NOT NULL REFERENCES public.study_room_polls(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.chameleons(auth_id) ON DELETE CASCADE,
    selected_options JSONB NOT NULL, -- e.g., [0, 2]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (poll_id, user_id)
);

-- 4. Create study_room_daily_challenges table
CREATE TABLE IF NOT EXISTS public.study_room_daily_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.chameleons(auth_id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    xp_reward INTEGER NOT NULL DEFAULT 100,
    challenge_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (room_id, challenge_date)
);

-- 5. Create study_room_challenge_progress table
CREATE TABLE IF NOT EXISTS public.study_room_challenge_progress (
    challenge_id UUID NOT NULL REFERENCES public.study_room_daily_challenges(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.chameleons(auth_id) ON DELETE CASCADE,
    progress INTEGER NOT NULL DEFAULT 0, -- e.g., 0 to 100
    is_completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (challenge_id, user_id)
);

-- 6. Create study_room_message_reactions table (Silent Reactions)
CREATE TABLE IF NOT EXISTS public.study_room_message_reactions (
    message_id UUID NOT NULL REFERENCES public.study_room_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.chameleons(auth_id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    PRIMARY KEY (message_id, user_id, emoji)
);

-- 7. Create study_room_quizzes table (Quiz Message)
CREATE TABLE IF NOT EXISTS public.study_room_quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.chameleons(auth_id) ON DELETE SET NULL,
    question TEXT NOT NULL,
    options JSONB NOT NULL, -- e.g., ["True", "False"]
    correct_answer TEXT NOT NULL,
    countdown_seconds INTEGER,
    ends_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Create study_room_quiz_answers table
CREATE TABLE IF NOT EXISTS public.study_room_quiz_answers (
    quiz_id UUID NOT NULL REFERENCES public.study_room_quizzes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.chameleons(auth_id) ON DELETE CASCADE,
    answer TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (quiz_id, user_id)
);

-- 9. Create study_room_resources table (Resource Library)
CREATE TABLE IF NOT EXISTS public.study_room_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
    file_id TEXT NOT NULL,
    name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size TEXT,
    web_view_link TEXT,
    web_content_link TEXT,
    thumbnail_link TEXT,
    added_by UUID REFERENCES public.chameleons(auth_id) ON DELETE SET NULL,
    views_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (room_id, file_id)
);

-- Enable RLS for new tables
ALTER TABLE public.study_room_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_room_poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_room_daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_room_challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_room_message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_room_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_room_quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_room_resources ENABLE ROW LEVEL SECURITY;

-- Enable Select for all authenticated users on study rooms tables
CREATE POLICY "Allow select polls for auth users" ON public.study_room_polls FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow select votes for auth users" ON public.study_room_poll_votes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow select challenges for auth users" ON public.study_room_daily_challenges FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow select progress for auth users" ON public.study_room_challenge_progress FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow select reactions for auth users" ON public.study_room_message_reactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow select quizzes for auth users" ON public.study_room_quizzes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow select answers for auth users" ON public.study_room_quiz_answers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow select resources for auth users" ON public.study_room_resources FOR SELECT TO authenticated USING (true);

-- Insert policies for room members
CREATE POLICY "Allow insert polls for room members" ON public.study_room_polls FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.study_room_members 
        WHERE room_id = study_room_polls.room_id AND user_id = auth.uid() AND status = 'approved'
    )
);

CREATE POLICY "Allow insert votes for room members" ON public.study_room_poll_votes FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = user_id AND EXISTS (
        SELECT 1 FROM public.study_room_members 
        WHERE room_id = (SELECT room_id FROM public.study_room_polls WHERE id = poll_id) 
        AND user_id = auth.uid() AND status = 'approved'
    )
);

CREATE POLICY "Allow insert challenges for room members" ON public.study_room_daily_challenges FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.study_room_members 
        WHERE room_id = study_room_daily_challenges.room_id AND user_id = auth.uid() AND status = 'approved'
    )
);

CREATE POLICY "Allow insert progress for room members" ON public.study_room_challenge_progress FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = user_id AND EXISTS (
        SELECT 1 FROM public.study_room_members 
        WHERE room_id = (SELECT room_id FROM public.study_room_daily_challenges WHERE id = challenge_id) 
        AND user_id = auth.uid() AND status = 'approved'
    )
);

CREATE POLICY "Allow insert reactions for room members" ON public.study_room_message_reactions FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = user_id AND EXISTS (
        SELECT 1 FROM public.study_room_members 
        WHERE room_id = (SELECT room_id FROM public.study_room_messages WHERE id = message_id) 
        AND user_id = auth.uid() AND status = 'approved'
    )
);

CREATE POLICY "Allow insert quizzes for room members" ON public.study_room_quizzes FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.study_room_members 
        WHERE room_id = study_room_quizzes.room_id AND user_id = auth.uid() AND status = 'approved'
    )
);

CREATE POLICY "Allow insert answers for room members" ON public.study_room_quiz_answers FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = user_id AND EXISTS (
        SELECT 1 FROM public.study_room_members 
        WHERE room_id = (SELECT room_id FROM public.study_room_quizzes WHERE id = quiz_id) 
        AND user_id = auth.uid() AND status = 'approved'
    )
);

CREATE POLICY "Allow insert resources for room members" ON public.study_room_resources FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.study_room_members 
        WHERE room_id = study_room_resources.room_id AND user_id = auth.uid() AND status = 'approved'
    )
);

-- Manage/Update/Delete policies (only creators/admins can change settings/resources, users can delete their own reactions/votes)
CREATE POLICY "Allow delete reactions for owner" ON public.study_room_message_reactions FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Allow delete resources for space managers" ON public.study_room_resources FOR DELETE TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.study_room_members 
        WHERE room_id = study_room_resources.room_id AND user_id = auth.uid() AND role IN ('creator', 'admin') AND status = 'approved'
    )
);

-- Update Realtime publication
BEGIN;
  -- Add new tables to replication
  ALTER PUBLICATION supabase_realtime ADD TABLE public.study_room_polls;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.study_room_poll_votes;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.study_room_daily_challenges;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.study_room_challenge_progress;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.study_room_message_reactions;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.study_room_quizzes;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.study_room_quiz_answers;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.study_room_resources;
COMMIT;
