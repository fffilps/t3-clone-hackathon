import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { BotIcon, CheckIcon } from "lucide-react";

const availableModels = [
  // OpenAI Models
  {
    id: "openai/chatgpt-4o-latest",
    name: "ChatGPT 4o",
    provider: "OpenAI",
    description: "Most capable OpenAI model",
  },
  {
    id: "openai/gpt-4.1-nano-2025-04-14",
    name: "GPT-4.1 Nano",
    provider: "OpenAI",
    description: "Fast and efficient",
  },
  {
    id: "openai/gpt-4.1-2025-04-14",
    name: "GPT-4.1",
    provider: "OpenAI",
    description: "High performance model",
  },
  {
    id: "openai/o4-mini-2025-04-16",
    name: "O4 Mini",
    provider: "OpenAI",
    description: "Latest OpenAI model",
  },
  {
    id: "openai/o3-2025-04-16",
    name: "O3",
    provider: "OpenAI",
    description: "Advanced reasoning model",
  },
  {
    id: "openai/o3-mini-2025-01-31",
    name: "O3 Mini",
    provider: "OpenAI",
    description: "Fast and cost-effective",
  },

  // Anthropic Models
  {
    id: "anthropic/claude-sonnet-4-0",
    name: "Claude 4 Sonnet",
    provider: "Anthropic",
    description: "Excellent reasoning and coding",
  },
  {
    id: "anthropic/claude-4-opus",
    name: "Claude 4 Opus",
    provider: "Anthropic",
    description: "Most capable Claude model",
  },
  {
    id: "anthropic/claude-3-5-haiku-latest",
    name: "Claude 3.5 Haiku",
    provider: "Anthropic",
    description: "Fast and cost-effective",
  },

  // Google Models
  {
    id: "google/gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: "Google",
    description: "Advanced multimodal capabilities",
  },
  {
    id: "google/gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "Google",
    description: "Speed optimized",
  },
  {
    id: "google/gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    provider: "Google",
    description: "Balanced performance",
  },
];

const ModelsTab = () => {
  const { user } = useAuth();
  const [modelPreferences, setModelPreferences] = useState<
    Record<string, boolean>
  >({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetchModelPreferences();
  }, [user]);

  const fetchModelPreferences = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_model_preferences")
        .select("model_id, enabled")
        .eq("user_id", user.id);

      if (error) throw error;

      // Create a map of model preferences
      const preferences: Record<string, boolean> = {};

      // Set defaults for all models (enabled by default)
      availableModels.forEach((model) => {
        preferences[model.id] = true;
      });

      // Override with user preferences
      data?.forEach((pref) => {
        preferences[pref.model_id] = pref.enabled;
      });

      setModelPreferences(preferences);
    } catch (error) {
      const message =
        typeof error === "object" && error && "message" in error
          ? (error as { message?: string }).message
          : String(error);
      console.error("Error fetching model preferences:", message);
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
    setModelPreferences((prev) => ({
      ...prev,
      [modelId]: !prev[modelId],
    }));
  };

  const savePreferences = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Prepare upsert data for all models
      const upsertData = availableModels.map((model) => ({
        user_id: user.id,
        model_id: model.id,
        enabled: modelPreferences[model.id] ?? true,
      }));

      const { error } = await supabase
        .from("user_model_preferences")
        .upsert(upsertData);

      if (error) throw error;

      toast({
        title: "Preferences Saved",
        description: "Your model preferences have been updated.",
      });
    } catch (error) {
      const message =
        typeof error === "object" && error && "message" in error
          ? (error as { message?: string }).message
          : String(error);
      console.error("Error saving preferences:", message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const enableAll = () => {
    const allEnabled: Record<string, boolean> = {};
    availableModels.forEach((model) => {
      allEnabled[model.id] = true;
    });
    setModelPreferences(allEnabled);
  };

  const disableAll = () => {
    const allDisabled: Record<string, boolean> = {};
    availableModels.forEach((model) => {
      allDisabled[model.id] = false;
    });
    setModelPreferences(allDisabled);
  };

  const groupedModels = availableModels.reduce(
    (acc, model) => {
      if (!acc[model.provider]) {
        acc[model.provider] = [];
      }
      acc[model.provider]!.push(model);
      return acc;
    },
    {} as Record<string, typeof availableModels>,
  );

  const enabledCount = Object.values(modelPreferences).filter(Boolean).length;

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        Loading model preferences...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BotIcon className="h-5 w-5" />
            Model Preferences
          </CardTitle>
          <CardDescription>
            Select which models appear in the chat interface model selector
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {enabledCount} of {availableModels.length} enabled
              </Badge>
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
                <h3 className="text-lg font-semibold">{provider}</h3>
                <div className="grid gap-3">
                  {models.map((model) => (
                    <div
                      key={model.id}
                      className="flex items-center space-x-3 rounded-lg border px-4 py-3 hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <label
                            htmlFor={model.id}
                            className="cursor-pointer font-medium"
                          >
                            {model.name}
                          </label>
                          {modelPreferences?.[model.id] === true && (
                            <CheckIcon className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {model.description}
                        </p>
                      </div>
                      <Switch
                        id={model.id}
                        checked={modelPreferences[model.id] ?? true}
                        onCheckedChange={() => toggleModel(model.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t pt-4">
            <Button onClick={savePreferences} disabled={saving}>
              {saving ? "Saving..." : "Save Preferences"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ModelsTab;
