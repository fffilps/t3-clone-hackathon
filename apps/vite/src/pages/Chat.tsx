
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Sidebar from '@/components/Sidebar';
import ChatInterface from '@/components/ChatInterface';
import { toast } from '@/components/ui/use-toast';

const Chat = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [currentContextId, setCurrentContextId] = useState<string | undefined>();
  const queryClient = useQueryClient();

  const createContextMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('contexts')
        .insert({
          user_id: user!.id,
          title: 'New Chat',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setCurrentContextId(data.id);
      queryClient.invalidateQueries({ queryKey: ['contexts'] });
      toast({
        title: "New chat created",
        description: "You can start chatting now!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating chat",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleNewChat = () => {
    createContextMutation.mutate();
  };

  const handleSelectContext = (contextId: string) => {
    setCurrentContextId(contextId);
  };

  return (
    <div className="h-screen flex bg-background">
      <Sidebar 
        currentContextId={currentContextId}
        onSelectContext={handleSelectContext}
        onNewChat={handleNewChat}
      />
      <div className="flex-1 flex flex-col bg-background">
        {currentContextId ? (
          <ChatInterface contextId={currentContextId} />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-muted/30">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                Welcome to T3 Chat
              </h2>
              <p className="text-muted-foreground mb-4">
                Select a chat from the sidebar or create a new one to get started.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
