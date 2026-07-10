-- 1. Create study_rooms table
CREATE TABLE IF NOT EXISTS public.study_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    specialization TEXT NOT NULL,
    level_num INTEGER NOT NULL,
    created_by UUID REFERENCES public.chameleons(auth_id) ON DELETE SET NULL,
    scratchpad_content TEXT DEFAULT '' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create study_room_members table
CREATE TABLE IF NOT EXISTS public.study_room_members (
    room_id UUID REFERENCES public.study_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.chameleons(auth_id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member', -- 'creator' | 'moderator' | 'member'
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (room_id, user_id)
);

-- 3. Create study_room_messages table for live chat/Q&A
CREATE TABLE IF NOT EXISTS public.study_room_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES public.study_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.chameleons(auth_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_question BOOLEAN DEFAULT false NOT NULL, -- marks if it's a Q&A board item
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create study_room_challenges table for live quiz battles
CREATE TABLE IF NOT EXISTS public.study_room_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES public.study_rooms(id) ON DELETE CASCADE,
    quiz_code TEXT REFERENCES public.quiz_department(code) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'active' | 'completed'
    started_by UUID REFERENCES public.chameleons(auth_id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.study_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_room_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_room_challenges ENABLE ROW LEVEL SECURITY;

-- Create Policies
-- A. study_rooms
CREATE POLICY "Allow public select for authenticated users" ON public.study_rooms
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow insert for admins only" ON public.study_rooms
    FOR INSERT TO authenticated WITH CHECK (
        auth.uid() = created_by AND
        EXISTS (
            SELECT 1 FROM public.chameleons
            WHERE auth_id = auth.uid() AND (is_admin = true OR is_super_admin = true)
        )
    );

CREATE POLICY "Allow update for room creator" ON public.study_rooms
    FOR UPDATE TO authenticated USING (
        auth.uid() = created_by OR 
        EXISTS (
            SELECT 1 FROM public.study_room_members 
            WHERE room_id = id AND user_id = auth.uid() AND role = 'creator'
        )
    );

CREATE POLICY "Allow delete for room creator" ON public.study_rooms
    FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- B. study_room_members
CREATE POLICY "Allow select for room members" ON public.study_room_members
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow insert for self join" ON public.study_room_members
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow update/delete for self or room creator" ON public.study_room_members
    FOR ALL TO authenticated USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM public.study_rooms 
            WHERE id = room_id AND created_by = auth.uid()
        )
    );

-- C. study_room_messages
CREATE POLICY "Allow select messages for authenticated users" ON public.study_room_messages
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow insert messages for room members" ON public.study_room_messages
    FOR INSERT TO authenticated WITH CHECK (
        auth.uid() = user_id AND 
        EXISTS (
            SELECT 1 FROM public.study_room_members 
            WHERE room_id = study_room_messages.room_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Allow delete messages for message owner" ON public.study_room_messages
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- D. study_room_challenges
CREATE POLICY "Allow select challenges for authenticated users" ON public.study_room_challenges
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow insert challenges for room members" ON public.study_room_challenges
    FOR INSERT TO authenticated WITH CHECK (
        auth.uid() = started_by AND 
        EXISTS (
            SELECT 1 FROM public.study_room_members 
            WHERE room_id = study_room_challenges.room_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Allow update challenges for room members" ON public.study_room_challenges
    FOR UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.study_room_members 
            WHERE room_id = study_room_challenges.room_id AND user_id = auth.uid()
        )
    );

-- 6. Setup Supabase Realtime replication
BEGIN;
  -- Remove if already exists
  DROP POLICY IF EXISTS "realtime_policy" ON public.study_room_messages;
  
  -- Add tables to realtime publication
  ALTER PUBLICATION supabase_realtime ADD TABLE public.study_room_messages;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.study_rooms;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.study_room_challenges;
COMMIT;
