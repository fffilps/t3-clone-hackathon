import type { Tables } from "@/integrations/supabase/types";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Download, DownloadCloud } from "lucide-react";

// TODO: Use a proper Context type for chatHistory when available in the Next.js app.
// import type { Context } from '../../../../apps/expo/types/database';
// import type { Context } from '../../../expo/types/database';
const [chatHistory, setChatHistory] = useState<
  (Tables<"contexts"> & { messages?: Tables<"messages">[] })[]
>([]);

const HistorySyncTab = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  const fetchChatHistory = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("contexts")
        .select(
          `
          *,
          messages (*)
        `,
        )
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setChatHistory(data ?? []);
    } catch (error) {
      const message =
        typeof error === "object" && error && "message" in error
          ? (error as { message?: string }).message
          : String(error);
      console.error("Error fetching chat history:", message);
      toast({
        title: "Error",
        description: "Failed to load chat history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchChatHistory();
  }, [user]);

  const exportChat = async (contextId: string, title: string) => {
    try {
      // Fetch messages for this context
      const { data: messages, error } = await supabase
        .from("messages")
        .select("*")
        .eq("context_id", contextId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Create export data
      const exportData = {
        title,
        contextId,
        exportDate: new Date().toISOString(),
        messages: messages ?? [],
      };

      // Create and download file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: `Chat "${title}" exported successfully`,
      });
    } catch (error) {
      const message =
        typeof error === "object" && error && "message" in error
          ? (error as { message?: string }).message
          : String(error);
      console.error("Error exporting chat:", message);
      toast({
        title: "Error",
        description: "Failed to export chat",
        variant: "destructive",
      });
    }
  };

  const exportAllChats = async () => {
    try {
      const exportData = {
        exportDate: new Date().toISOString(),
        user: user?.email,
        chats: chatHistory.map((chat) => ({
          title: chat.title,
          contextId: chat.id,
          createdAt: chat.created_at,
          updatedAt: chat.updated_at,
          messageCount: chat.messages?.length ?? 0,
        })),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chat_history_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "All chat history exported successfully",
      });
    } catch (error) {
      const message =
        typeof error === "object" && error && "message" in error
          ? (error as { message?: string }).message
          : String(error);
      console.error("Error exporting all chats:", message);
      toast({
        title: "Error",
        description: "Failed to export chat history",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>History & Sync</CardTitle>
            <CardDescription>Loading...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export Options</CardTitle>
          <CardDescription>
            Export your chat history for backup or migration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              onClick={exportAllChats}
              className="flex items-center gap-2"
            >
              <DownloadCloud className="h-4 w-4" />
              Export All Chats
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Export all your chat history as a JSON file for backup purposes.
          </p>
        </CardContent>
      </Card>

      <Separator />

      {/* Chat History */}
      <Card>
        <CardHeader>
          <CardTitle>Chat History</CardTitle>
          <CardDescription>Individual chat export options</CardDescription>
        </CardHeader>
        <CardContent>
          {chatHistory.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Download className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>No chat history found</p>
              <p className="text-sm">Start chatting to see your history here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {chatHistory.map((chat) => (
                <div
                  key={chat.id}
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="font-medium">{chat.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(chat.updated_at)} •{" "}
                      {chat.messages?.length ?? 0} messages
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => exportChat(chat.id, chat.title)}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync Status */}
      <Card>
        <CardHeader>
          <CardTitle>Sync Status</CardTitle>
          <CardDescription>
            Your chat data is automatically synced across devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm">
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            <span>All data synced</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Your conversations are automatically saved and synced in real-time.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default HistorySyncTab;
