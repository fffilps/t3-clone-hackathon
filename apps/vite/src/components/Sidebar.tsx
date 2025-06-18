
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { PlusIcon, MessageSquareIcon, LogOutIcon, UserIcon, SettingsIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { Link } from 'react-router-dom';

interface SidebarProps {
  currentContextId?: string;
  onSelectContext: (contextId: string) => void;
  onNewChat: () => void;
}

const Sidebar = ({ currentContextId, onSelectContext, onNewChat }: SidebarProps) => {
  const { user, signOut } = useAuth();
  const { theme } = useTheme();

  const { data: contexts = [], refetch } = useQuery({
    queryKey: ['contexts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contexts')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data as Tables<'contexts'>[];
    },
    enabled: !!user,
  });

  return (
    <div className="w-80 bg-card border-r border-border text-card-foreground flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <Button 
          onClick={onNewChat}
          className="w-full"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1 p-2">
        <div className="space-y-1">
          {contexts.map((context) => (
            <Button
              key={context.id}
              variant={currentContextId === context.id ? "secondary" : "ghost"}
              className={`w-full justify-start text-left p-3 h-auto ${
                currentContextId === context.id 
                  ? 'bg-secondary text-secondary-foreground' 
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
              onClick={() => onSelectContext(context.id)}
            >
              <MessageSquareIcon className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">{context.title}</span>
            </Button>
          ))}
        </div>
      </ScrollArea>

      <Separator className="bg-border" />
      
      <div className="p-4 space-y-2">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <UserIcon className="w-4 h-4" />
          <span className="truncate">{user?.email}</span>
        </div>
        
        <Link to="/settings">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <SettingsIcon className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </Link>
        
        <Button
          onClick={signOut}
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <LogOutIcon className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
