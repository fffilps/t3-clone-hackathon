
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HistoryIcon, DownloadIcon, MessageSquareIcon } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Tables } from '@/integrations/supabase/types';

const HistorySyncTab = () => {
  const { user } = useAuth();
  const [contexts, setContexts] = useState<Tables<'contexts'>[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchChatHistory();
  }, [user]);

  const fetchChatHistory = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contexts')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setContexts(data || []);
    } catch (error: any) {
      console.error('Error fetching chat history:', error);
      toast({
        title: "Error",
        description: "Failed to load chat history.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportChat = async (contextId: string, title: string) => {
    try {
      // Fetch messages for this context
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('context_id', contextId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const chatData = {
        title,
        context_id: contextId,
        messages: messages || [],
        exported_at: new Date().toISOString()
      };

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Chat Exported",
        description: `"${title}" has been downloaded as JSON.`,
      });
    } catch (error: any) {
      console.error('Error exporting chat:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export chat data.",
        variant: "destructive",
      });
    }
  };

  const exportAllChats = async () => {
    try {
      setLoading(true);
      
      // Fetch all messages for all contexts
      const { data: allMessages, error } = await supabase
        .from('messages')
        .select('*, contexts!inner(title)')
        .eq('contexts.user_id', user?.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group messages by context
      const chatsByContext = contexts.map(context => ({
        title: context.title,
        context_id: context.id,
        created_at: context.created_at,
        updated_at: context.updated_at,
        selected_model: context.selected_model,
        messages: allMessages?.filter(msg => msg.context_id === context.id) || []
      }));

      const exportData = {
        user_id: user?.id,
        exported_at: new Date().toISOString(),
        total_chats: contexts.length,
        chats: chatsByContext
      };

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `all-chats-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "All Chats Exported",
        description: `${contexts.length} chats have been downloaded as JSON.`,
      });
    } catch (error: any) {
      console.error('Error exporting all chats:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export all chat data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HistoryIcon className="w-5 h-5" />
            Chat History
          </CardTitle>
          <CardDescription>
            View and export your chat conversations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-600">
              {contexts.length} total conversations
            </span>
            <Button onClick={exportAllChats} disabled={loading || contexts.length === 0}>
              <DownloadIcon className="w-4 h-4 mr-2" />
              Export All Chats
            </Button>
          </div>

          <ScrollArea className="h-[400px] border rounded-md">
            <div className="p-4 space-y-2">
              {contexts.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <MessageSquareIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No chat history found</p>
                  <p className="text-sm">Start a conversation to see it here</p>
                </div>
              ) : (
                contexts.map((context) => (
                  <div
                    key={context.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      <MessageSquareIcon className="w-4 h-4 text-gray-400" />
                      <div>
                        <h4 className="font-medium truncate max-w-[300px]">{context.title}</h4>
                        <p className="text-sm text-gray-500">
                          {new Date(context.updated_at).toLocaleDateString()} • {context.selected_model}
                        </p>
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportChat(context.id, context.title)}
                    >
                      <DownloadIcon className="w-3 h-3 mr-1" />
                      Export
                    </Button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default HistorySyncTab;
