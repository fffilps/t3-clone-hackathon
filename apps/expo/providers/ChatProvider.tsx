import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";
import {
  AIModel,
  Context,
  Message,
  UserModelPreference,
  UserProfile,
} from "@/types/database";

import { useAuth } from "./AuthProvider";

interface ChatContextType {
  contexts: Context[];
  currentContext: Context | null;
  selectedModel: AIModel;
  models: AIModel[];
  availableModels: AIModel[];
  userProfile: UserProfile | null;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  createContext: (title: string, model: string) => Promise<string>;
  selectContext: (contextId: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  setSelectedModel: (model: AIModel) => void;
  deleteContext: (contextId: string) => Promise<void>;
  loadUserProfile: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshModelPreferences: () => Promise<void>;
  loadMoreContexts: () => Promise<void>;
}

const DEFAULT_MODELS: AIModel[] = [
  // OpenAI Models
  {
    id: "openai/chatgpt-4o-latest",
    name: "ChatGPT 4o",
    provider: "openai",
    description: "Most capable OpenAI model",
    maxTokens: 128000,
    pricing: { input: 0.005, output: 0.015 },
  },
  {
    id: "openai/gpt-4.1-nano-2025-04-14",
    name: "GPT-4.1 Nano",
    provider: "openai",
    description: "Fast and efficient",
    maxTokens: 128000,
    pricing: { input: 0.003, output: 0.009 },
  },
  {
    id: "openai/gpt-4.1-2025-04-14",
    name: "GPT-4.1",
    provider: "openai",
    description: "High performance model",
    maxTokens: 128000,
    pricing: { input: 0.01, output: 0.03 },
  },
  {
    id: "openai/o4-mini-2025-04-16",
    name: "O4 Mini",
    provider: "openai",
    description: "Latest OpenAI model",
    maxTokens: 128000,
    pricing: { input: 0.002, output: 0.006 },
  },
  {
    id: "openai/o3-2025-04-16",
    name: "O3",
    provider: "openai",
    description: "Advanced reasoning model",
    maxTokens: 128000,
    pricing: { input: 0.008, output: 0.024 },
  },
  {
    id: "openai/o3-mini-2025-01-31",
    name: "O3 Mini",
    provider: "openai",
    description: "Fast and cost-effective",
    maxTokens: 128000,
    pricing: { input: 0.001, output: 0.003 },
  },

  // Anthropic Models
  {
    id: "anthropic/claude-sonnet-4-0",
    name: "Claude 4 Sonnet",
    provider: "anthropic",
    description: "Excellent reasoning and coding",
    maxTokens: 200000,
    pricing: { input: 0.003, output: 0.015 },
  },
  {
    id: "anthropic/claude-4-opus",
    name: "Claude 4 Opus",
    provider: "anthropic",
    description: "Most capable Claude model",
    maxTokens: 200000,
    pricing: { input: 0.015, output: 0.075 },
  },
  {
    id: "anthropic/claude-3-5-haiku-latest",
    name: "Claude 3.5 Haiku",
    provider: "anthropic",
    description: "Fast and cost-effective",
    maxTokens: 200000,
    pricing: { input: 0.00025, output: 0.00125 },
  },

  // Google Models
  {
    id: "google/gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: "google",
    description: "Advanced multimodal capabilities",
    maxTokens: 2000000,
    pricing: { input: 0.0035, output: 0.0105 },
  },
  {
    id: "google/gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "google",
    description: "Speed optimized",
    maxTokens: 2000000,
    pricing: { input: 0.000075, output: 0.0003 },
  },
  {
    id: "google/gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    provider: "google",
    description: "Balanced performance",
    maxTokens: 2000000,
    pricing: { input: 0.000075, output: 0.0003 },
  },
];

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [contexts, setContexts] = useState<Context[]>([]);
  const [currentContext, setCurrentContext] = useState<Context | null>(null);
  const [selectedModel, setSelectedModel] = useState<AIModel>(
    DEFAULT_MODELS[0],
  );
  const [availableModels, setAvailableModels] =
    useState<AIModel[]>(DEFAULT_MODELS);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (user) {
      loadContexts();
      loadUserProfile();
      loadModelPreferences();
    }
  }, [user]);

  const loadContexts = async () => {
    if (!user || !mountedRef.current) return;

    try {
      console.log("Loading contexts for user:", user.id);

      const { data, error } = await supabase
        .from("contexts")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .range(0, 9);

      if (error) {
        console.error("Error loading contexts:", error);
        return;
      }

      if (data && mountedRef.current) {
        console.log("Loaded", data.length, "contexts");
        setContexts(data);
        setHasMore(data.length === 10); // If we got less than 10, we've reached the end
      }
    } catch (error) {
      console.error("Error in loadContexts:", error);
    }
  };

  const loadUserProfile = async () => {
    if (!user || !mountedRef.current) return;

    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!error && data && mountedRef.current) {
      setUserProfile(data);
    } else if (error && error.code === "PGRST116" && mountedRef.current) {
      // Profile doesn't exist, create one
      const { data: newProfile, error: createError } = await supabase
        .from("user_profiles")
        .insert({
          user_id: user.id,
          selected_theme: "modern",
          custom_primary_color: "#0f172a",
        })
        .select()
        .single();

      if (!createError && newProfile && mountedRef.current) {
        setUserProfile(newProfile);
      }
    }
  };

  const loadModelPreferences = async () => {
    if (!user || !mountedRef.current) return;

    const { data, error } = await supabase
      .from("user_model_preferences")
      .select("*")
      .eq("user_id", user.id);

    if (!error && data && mountedRef.current) {
      const enabledModelIds = data
        .filter((pref: UserModelPreference) => pref.enabled)
        .map((pref: UserModelPreference) => pref.model_id);

      // If no preferences exist, show all models
      if (enabledModelIds.length === 0) {
        setAvailableModels(DEFAULT_MODELS);
      } else {
        const filteredModels = DEFAULT_MODELS.filter((model) =>
          enabledModelIds.includes(model.id),
        );
        setAvailableModels(filteredModels);

        // Update selected model if it's not available
        if (
          !enabledModelIds.includes(selectedModel.id) &&
          filteredModels.length > 0
        ) {
          setSelectedModel(filteredModels[0]);
        }
      }
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !userProfile || !mountedRef.current) return;

    const { data, error } = await supabase
      .from("user_profiles")
      .update(updates)
      .eq("user_id", user.id)
      .select()
      .single();

    if (!error && data && mountedRef.current) {
      setUserProfile(data);
    }
  };

  const createContext = async (
    title: string,
    model: string,
  ): Promise<string> => {
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("contexts")
      .insert({
        user_id: user.id,
        title,
        selected_model: model,
      })
      .select()
      .single();

    if (error) throw error;

    const newContext = data;
    if (mountedRef.current) {
      setContexts((prev) => [newContext, ...prev]);
      // If we had less than 10 contexts before, we might have more now
      if (contexts.length < 10) {
        setHasMore(true);
      }
    }
    return newContext.id;
  };

  const selectContext = async (contextId: string) => {
    try {
      console.log("Selecting context:", contextId);

      const { data: messages, error } = await supabase
        .from("messages")
        .select("*")
        .eq("context_id", contextId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error loading messages:", error);
        throw error;
      }

      const context = contexts.find((c) => c.id === contextId);
      if (context && mountedRef.current) {
        console.log(
          "Setting current context with",
          messages?.length || 0,
          "messages",
        );
        setCurrentContext({ ...context, messages: messages || [] });
      } else {
        console.error("Context not found or component unmounted");
      }
    } catch (error) {
      console.error("Error in selectContext:", error);
      throw error;
    }
  };

  const sendMessage = async (content: string) => {
    if (!currentContext || !user || !mountedRef.current) return;

    setLoading(true);

    try {
      // First, save the user message to the database
      const { data: userMessage, error: userMessageError } = await supabase
        .from("messages")
        .insert({
          context_id: currentContext.id,
          role: "user",
          content,
          user_id: user.id,
        })
        .select()
        .single();

      if (userMessageError) {
        console.error("Error saving user message:", userMessageError);
        throw userMessageError;
      }

      // Update the current context with the new user message
      if (mountedRef.current) {
        setCurrentContext((prev) =>
          prev
            ? {
                ...prev,
                messages: [...(prev.messages || []), userMessage],
              }
            : prev,
        );
      }

      // Prepare the complete message history for the AI
      const allMessages = [...(currentContext.messages || []), userMessage];
      const messagesForAI = allMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Call Edge Function to get AI response
      const { data: result, error: aiApiError } =
        await supabase.functions.invoke("chat-with-ai", {
          body: {
            messages: messagesForAI,
            model: currentContext.selected_model || selectedModel.id,
            contextId: currentContext.id,
          },
        });

      if (aiApiError) {
        console.error("AI API error:", aiApiError);
        throw new Error(aiApiError.message || "Failed to get AI response");
      }

      // Reload all messages to get the assistant's response
      const { data: messages, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .eq("context_id", currentContext.id)
        .order("created_at", { ascending: true });

      if (messagesError) {
        console.error("Error loading messages after send:", messagesError);
        throw messagesError;
      }

      // Update current context with fresh messages from DB
      if (mountedRef.current) {
        setCurrentContext((prev) =>
          prev ? { ...prev, messages: messages || [] } : prev,
        );
      }

      // Update context timestamp (handled by trigger)
      await supabase
        .from("contexts")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", currentContext.id);
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const deleteContext = async (contextId: string) => {
    const { error } = await supabase
      .from("contexts")
      .delete()
      .eq("id", contextId);

    if (error) throw error;

    if (mountedRef.current) {
      setContexts((prev) => prev.filter((c) => c.id !== contextId));
      if (currentContext?.id === contextId) {
        setCurrentContext(null);
      }
      // If we now have fewer contexts than the page size, we might not have more
      if (contexts.length <= 10) {
        setHasMore(false);
      }
    }
  };

  const refreshModelPreferences = async () => {
    if (!user || !mountedRef.current) return;

    await loadModelPreferences();
  };

  const loadMoreContexts = async () => {
    if (!user || !mountedRef.current || loadingMore) return;

    setLoadingMore(true);
    try {
      console.log("Loading more contexts for user:", user.id);

      const { data, error } = await supabase
        .from("contexts")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .range(contexts.length, contexts.length + 9);

      if (error) {
        console.error("Error loading more contexts:", error);
        return;
      }

      if (data && mountedRef.current) {
        console.log("Loaded", data.length, "more contexts");
        setContexts((prev) => [...prev, ...data]);
        setHasMore(data.length === 10); // If we got less than 10, we've reached the end
      }
    } catch (error) {
      console.error("Error in loadMoreContexts:", error);
    } finally {
      if (mountedRef.current) {
        setLoadingMore(false);
      }
    }
  };

  return (
    <ChatContext.Provider
      value={{
        contexts,
        currentContext,
        selectedModel,
        models: DEFAULT_MODELS,
        availableModels,
        userProfile,
        loading,
        loadingMore,
        hasMore,
        createContext,
        selectContext,
        sendMessage,
        setSelectedModel,
        deleteContext,
        loadUserProfile,
        updateUserProfile,
        refreshModelPreferences,
        loadMoreContexts,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
