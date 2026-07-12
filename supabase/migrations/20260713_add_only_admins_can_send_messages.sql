-- Alter public.study_rooms
ALTER TABLE public.study_rooms 
ADD COLUMN IF NOT EXISTS only_admins_can_send_messages BOOLEAN NOT NULL DEFAULT false;
