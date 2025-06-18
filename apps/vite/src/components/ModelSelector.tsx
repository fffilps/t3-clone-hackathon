
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { BotIcon } from 'lucide-react';

interface ModelSelectorProps {
  contextId?: string;
  onModelChange?: (model: string) => void;
  selectedModel?: string;
}

const availableModels = [
  // OpenAI Models
  { id: 'openai/chatgpt-4o-latest', name: 'ChatGPT 4o', provider: 'OpenAI' },
  { id: 'openai/gpt-4.1-nano-2025-04-14', name: 'GPT-4.1 Nano', provider: 'OpenAI' },
  { id: 'openai/gpt-4.1-2025-04-14', name: 'GPT-4.1', provider: 'OpenAI' },
  { id: 'openai/o4-mini-2025-04-16', name: 'O4 Mini', provider: 'OpenAI' },
  { id: 'openai/o3-2025-04-16', name: 'O3', provider: 'OpenAI' },
  { id: 'openai/o3-mini-2025-01-31', name: 'O3 Mini', provider: 'OpenAI' },
  
  // Anthropic Models
  { id: 'anthropic/claude-sonnet-4-0', name: 'Claude 4 Sonnet', provider: 'Anthropic' },
  { id: 'anthropic/claude-4-opus', name: 'Claude 4 Opus', provider: 'Anthropic' },
  { id: 'anthropic/claude-3-5-haiku-latest', name: 'Claude 3.5 Haiku', provider: 'Anthropic' },
  
  // Google Models
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google' },
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google' },
  { id: 'google/gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'Google' },
];

const ModelSelector = ({ contextId, onModelChange, selectedModel }: ModelSelectorProps) => {
  const { user } = useAuth();
  const [currentModel, setCurrentModel] = useState(selectedModel || 'openai/gpt-4o-mini');

  useEffect(() => {
    if (selectedModel) {
      setCurrentModel(selectedModel);
    }
  }, [selectedModel]);

  const handleModelChange = async (model: string) => {
    setCurrentModel(model);
    onModelChange?.(model);

    // Update the context's selected model if contextId is provided
    if (contextId && user) {
      try {
        await supabase
          .from('contexts')
          .update({ selected_model: model })
          .eq('id', contextId)
          .eq('user_id', user.id);
      } catch (error) {
        console.error('Error updating context model:', error);
      }
    }
  };

  const groupedModels = availableModels.reduce((acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<string, typeof availableModels>);

  return (
    <div className="flex items-center space-x-2">
      <BotIcon className="w-4 h-4 text-gray-500" />
      <Label htmlFor="model-select" className="text-sm font-medium">
        Model:
      </Label>
      <Select value={currentModel} onValueChange={handleModelChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select a model" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(groupedModels).map(([provider, models]) => (
            <div key={provider}>
              <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">
                {provider}
              </div>
              {models.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  {model.name}
                </SelectItem>
              ))}
            </div>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ModelSelector;
