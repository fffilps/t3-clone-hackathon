"use client";

import { useEffect, useRef, useState } from "react";
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(
    "openai/chatgpt-4o-latest",
  );
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contextId) {
      fetchMessages();
      fetchSelectedModel();
    }
  }, [contextId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchSelectedModel = async () => {
    try {
      const { data, error } = await supabase
        .from("contexts")
        .select("selected_model")
        .eq("id", contextId)
        .single();

      if (error) {
        console.error("Error fetching selected model:", error);
        return;
      }

      if (data?.selected_model) {
        setSelectedModel(data.selected_model);
      }
    } catch (error) {
      console.error("Error fetching selected model:", error);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("context_id", contextId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
        return;
      }

      setMessages(data ?? []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleEdit = (messageId: string) => {
    const messageToEdit = messages.find((m) => m.id === messageId);
    if (messageToEdit) {
      setEditingMessageId(messageId);
      setEditingContent(messageToEdit.content);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingMessageId || !editingContent.trim()) return;

    try {
      const { error } = await supabase
        .from("messages")
        .update({ content: editingContent.trim() })
        .eq("id", editingMessageId);

      if (error) throw error;

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === editingMessageId
            ? { ...msg, content: editingContent.trim() }
            : msg,
        ),
      );

      setEditingMessageId(null);
      setEditingContent("");

      toast({
        title: "Message updated",
        description: "Your message has been updated successfully.",
      });
    } catch (error: any) {
      console.error("Error updating message:", error);
      toast({
        title: "Error updating message",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue("");
    setIsLoading(true);

    // Add user message to the chat
    const userMessageData = {
      content: userMessage,
      role: "user" as const,
      context_id: contextId,
      user_id: user?.id,
    };

    try {
      // Insert user message
      const { data: userMsg, error: userError } = await supabase
        .from("messages")
        .insert([userMessageData])
        .select()
        .single();

      if (userError) {
        console.error("Error inserting user message:", userError);
        toast({
          title: "Error",
          description: "Failed to send message",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      setMessages((prev) => [...prev, userMsg]);

      // Get API keys for the user
      const { data: apiKeys, error: apiError } = await supabase
        .from("user_api_keys")
        .select("provider, api_key_encrypted")
        .eq("user_id", user?.id ?? "");

      if (apiError) {
        console.error("Error fetching API keys:", apiError);
      }

      // Call the chat API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          model: selectedModel,
          apiKeys: apiKeys?.reduce(
            (acc, key) => {
              acc[key.provider] = key.api_key_encrypted;
              return acc;
            },
            {} as Record<string, string>,
          ),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from AI");
      }

      const data = await response.json();
      const assistantMessage = data.content;

      // Insert assistant message
      const { data: assistantMsg, error: assistantError } = await supabase
        .from("messages")
        .insert([
          {
            content: assistantMessage,
            role: "assistant",
            context_id: contextId,
            user_id: user?.id,
          },
        ])
        .select()
        .single();

      if (assistantError) {
        console.error("Error inserting assistant message:", assistantError);
        toast({
          title: "Error",
          description: "Failed to save AI response",
          variant: "destructive",
        });
      } else {
        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch (error) {
      console.error("Error in chat:", error);
      toast({
        title: "Error",
        description: "Failed to get response from AI",
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
                          contextId={contextId}
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
                          contextId={contextId}
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
