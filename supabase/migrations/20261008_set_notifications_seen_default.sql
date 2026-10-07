-- Migration: Set default for Notifications.seen to 'false'
-- Ensures newly inserted notifications are not NULL and can be recognized by markAllAsRead

ALTER TABLE IF EXISTS public."Notifications" 
  ALTER COLUMN seen SET DEFAULT 'false';

-- Clean up any existing notifications where seen is NULL
UPDATE public."Notifications"
  SET seen = 'false'
  WHERE seen IS NULL;
