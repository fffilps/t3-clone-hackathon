"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Check,
  Edit3,
  LogOut,
  MessageSquare,
  Plus,
  Settings,
  Trash2,
  User,
  X,
} from "lucide-react";

import { useToast } from "../hooks/use-toast";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../integrations/supabase/client";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Separator } from "./ui/separator";

interface Context {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  selected_model: string | null;
}

interface SidebarProps {
  currentContextId?: string;
  onSelectContext: (contextId: string) => void;
  onNewChat: () => void;
}

const Sidebar = ({
  currentContextId,
  onSelectContext,
  onNewChat,
}: SidebarProps) => {
  const [contexts, setContexts] = useState<Context[]>([]);
  const [editingContextId, setEditingContextId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchContexts();
    }
  }, [user]);

  const fetchContexts = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from("contexts")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Error fetching contexts:", error);
        return;
      }

      setContexts(data || []);
    } catch (error) {
      console.error("Error fetching contexts:", error);
    }
  };

  const handleNewChat = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from("contexts")
        .insert([
          {
            title: "New Chat",
            user_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Error creating context:", error);
        toast({
          title: "Error",
          description: "Failed to create new chat",
          variant: "destructive",
        });
        return;
      }

      setContexts([data, ...contexts]);
      onSelectContext(data.id);
      onNewChat();
    } catch (error) {
      console.error("Error creating context:", error);
    }
  };

  const handleDeleteContext = async (contextId: string) => {
    try {
      const { error } = await supabase
        .from("contexts")
        .delete()
        .eq("id", contextId);

      if (error) {
        console.error("Error deleting context:", error);
        toast({
          title: "Error",
          description: "Failed to delete chat",
          variant: "destructive",
        });
        return;
      }

      setContexts(contexts.filter((context) => context.id !== contextId));

      if (currentContextId === contextId) {
        onNewChat();
      }
    } catch (error) {
      console.error("Error deleting context:", error);
    }
  };

  const handleStartEdit = (context: Context) => {
    setEditingContextId(context.id);
    setEditingTitle(context.title);
  };

  const handleSaveEdit = async () => {
    if (!editingContextId || !editingTitle.trim()) return;

    try {
      const { error } = await supabase
        .from("contexts")
        .update({
          title: editingTitle.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingContextId);

      if (error) {
        console.error("Error updating context:", error);
        toast({
          title: "Error",
          description: "Failed to update chat title",
          variant: "destructive",
        });
        return;
      }

      // Update local state
      setContexts(
        contexts.map((context) =>
          context.id === editingContextId
            ? { ...context, title: editingTitle.trim() }
            : context,
        ),
      );

      setEditingContextId(null);
      setEditingTitle("");

      toast({
        title: "Success",
        description: "Chat title updated successfully",
      });
    } catch (error) {
      console.error("Error updating context:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingContextId(null);
    setEditingTitle("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveEdit();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  return (
    <div className="flex h-full w-80 flex-col border-r border-border bg-card text-card-foreground">
      {/* Header */}
      <div className="border-b border-border p-4">
        <Button onClick={handleNewChat} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          New Chat
        </Button>
      </div>

      {/* Contexts List */}
      <div className="flex-1 overflow-y-auto p-2">
        {contexts.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No chats yet. Start a new conversation!
          </div>
        ) : (
          <div className="space-y-1">
            {contexts.map((context) => (
              <div
                key={context.id}
                className={`group flex cursor-pointer items-center justify-between rounded-md p-2 transition-colors ${
                  currentContextId === context.id
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
                onClick={() => onSelectContext(context.id)}
              >
                <div className="flex min-w-0 flex-1 items-center space-x-2">
                  <MessageSquare className="h-4 w-4 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    {editingContextId === context.id ? (
                      <Input
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="h-6 text-sm"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <div className="truncate text-sm font-medium">
                        {context.title}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {formatDate(context.updated_at)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-1 opacity-0 transition-opacity group-hover:opacity-100">
                  {editingContextId === context.id ? (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveEdit();
                        }}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelEdit();
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEdit(context);
                        }}
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteContext(context.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Separator className="bg-border" />

      <div className="space-y-2 p-4">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <User className="h-4 w-4" />
          <span className="truncate">{user?.email}</span>
        </div>

        <Link href="/settings">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </Link>

        <Button
          onClick={signOut}
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
