import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SendIcon } from "lucide-react";

import ModelSelector from "./ModelSelector";

interface ChatInterfaceProps {
  contextId: string;
}

const ChatInterface = ({ contextId }: ChatInterfaceProps) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("openai/gpt-4o-mini");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Get context details including selected model
  const { data: context } = useQuery({
    queryKey: ["context", contextId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contexts")
        .select("*")
        .eq("id", contextId)
        .single();

      if (error) throw error;
      return data as Tables<"contexts">;
    },
    enabled: !!contextId && !!user,
  });

  // Update selected model when context loads
  useEffect(() => {
    if (context?.selected_model) {
      setSelectedModel(context.selected_model);
    }
  }, [context]);

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", contextId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("context_id", contextId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Tables<"messages">[];
    },
    enabled: !!contextId && !!user,
  });

  const addMessageMutation = useMutation({
    mutationFn: async ({
      role,
      content,
    }: {
      role: "user" | "assistant";
      content: string;
    }) => {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          context_id: contextId,
          role: role,
          content: content,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", contextId] });
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    setMessage("");
    setIsLoading(true);

    try {
      // Add user message
      await addMessageMutation.mutateAsync({
        role: "user",
        content: userMessage,
      });

      // Prepare messages for AI
      const allMessages = [
        ...messages,
        { role: "user" as const, content: userMessage },
      ];
      const chatMessages = allMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Call the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke("chat-with-ai", {
        body: {
          messages: chatMessages,
          model: selectedModel,
          contextId: contextId,
        },
      });

      if (error) {
        throw new Error(error.message || "Failed to get AI response");
      }

      // Show which provider was used
      if (data.provider && data.provider !== "openrouter") {
        toast({
          title: "Using Direct API",
          description: `Response generated using your ${data.provider.charAt(0).toUpperCase() + data.provider.slice(1)} API key`,
        });
      }

      // The assistant message is already saved by the edge function
      queryClient.invalidateQueries({ queryKey: ["messages", contextId] });
    } catch (error: any) {
      console.error("Chat error:", error);
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border bg-card p-4">
        <ModelSelector
          contextId={contextId}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
        />
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="mx-auto max-w-3xl space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs rounded-lg px-4 py-2 md:max-w-md lg:max-w-lg xl:max-w-xl ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-lg bg-secondary px-4 py-2 text-secondary-foreground">
                <div className="flex items-center space-x-1">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"></div>
                  <div
                    className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="border-t border-border bg-card p-4">
        <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
          <div className="flex space-x-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="min-h-[60px] flex-1 resize-none bg-background"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <Button
              type="submit"
              disabled={!message.trim() || isLoading}
              size="lg"
            >
              <SendIcon className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
