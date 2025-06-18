-- Add feedback and user tracking columns to messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS thumbs_up INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS thumbs_down INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add RLS policy for updating message feedback
CREATE POLICY "Users can update feedback on messages from their contexts" 
  ON public.messages 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.contexts 
      WHERE contexts.id = messages.context_id 
      AND contexts.user_id = auth.uid()
    )
  );

-- Add RLS policy for updating message content (for editing)
CREATE POLICY "Users can update their own messages" 
  ON public.messages 
  FOR UPDATE 
  USING (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.contexts 
      WHERE contexts.id = messages.context_id 
      AND contexts.user_id = auth.uid()
    )
  ); 