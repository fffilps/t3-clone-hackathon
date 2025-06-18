
-- Create a table to store user API keys securely
CREATE TABLE public.user_api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  provider TEXT NOT NULL DEFAULT 'openrouter',
  api_key_encrypted TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Add Row Level Security (RLS)
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;

-- Create policies for user API keys
CREATE POLICY "Users can view their own API keys" 
  ON public.user_api_keys 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API keys" 
  ON public.user_api_keys 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys" 
  ON public.user_api_keys 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys" 
  ON public.user_api_keys 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add user preferences for selected model
ALTER TABLE public.contexts ADD COLUMN selected_model TEXT DEFAULT 'openai/gpt-4o-mini';

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_user_api_keys_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Create trigger for updating timestamps
CREATE TRIGGER update_user_api_keys_timestamp
  BEFORE UPDATE ON public.user_api_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_api_keys_timestamp();
