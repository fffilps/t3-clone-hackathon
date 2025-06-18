import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { env } from "~/env";

type Message = {
  role: "user" | "assistant" | "system";
  content: string;
};

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

const getModelRoute = (modelId: string, apiKeys: ApiKeyConfig): ModelRoute => {
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

const callOpenAI = async (
  messages: Message[],
  model: string,
  apiKey: string,
) => {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  if (
    !data.choices ||
    !Array.isArray(data.choices) ||
    !data.choices[0]?.message?.content
  )
    throw new Error("Invalid response");
  return data.choices[0].message.content;
};

const callAnthropic = async (
  messages: Message[],
  model: string,
  apiKey: string,
) => {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.content || !Array.isArray(data.content) || !data.content[0]?.text)
    throw new Error("Invalid response");
  return data.content[0].text;
};

const callGoogle = async (
  messages: Message[],
  model: string,
  apiKey: string,
) => {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: messages.map((msg) => ({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }],
        })),
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
  if (
    !data.candidates ||
    !Array.isArray(data.candidates) ||
    !data.candidates[0]?.content?.parts ||
    !data.candidates[0].content.parts[0]?.text
  )
    throw new Error("Invalid response");
  return data.candidates[0].content.parts[0].text;
};

const callOpenRouter = async (
  messages: Message[],
  model: string,
  apiKey: string,
) => {
  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
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
  if (
    !data.choices ||
    !Array.isArray(data.choices) ||
    !data.choices[0]?.message?.content
  )
    throw new Error("Invalid response");
  return data.choices[0].message.content;
};

export async function POST(req: NextRequest) {
  try {
    const { messages, model, apiKeys } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid messages format" },
        { status: 400 },
      );
    }

    if (!model) {
      return NextResponse.json({ error: "Model is required" }, { status: 400 });
    }

    const modelRoute = getModelRoute(model, apiKeys ?? {});
    let response: string;

    try {
      switch (modelRoute.provider) {
        case "openai":
          if (!modelRoute.apiKey) {
            throw new Error("OpenAI API key not found");
          }
          response = await callOpenAI(messages, model, modelRoute.apiKey);
          break;
        case "anthropic":
          if (!modelRoute.apiKey) {
            throw new Error("Anthropic API key not found");
          }
          response = await callAnthropic(messages, model, modelRoute.apiKey);
          break;
        case "google":
          if (!modelRoute.apiKey) {
            throw new Error("Google API key not found");
          }
          response = await callGoogle(messages, model, modelRoute.apiKey);
          break;
        case "openrouter":
          // For OpenRouter, you would need to set up an API key
          // For now, we'll use a placeholder
          response = await callOpenRouter(
            messages,
            model,
            env.OPENROUTER_API_KEY || "",
          );
          break;
        default:
          throw new Error("Unsupported provider");
      }
    } catch (error) {
      console.error("API call error:", error);
      return NextResponse.json(
        {
          error: "Failed to get response from AI provider",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ content: response });
  } catch (error) {
    console.error("Request processing error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
