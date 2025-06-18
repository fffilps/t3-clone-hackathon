
-- Create enum for message types
CREATE TYPE public.message_role AS ENUM ('user', 'assistant', 'system');

-- Create contexts table (chat conversations)
CREATE TABLE public.contexts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'New Chat',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  context_id UUID REFERENCES public.contexts(id) ON DELETE CASCADE NOT NULL,
  role message_role NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contexts
CREATE POLICY "Users can view their own contexts" 
  ON public.contexts 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own contexts" 
  ON public.contexts 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contexts" 
  ON public.contexts 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contexts" 
  ON public.contexts 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS Policies for messages
CREATE POLICY "Users can view messages from their contexts" 
  ON public.messages 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.contexts 
      WHERE contexts.id = messages.context_id 
      AND contexts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in their contexts" 
  ON public.messages 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.contexts 
      WHERE contexts.id = messages.context_id 
      AND contexts.user_id = auth.uid()
    )
  );

-- Enable realtime for messages
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Function to update context updated_at when messages are added
CREATE OR REPLACE FUNCTION update_context_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.contexts 
  SET updated_at = now() 
  WHERE id = NEW.context_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update context timestamp
CREATE TRIGGER update_context_timestamp_trigger
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION update_context_timestamp();
