
-- Add columns for API keys to the user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN openai_api_key TEXT,
ADD COLUMN google_gemini_api_key TEXT,
ADD COLUMN anthropic_api_key TEXT,
ADD COLUMN selected_theme TEXT DEFAULT 'modern';

-- Update the updated_at timestamp when these fields are modified
-- The existing trigger will handle this automatically
