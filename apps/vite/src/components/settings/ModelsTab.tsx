
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { BotIcon, CheckIcon } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const availableModels = [
  // OpenAI Models
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI', description: 'Most capable OpenAI model' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', description: 'Fast and efficient' },
  { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI', description: 'High performance model' },
  
  // Anthropic Models
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', description: 'Excellent reasoning and coding' },
  { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic', description: 'Most capable Claude model' },
  { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', provider: 'Anthropic', description: 'Fast and cost-effective' },
  
  // Google Models
  { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5', provider: 'Google', description: 'Advanced multimodal capabilities' },
  { id: 'google/gemini-flash-1.5', name: 'Gemini Flash 1.5', provider: 'Google', description: 'Speed optimized' },
];

const ModelsTab = () => {
  const { user } = useAuth();
  const [modelPreferences, setModelPreferences] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchModelPreferences();
  }, [user]);

  const fetchModelPreferences = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_model_preferences')
        .select('model_id, enabled')
        .eq('user_id', user.id);

      if (error) throw error;

      // Create a map of model preferences
      const preferences: Record<string, boolean> = {};
      
      // Set defaults for all models (enabled by default)
      availableModels.forEach(model => {
        preferences[model.id] = true;
      });
      
      // Override with user preferences
      data?.forEach(pref => {
        preferences[pref.model_id] = pref.enabled;
      });

      setModelPreferences(preferences);
    } catch (error: any) {
      console.error('Error fetching model preferences:', error);
      toast({
        title: "Error",
        description: "Failed to load model preferences.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleModel = (modelId: string) => {
    setModelPreferences(prev => ({
      ...prev,
      [modelId]: !prev[modelId]
    }));
  };

  const savePreferences = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Prepare upsert data for all models
      const upsertData = availableModels.map(model => ({
        user_id: user.id,
        model_id: model.id,
        enabled: modelPreferences[model.id] ?? true
      }));

      const { error } = await supabase
        .from('user_model_preferences')
        .upsert(upsertData);

      if (error) throw error;

      toast({
        title: "Preferences Saved",
        description: "Your model preferences have been updated.",
      });
    } catch (error: any) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const enableAll = () => {
    const allEnabled: Record<string, boolean> = {};
    availableModels.forEach(model => {
      allEnabled[model.id] = true;
    });
    setModelPreferences(allEnabled);
  };

  const disableAll = () => {
    const allDisabled: Record<string, boolean> = {};
    availableModels.forEach(model => {
      allDisabled[model.id] = false;
    });
    setModelPreferences(allDisabled);
  };

  const groupedModels = availableModels.reduce((acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<string, typeof availableModels>);

  const enabledCount = Object.values(modelPreferences).filter(Boolean).length;

  if (loading) {
    return <div className="flex justify-center p-8">Loading model preferences...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BotIcon className="w-5 h-5" />
            Model Preferences
          </CardTitle>
          <CardDescription>
            Select which models appear in the chat interface model selector
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{enabledCount} of {availableModels.length} enabled</Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={enableAll}>
                Enable All
              </Button>
              <Button variant="outline" size="sm" onClick={disableAll}>
                Disable All
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            {Object.entries(groupedModels).map(([provider, models]) => (
              <div key={provider} className="space-y-3">
                <h3 className="font-semibold text-lg">{provider}</h3>
                <div className="grid gap-3">
                  {models.map((model) => (
                    <div
                      key={model.id}
                      className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <Checkbox
                        id={model.id}
                        checked={modelPreferences[model.id] ?? true}
                        onCheckedChange={() => toggleModel(model.id)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <label htmlFor={model.id} className="font-medium cursor-pointer">
                            {model.name}
                          </label>
                          {modelPreferences[model.id] && (
                            <CheckIcon className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{model.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t">
            <Button onClick={savePreferences} disabled={saving}>
              {saving ? 'Saving...' : 'Save Preferences'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ModelsTab;
