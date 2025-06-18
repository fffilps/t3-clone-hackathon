
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { KeyIcon, EyeIcon, EyeOffIcon } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const ApiKeyManager = () => {
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkExistingApiKey();
  }, [user]);

  const checkExistingApiKey = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_api_keys')
        .select('api_key_encrypted')
        .eq('user_id', user.id)
        .eq('provider', 'openrouter')
        .single();

      if (data && !error) {
        setHasApiKey(true);
        setApiKey(data.api_key_encrypted);
      }
    } catch (error) {
      // No API key found, which is fine
    }
  };

  const saveApiKey = async () => {
    if (!user || !apiKey.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_api_keys')
        .upsert({
          user_id: user.id,
          provider: 'openrouter',
          api_key_encrypted: apiKey.trim()
        });

      if (error) throw error;

      setHasApiKey(true);
      toast({
        title: "API Key Saved",
        description: "Your OpenRouter API key has been saved securely.",
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

  const deleteApiKey = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_api_keys')
        .delete()
        .eq('user_id', user.id)
        .eq('provider', 'openrouter');

      if (error) throw error;

      setApiKey('');
      setHasApiKey(false);
      toast({
        title: "API Key Deleted",
        description: "Your OpenRouter API key has been removed.",
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyIcon className="w-5 h-5" />
          OpenRouter API Key
        </CardTitle>
        <CardDescription>
          Add your OpenRouter API key to enable AI chat functionality. Your key is stored securely and only used for your requests.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="api-key">API Key</Label>
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Input
                id="api-key"
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-or-..."
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? (
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
            onClick={saveApiKey} 
            disabled={loading || !apiKey.trim()}
          >
            {hasApiKey ? 'Update API Key' : 'Save API Key'}
          </Button>
          {hasApiKey && (
            <Button 
              variant="destructive" 
              onClick={deleteApiKey} 
              disabled={loading}
            >
              Delete API Key
            </Button>
          )}
        </div>

        <div className="text-sm text-gray-600">
          <p>Get your API key from <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">OpenRouter.ai</a></p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApiKeyManager;
