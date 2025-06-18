export async function POST(request: Request) {
  try {
    const { message, contextId, model, messages, userProfile } =
      await request.json();

    // Import supabase to get user's API keys
    const { supabase } = await import("@/lib/supabase");

    // Get user ID from the userProfile
    const userId = userProfile?.user_id;

    if (!userId) {
      throw new Error("User authentication required");
    }

    // Get all user API keys
    const { data: userApiKeys, error: apiKeysError } = await supabase
      .from("user_api_keys")
      .select("provider, api_key_encrypted")
      .eq("user_id", userId);

    if (apiKeysError) {
      console.error("Error fetching API keys:", apiKeysError);
    }

    // Get profile API keys
    const { data: profileData, error: profileError } = await supabase
      .from("user_profiles")
      .select("openai_api_key, google_gemini_api_key, anthropic_api_key")
      .eq("user_id", userId)
      .maybeSingle();

    if (profileError && profileError.code !== "PGRST116") {
      console.error("Error fetching profile API keys:", profileError);
    }

    // Build API key config
    const apiKeys: { [key: string]: string } = {};

    // Add profile API keys
    if (profileData) {
      if (profileData.openai_api_key)
        apiKeys.openai = profileData.openai_api_key;
      if (profileData.google_gemini_api_key)
        apiKeys.google = profileData.google_gemini_api_key;
      if (profileData.anthropic_api_key)
        apiKeys.anthropic = profileData.anthropic_api_key;
    }

    // Add user_api_keys (mainly for OpenRouter)
    if (userApiKeys) {
      userApiKeys.forEach((key) => {
        if (key.provider === "openrouter") {
          apiKeys.openrouter = key.api_key_encrypted;
        }
      });
    }

    // Determine model route using the same logic as Next.js
    const modelRoute = getModelRoute(model, apiKeys);

    if (!modelRoute.apiKey && modelRoute.provider !== "openrouter") {
      throw new Error(
        `No API key configured for ${modelRoute.provider}. Please add your API key in Settings or configure OpenRouter as a fallback.`,
      );
    }

    // Build conversation history
    const conversationMessages = messages.map((msg: any) => ({
      role: msg.role === "system" ? "system" : msg.role,
      content: msg.content,
    }));

    // Add system message if user has preferences
    if (
      userProfile?.preferred_name ||
      userProfile?.occupation ||
      userProfile?.chat_traits
    ) {
      const systemPrompt = `You are a helpful AI assistant. ${
        userProfile.preferred_name
          ? `The user prefers to be called ${userProfile.preferred_name}. `
          : ""
      }${
        userProfile.occupation
          ? `They work as a ${userProfile.occupation}. `
          : ""
      }${
        userProfile.chat_traits?.length
          ? `Their communication preferences: ${userProfile.chat_traits.join(", ")}. `
          : ""
      }Please tailor your responses accordingly.`;

      conversationMessages.unshift({ role: "system", content: systemPrompt });
    }

    conversationMessages.push({ role: "user", content: message });

    let response: string;

    try {
      switch (modelRoute.provider) {
        case "openai":
          response = await callOpenAI(
            conversationMessages,
            model,
            modelRoute.apiKey!,
          );
          break;
        case "anthropic":
          response = await callAnthropic(
            conversationMessages,
            model,
            modelRoute.apiKey!,
          );
          break;
        case "google":
          response = await callGoogle(
            conversationMessages,
            model,
            modelRoute.apiKey!,
          );
          break;
        case "openrouter":
          response = await callOpenRouter(
            conversationMessages,
            model,
            modelRoute.apiKey || "",
          );
          break;
        default:
          throw new Error("Unsupported provider");
      }
    } catch (error) {
      console.error("API call error:", error);
      throw new Error(
        `Failed to get response from AI provider: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }

    return Response.json({ content: response });
  } catch (error) {
    console.error("Chat API error:", error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to process chat request",
      },
      { status: 500 },
    );
  }
}

interface ApiKeyConfig {
  openai?: string;
  anthropic?: string;
  google?: string;
  openrouter?: string;
}

interface ModelRoute {
  provider: "openai" | "anthropic" | "google" | "openrouter";
  useDirectApi: boolean;
  apiKey?: string;
}

const getModelRoute = (modelId: string, apiKeys: ApiKeyConfig): ModelRoute => {
  // Extract provider from model ID
  const [provider] = modelId.split("/");

  // OpenAI models
  if (provider === "openai" || modelId.startsWith("gpt-")) {
    if (apiKeys.openai) {
      return { provider: "openai", useDirectApi: true, apiKey: apiKeys.openai };
    }
    return {
      provider: "openrouter",
      useDirectApi: false,
      apiKey: apiKeys.openrouter,
    };
  }

  // Anthropic models
  if (provider === "anthropic" || modelId.startsWith("claude-")) {
    if (apiKeys.anthropic) {
      return {
        provider: "anthropic",
        useDirectApi: true,
        apiKey: apiKeys.anthropic,
      };
    }
    return {
      provider: "openrouter",
      useDirectApi: false,
      apiKey: apiKeys.openrouter,
    };
  }

  // Google models
  if (provider === "google" || modelId.startsWith("gemini-")) {
    if (apiKeys.google) {
      return { provider: "google", useDirectApi: true, apiKey: apiKeys.google };
    }
    return {
      provider: "openrouter",
      useDirectApi: false,
      apiKey: apiKeys.openrouter,
    };
  }

  // Default to OpenRouter for unknown models
  return {
    provider: "openrouter",
    useDirectApi: false,
    apiKey: apiKeys.openrouter,
  };
};

const callOpenAI = async (messages: any[], model: string, apiKey: string) => {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model.replace("openai/", ""),
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

const callAnthropic = async (
  messages: any[],
  model: string,
  apiKey: string,
) => {
  // Separate system messages from conversation for Anthropic
  const systemMessages = messages.filter((msg) => msg.role === "system");
  const chatMessages = messages.filter((msg) => msg.role !== "system");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: model.replace("anthropic/", ""),
      messages: chatMessages,
      system: systemMessages.length > 0 ? systemMessages[0].content : undefined,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.content[0].text;
};

const callGoogle = async (messages: any[], model: string, apiKey: string) => {
  const modelName = model.replace("google/", "");
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: messages
          .filter((msg) => msg.role !== "system")
          .map((msg) => ({
            role: msg.role === "assistant" ? "model" : "user",
            parts: [{ text: msg.content }],
          })),
        systemInstruction: messages.find((msg) => msg.role === "system")
          ?.content,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Google API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
};

const callOpenRouter = async (
  messages: any[],
  model: string,
  apiKey: string,
) => {
  if (!apiKey) {
    throw new Error(
      "OpenRouter API key not configured. Please add your OpenRouter API key in Settings.",
    );
  }

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://your-app.com",
        "X-Title": "AI Chat Mobile",
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
};
