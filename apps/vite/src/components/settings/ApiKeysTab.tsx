import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { KeyIcon, EyeIcon, EyeOffIcon, ExternalLinkIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

const ApiKeysTab = () => {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState({
    openai_api_key: '',
    google_gemini_api_key: '',
    anthropic_api_key: '',
    openrouter_api_key: ''
  });
  const [showKeys, setShowKeys] = useState({
    openai: false,
    gemini: false,
    anthropic: false,
    openrouter: false
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchApiKeys();
  }, [user]);

  const fetchApiKeys = async () => {
    if (!user) return;

    try {
      // Fetch from user_profiles
      const { data, error } = await supabase
        .from('user_profiles')
        .select('openai_api_key, google_gemini_api_key, anthropic_api_key')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // Fetch OpenRouter key from user_api_keys
      const { data: openRouterData } = await supabase
        .from('user_api_keys')
        .select('api_key_encrypted')
        .eq('user_id', user.id)
        .eq('provider', 'openrouter')
        .maybeSingle();

      if (data) {
        setApiKeys({
          openai_api_key: data.openai_api_key || '',
          google_gemini_api_key: data.google_gemini_api_key || '',
          anthropic_api_key: data.anthropic_api_key || '',
          openrouter_api_key: openRouterData?.api_key_encrypted || ''
        });
      }
    } catch (error: any) {
      console.error('Error fetching API keys:', error);
    }
  };

  const saveApiKey = async (provider: 'openai' | 'gemini' | 'anthropic' | 'openrouter') => {
    if (!user) return;

    const columnMap = {
      openai: 'openai_api_key',
      gemini: 'google_gemini_api_key',
      anthropic: 'anthropic_api_key',
      openrouter: 'openrouter_api_key'
    };

    const keyValue = apiKeys[columnMap[provider] as keyof typeof apiKeys];

    setLoading(true);
    try {
      if (provider === 'openrouter') {
        // Save to user_api_keys table
        const { error } = await supabase
          .from('user_api_keys')
          .upsert({
            user_id: user.id,
            provider: 'openrouter',
            api_key_encrypted: keyValue.trim() || null
          }, {
            onConflict: 'user_id,provider'
          });

        if (error) throw error;
      } else {
        // Save to user_profiles table
        const { error } = await supabase
          .from('user_profiles')
          .upsert({
            user_id: user.id,
            [columnMap[provider]]: keyValue.trim() || null
          }, {
            onConflict: 'user_id'
          });

        if (error) throw error;
      }

      toast({
        title: "API Key Saved",
        description: `Your ${provider.charAt(0).toUpperCase() + provider.slice(1)} API key has been saved securely.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteApiKey = async (provider: 'openai' | 'gemini' | 'anthropic' | 'openrouter') => {
    if (!user) return;

    const columnMap = {
      openai: 'openai_api_key',
      gemini: 'google_gemini_api_key',
      anthropic: 'anthropic_api_key',
      openrouter: 'openrouter_api_key'
    };

    setLoading(true);
    try {
      if (provider === 'openrouter') {
        const { error } = await supabase
          .from('user_api_keys')
          .delete()
          .eq('user_id', user.id)
          .eq('provider', 'openrouter');

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_profiles')
          .upsert({
            user_id: user.id,
            [columnMap[provider]]: null
          }, {
            onConflict: 'user_id'
          });

        if (error) throw error;
      }

      setApiKeys(prev => ({
        ...prev,
        [columnMap[provider]]: ''
      }));

      toast({
        title: "API Key Deleted",
        description: `Your ${provider.charAt(0).toUpperCase() + provider.slice(1)} API key has been removed.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleShowKey = (provider: 'openai' | 'gemini' | 'anthropic' | 'openrouter') => {
    setShowKeys(prev => ({
      ...prev,
      [provider]: !prev[provider]
    }));
  };

  const ApiKeyCard = ({ 
    title, 
    description, 
    provider, 
    placeholder, 
    helpUrl,
    priority 
  }: { 
    title: string; 
    description: string; 
    provider: 'openai' | 'gemini' | 'anthropic' | 'openrouter'; 
    placeholder: string;
    helpUrl: string;
    priority?: string;
  }) => {
    const columnMap = {
      openai: 'openai_api_key',
      gemini: 'google_gemini_api_key',
      anthropic: 'anthropic_api_key',
      openrouter: 'openrouter_api_key'
    };
    
    const keyValue = apiKeys[columnMap[provider] as keyof typeof apiKeys];
    const hasKey = Boolean(keyValue);
    const showKey = showKeys[provider];

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyIcon className="w-5 h-5" />
            {title}
            {priority && (
              <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                {priority}
              </span>
            )}
          </CardTitle>
          <CardDescription>
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`${provider}-api-key`}>API Key</Label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Input
                  id={`${provider}-api-key`}
                  type={showKey ? "text" : "password"}
                  value={keyValue}
                  onChange={(e) => setApiKeys(prev => ({ 
                    ...prev, 
                    [columnMap[provider]]: e.target.value 
                  }))}
                  placeholder={placeholder}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => toggleShowKey(provider)}
                >
                  {showKey ? (
                    <EyeOffIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              onClick={() => saveApiKey(provider)} 
              disabled={loading || !keyValue.trim()}
            >
              {hasKey ? 'Update API Key' : 'Save API Key'}
            </Button>
            {hasKey && (
              <Button 
                variant="destructive" 
                onClick={() => deleteApiKey(provider)} 
                disabled={loading}
              >
                Delete API Key
              </Button>
            )}
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
            <span>Get your API key from</span>
            <a 
              href={helpUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-600 hover:underline flex items-center gap-1"
            >
              {title} Dashboard
              <ExternalLinkIcon className="w-3 h-3" />
            </a>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertDescription>
          <strong>Smart API Routing:</strong> When you add your own API keys, they will be used directly for better performance and lower costs. OpenRouter is used as a fallback when direct API keys are not available.
        </AlertDescription>
      </Alert>

      <ApiKeyCard
        title="OpenAI"
        description="Add your OpenAI API key to use GPT models directly with priority routing."
        provider="openai"
        placeholder="sk-..."
        helpUrl="https://platform.openai.com/api-keys"
        priority="HIGH PRIORITY"
      />

      <ApiKeyCard
        title="Anthropic Claude"
        description="Add your Anthropic API key to use Claude models directly with priority routing."
        provider="anthropic"
        placeholder="sk-ant-..."
        helpUrl="https://console.anthropic.com/settings/keys"
        priority="HIGH PRIORITY"
      />

      <ApiKeyCard
        title="Google Gemini"
        description="Add your Google AI API key to use Gemini models directly with priority routing."
        provider="gemini"
        placeholder="AI..."
        helpUrl="https://makersuite.google.com/app/apikey"
        priority="HIGH PRIORITY"
      />

      <ApiKeyCard
        title="OpenRouter"
        description="Add your OpenRouter API key as a fallback for all models when direct API keys are not available."
        provider="openrouter"
        placeholder="sk-or-..."
        helpUrl="https://openrouter.ai/keys"
      />
    </div>
  );
};

export default ApiKeysTab;
