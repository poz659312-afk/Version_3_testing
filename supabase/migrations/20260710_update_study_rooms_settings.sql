-- Alter public.study_rooms
ALTER TABLE public.study_rooms 
ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
ADD COLUMN IF NOT EXISTS join_approval TEXT NOT NULL DEFAULT 'immediate' CHECK (join_approval IN ('immediate', 'requires_approval'));

-- Alter public.study_room_members
ALTER TABLE public.study_room_members 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved'));
