
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { Navigate, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeftIcon, SunIcon, MoonIcon, MonitorIcon, LogOutIcon } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useState, useEffect } from 'react';
import AccountTab from '@/components/settings/AccountTab';
import CustomizationTab from '@/components/settings/CustomizationTab';
import HistorySyncTab from '@/components/settings/HistorySyncTab';
import ModelsTab from '@/components/settings/ModelsTab';
import ApiKeysTab from '@/components/settings/ApiKeysTab';

const Settings = () => {
  const { user, loading, signOut } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark' | 'system'>('system');

  useEffect(() => {
    // Get current theme from localStorage or default to system
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' || 'system';
    setCurrentTheme(savedTheme);
  }, []);

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    setCurrentTheme(theme);
    localStorage.setItem('theme', theme);
    
    // Apply theme to document
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const getThemeIcon = () => {
    switch (currentTheme) {
      case 'light':
        return <SunIcon className="w-4 h-4" />;
      case 'dark':
        return <MoonIcon className="w-4 h-4" />;
      default:
        return <MonitorIcon className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <div className="border-b bg-card border-border shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Back to Chat
            </Button>
            <div className="h-6 w-px bg-border" />
            <h1 className="text-xl font-semibold text-foreground">Settings</h1>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Theme Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  {getThemeIcon()}
                  Theme
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleThemeChange('light')}>
                  <SunIcon className="w-4 h-4 mr-2" />
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleThemeChange('dark')}>
                  <MoonIcon className="w-4 h-4 mr-2" />
                  Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleThemeChange('system')}>
                  <MonitorIcon className="w-4 h-4 mr-2" />
                  System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Sign Out Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="flex items-center gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOutIcon className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Settings Content */}
      <div className="max-w-4xl mx-auto p-4">
        <div className="mb-6">
          <p className="text-muted-foreground">Manage your account, preferences, and chat configuration</p>
        </div>
        
        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="customization">Customization</TabsTrigger>
            <TabsTrigger value="history">History & Sync</TabsTrigger>
            <TabsTrigger value="models">Models</TabsTrigger>
            <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          </TabsList>
          
          <TabsContent value="account">
            <AccountTab />
          </TabsContent>
          
          <TabsContent value="customization">
            <CustomizationTab />
          </TabsContent>
          
          <TabsContent value="history">
            <HistorySyncTab />
          </TabsContent>
          
          <TabsContent value="models">
            <ModelsTab />
          </TabsContent>
          
          <TabsContent value="api-keys">
            <ApiKeysTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
