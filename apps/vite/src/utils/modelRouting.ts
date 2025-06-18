
interface ApiKeyConfig {
  openai?: string;
  anthropic?: string;
  google?: string;
}

interface ModelRoute {
  provider: 'openai' | 'anthropic' | 'google' | 'openrouter';
  useDirectApi: boolean;
  apiKey?: string;
}

export const getModelRoute = (modelId: string, apiKeys: ApiKeyConfig): ModelRoute => {
  // Parse the model ID to determine the provider
  const [provider] = modelId.split('/');
  
  switch (provider) {
    case 'openai':
      if (apiKeys.openai) {
        return {
          provider: 'openai',
          useDirectApi: true,
          apiKey: apiKeys.openai
        };
      }
      break;
      
    case 'anthropic':
      if (apiKeys.anthropic) {
        return {
          provider: 'anthropic',
          useDirectApi: true,
          apiKey: apiKeys.anthropic
        };
      }
      break;
      
    case 'google':
      if (apiKeys.google) {
        return {
          provider: 'google',
          useDirectApi: true,
          apiKey: apiKeys.google
        };
      }
      break;
  }
  
  // Fallback to OpenRouter for all models
  return {
    provider: 'openrouter',
    useDirectApi: false
  };
};

export const validateApiKey = (provider: string, apiKey: string): boolean => {
  if (!apiKey || typeof apiKey !== 'string') return false;
  
  switch (provider) {
    case 'openai':
      return apiKey.startsWith('sk-') || apiKey.startsWith('sk-proj-');
    case 'anthropic':
      return apiKey.startsWith('sk-ant-');
    case 'google':
      return apiKey.length > 10 && /^[A-Za-z0-9_-]+$/.test(apiKey);
    default:
      return false;
  }
};

export const getProviderEndpoint = (provider: string): string => {
  switch (provider) {
    case 'openai':
      return 'https://api.openai.com/v1/chat/completions';
    case 'anthropic':
      return 'https://api.anthropic.com/v1/messages';
    case 'google':
      return 'https://generativelanguage.googleapis.com/v1beta/models';
    default:
      return '';
  }
};
