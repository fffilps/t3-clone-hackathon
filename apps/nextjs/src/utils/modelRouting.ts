interface ApiKeyConfig {
  openai?: string;
  anthropic?: string;
  google?: string;
}

interface ModelRoute {
  provider: "openai" | "anthropic" | "google" | "openrouter";
  useDirectApi: boolean;
  apiKey?: string;
}

export const getModelRoute = (
  modelId: string,
  apiKeys: ApiKeyConfig,
): ModelRoute => {
  // OpenAI models
  if (modelId.startsWith("gpt-")) {
    if (apiKeys.openai) {
      return { provider: "openai", useDirectApi: true, apiKey: apiKeys.openai };
    }
    return { provider: "openrouter", useDirectApi: false };
  }

  // Anthropic models
  if (modelId.startsWith("claude-")) {
    if (apiKeys.anthropic) {
      return {
        provider: "anthropic",
        useDirectApi: true,
        apiKey: apiKeys.anthropic,
      };
    }
    return { provider: "openrouter", useDirectApi: false };
  }

  // Google models
  if (modelId.startsWith("gemini-")) {
    if (apiKeys.google) {
      return { provider: "google", useDirectApi: true, apiKey: apiKeys.google };
    }
    return { provider: "openrouter", useDirectApi: false };
  }

  // Default to OpenRouter for unknown models
  return { provider: "openrouter", useDirectApi: false };
};

export const validateApiKey = (provider: string, apiKey: string): boolean => {
  if (!apiKey || apiKey.trim().length === 0) {
    return false;
  }

  switch (provider) {
    case "openai":
      return apiKey.startsWith("sk-") && apiKey.length > 20;
    case "anthropic":
      return apiKey.startsWith("sk-ant-") && apiKey.length > 20;
    case "google":
      return apiKey.length > 20; // Google API keys don't have a specific prefix
    default:
      return apiKey.length > 20;
  }
};

export const getProviderEndpoint = (provider: string): string => {
  switch (provider) {
    case "openai":
      return "https://api.openai.com/v1/chat/completions";
    case "anthropic":
      return "https://api.anthropic.com/v1/messages";
    case "google":
      return "https://generativelanguage.googleapis.com/v1beta/models";
    case "openrouter":
      return "https://openrouter.ai/api/v1/chat/completions";
    default:
      return "";
  }
};
