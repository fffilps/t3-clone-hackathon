"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ChatInterface from "@/components/ChatInterface";
import Sidebar from "@/components/Sidebar";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const Chat = () => {
  const { user } = useAuth();
  const [currentContextId, setCurrentContextId] = useState<
    string | undefined
  >();
  const queryClient = useQueryClient();

  const createContextMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("contexts")
        .insert({
          title: "New Chat",
          user_id: user!.id,
          selected_model: "openai/chatgpt-4o-latest",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setCurrentContextId(data.id);
      queryClient.invalidateQueries({ queryKey: ["contexts"] });
      toast({
        title: "New chat created",
        description: "You can start chatting now!",
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Error creating chat",
        description: error instanceof Error ? error.message : "Unknown error",
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
    <div className="flex h-screen bg-background">
      <Sidebar
        currentContextId={currentContextId}
        onSelectContext={handleSelectContext}
        onNewChat={handleNewChat}
      />
      <div className="flex flex-1 flex-col bg-background">
        {currentContextId ? (
          <ChatInterface contextId={currentContextId} />
        ) : (
          <div className="flex flex-1 items-center justify-center bg-muted/30">
            <div className="text-center">
              <h2 className="mb-2 text-2xl font-semibold text-foreground">
                Welcome to T3 Chat
              </h2>
              <p className="mb-4 text-muted-foreground">
                Select a chat from the sidebar or create a new one to get
                started.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
