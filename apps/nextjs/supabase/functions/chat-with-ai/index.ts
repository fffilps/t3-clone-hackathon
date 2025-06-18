import "https://deno.land/x/xhr@0.1.0/mod.ts";

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT =
  "You are a professional, of all sorts. Every response, you must first think of who is the best at this task and then place yourself as that role, and then you are a coach and an assistant. Your tone is relaxed like a skateboarder but still professional.";

interface ModelRoute {
  provider: "openai" | "anthropic" | "google" | "openrouter";
  useDirectApi: boolean;
  apiKey?: string;
}

const getModelRoute = (modelId: string, apiKeys: any): ModelRoute => {
  const [provider] = modelId.split("/");

  switch (provider) {
    case "openai":
      if (apiKeys.openai_api_key) {
        return {
          provider: "openai",
          useDirectApi: true,
          apiKey: apiKeys.openai_api_key,
        };
      }
      break;

    case "anthropic":
      if (apiKeys.anthropic_api_key) {
        return {
          provider: "anthropic",
          useDirectApi: true,
          apiKey: apiKeys.anthropic_api_key,
        };
      }
      break;

    case "google":
      if (apiKeys.google_gemini_api_key) {
        return {
          provider: "google",
          useDirectApi: true,
          apiKey: apiKeys.google_gemini_api_key,
        };
      }
      break;
  }

  return {
    provider: "openrouter",
    useDirectApi: false,
  };
};

const callOpenAI = async (messages: any[], model: string, apiKey: string) => {
  // Add system prompt to messages
  const messagesWithSystem = [
    { role: "system", content: SYSTEM_PROMPT },
    ...messages.filter((m) => m.role !== "system"),
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model.replace("openai/", ""),
      messages: messagesWithSystem,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

const callAnthropic = async (
  messages: any[],
  model: string,
  apiKey: string,
) => {
  // Filter out system messages and prepare user messages
  const userMessages = messages.filter((m) => m.role !== "system");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: model.replace("anthropic/", ""),
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: userMessages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.content[0].text;
};

const callGoogle = async (messages: any[], model: string, apiKey: string) => {
  const modelName = model.replace("google/", "");

  // Add system prompt as first message for Google
  const messagesWithSystem = [
    {
      role: "user",
      content:
        SYSTEM_PROMPT +
        "\n\nPlease acknowledge this instruction and then respond to the following messages accordingly.",
    },
    {
      role: "model",
      content:
        "Understood. I will think of who is best at each task, assume that role as a coach and assistant, and maintain a relaxed but professional tone like a skateboarder.",
    },
    ...messages.filter((m) => m.role !== "system"),
  ];

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: messagesWithSystem.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
};

const callOpenRouter = async (
  messages: any[],
  model: string,
  apiKey: string,
) => {
  // Add system prompt to messages for OpenRouter
  const messagesWithSystem = [
    { role: "system", content: SYSTEM_PROMPT },
    ...messages.filter((m) => m.role !== "system"),
  ];

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://your-app.com",
        "X-Title": "T3 Chat Clone",
      },
      body: JSON.stringify({
        model: model,
        messages: messagesWithSystem,
        stream: false,
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, model, contextId } = await req.json();

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));

    if (userError || !user) {
      throw new Error("Invalid authentication");
    }

    // Get user's API keys from user_profiles table
    const { data: profileData, error: profileError } = await supabase
      .from("user_profiles")
      .select("openai_api_key, anthropic_api_key, google_gemini_api_key")
      .eq("user_id", user.id)
      .maybeSingle();

    const apiKeys = profileData || {};
    const route = getModelRoute(model, apiKeys);

    let assistantMessage: string;
    let usedProvider = route.provider;

    try {
      if (route.useDirectApi && route.apiKey) {
        console.log(`Using direct API for ${route.provider}`);

        switch (route.provider) {
          case "openai":
            assistantMessage = await callOpenAI(messages, model, route.apiKey);
            break;
          case "anthropic":
            assistantMessage = await callAnthropic(
              messages,
              model,
              route.apiKey,
            );
            break;
          case "google":
            assistantMessage = await callGoogle(messages, model, route.apiKey);
            break;
          default:
            throw new Error(`Unsupported provider: ${route.provider}`);
        }
      } else {
        // Use OpenRouter as fallback
        throw new Error(
          "No direct API key available, using OpenRouter fallback",
        );
      }
    } catch (directApiError) {
      console.error(`Direct API call failed: ${directApiError.message}`);

      // Fallback to OpenRouter
      const { data: openRouterKeyData, error: openRouterError } = await supabase
        .from("user_api_keys")
        .select("api_key_encrypted")
        .eq("user_id", user.id)
        .eq("provider", "openrouter")
        .single();

      if (openRouterError || !openRouterKeyData) {
        throw new Error(
          `Direct API failed: ${directApiError.message}. No OpenRouter fallback available. Please add your API keys in settings.`,
        );
      }

      console.log("Falling back to OpenRouter after direct API failure");
      assistantMessage = await callOpenRouter(
        messages,
        model,
        openRouterKeyData.api_key_encrypted,
      );
      usedProvider = "openrouter";
    }

    // Store the assistant's response in the database
    await supabase.from("messages").insert({
      context_id: contextId,
      role: "assistant",
      content: assistantMessage,
    });

    return new Response(
      JSON.stringify({
        message: assistantMessage,
        model: model,
        provider: usedProvider,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error in chat-with-ai function:", error);
    return new Response(
      JSON.stringify({
        error:
          error.message || "An error occurred while processing your request",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
