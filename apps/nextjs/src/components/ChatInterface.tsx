"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Send } from "lucide-react";

import { useToast } from "../hooks/use-toast";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../integrations/supabase/client";
import MessageActions from "./MessageActions";
import ModelSelector from "./ModelSelector";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Textarea } from "./ui/textarea";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant" | "system";
  created_at: string;
  context_id: string;
  user_id: string | null;
  parent_message_id: string | null;
  thumbs_up: number | null;
  thumbs_down: number | null;
}

interface ChatInterfaceProps {
  contextId: string;
}

const ChatInterface = ({ contextId }: ChatInterfaceProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(
    "openai/chatgpt-4o-latest",
  );
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch context details (for selected model)
  const { data: context } = useQuery({
    queryKey: ["context", contextId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contexts")
        .select("*")
        .eq("id", contextId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!contextId && !!user,
  });

  useEffect(() => {
    if (context?.selected_model) {
      setSelectedModel(context.selected_model);
    }
  }, [context]);

  // Fetch messages
  const { data: messages = [] } = useQuery({
    queryKey: ["messages", contextId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("context_id", contextId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!contextId && !!user,
  });

  // Add user/assistant message mutation
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
          role,
          content,
          user_id: user!.id,
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

  // Edit message mutation
  const updateMessageMutation = useMutation({
    mutationFn: async ({
      messageId,
      content,
    }: {
      messageId: string;
      content: string;
    }) => {
      const { error } = await supabase
        .from("messages")
        .update({ content })
        .eq("id", messageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", contextId] });
      setEditingMessageId(null);
      setEditingContent("");
      toast({
        title: "Message updated",
        description: "Your message has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Scroll to bottom on messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue("");
    setIsLoading(true);

    try {
      // Add user message
      await addMessageMutation.mutateAsync({
        role: "user",
        content: userMessage,
      });

      // Prepare messages for AI
      const allMessages = [...messages, { role: "user", content: userMessage }];
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

      // Optionally show which provider was used
      if (data?.provider && data.provider !== "openrouter") {
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

  const handleEdit = (messageId: string) => {
    const messageToEdit = messages.find((m: any) => m.id === messageId);
    if (messageToEdit) {
      setEditingMessageId(messageId);
      setEditingContent(messageToEdit.content);
    }
  };

  const handleSaveEdit = () => {
    if (editingMessageId && editingContent.trim()) {
      updateMessageMutation.mutate({
        messageId: editingMessageId,
        content: editingContent.trim(),
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent("");
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
          {messages.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              Start a conversation by typing a message below.
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`group flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className="flex max-w-xs flex-col space-y-2 md:max-w-md lg:max-w-lg xl:max-w-xl">
                  <div
                    className={`rounded-lg px-4 py-2 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {editingMessageId === message.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          className="min-h-[60px] resize-none"
                        />
                        <div className="flex space-x-2">
                          <Button size="sm" onClick={handleSaveEdit}>
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>

                  {/* Message Actions */}
                  {message.role === "assistant" &&
                    editingMessageId !== message.id && (
                      <div className="flex justify-start">
                        <MessageActions
                          messageId={message.id}
                          content={message.content}
                          thumbsUp={message.thumbs_up ?? 0}
                          thumbsDown={message.thumbs_down ?? 0}
                        />
                      </div>
                    )}

                  {message.role === "user" &&
                    editingMessageId !== message.id && (
                      <div className="flex justify-end">
                        <MessageActions
                          messageId={message.id}
                          content={message.content}
                          thumbsUp={message.thumbs_up ?? 0}
                          thumbsDown={message.thumbs_down ?? 0}
                          onEdit={handleEdit}
                        />
                      </div>
                    )}
                </div>
              </div>
            ))
          )}
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
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
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
              disabled={!inputValue.trim() || isLoading}
              size="lg"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
