
-- Add the missing custom_primary_color column to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS custom_primary_color TEXT DEFAULT '#0f172a';
