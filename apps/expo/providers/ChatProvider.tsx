import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthProvider';
import { Context, Message, AIModel, UserProfile, UserModelPreference } from '@/types/database';

interface ChatContextType {
  contexts: Context[];
  currentContext: Context | null;
  selectedModel: AIModel;
  models: AIModel[];
  availableModels: AIModel[];
  userProfile: UserProfile | null;
  loading: boolean;
  createContext: (title: string, model: string) => Promise<string>;
  selectContext: (contextId: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  setSelectedModel: (model: AIModel) => void;
  deleteContext: (contextId: string) => Promise<void>;
  loadUserProfile: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const DEFAULT_MODELS: AIModel[] = [
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    description: 'Fast and efficient for most tasks',
    maxTokens: 128000,
    pricing: { input: 0.00015, output: 0.0006 },
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    description: 'Most capable GPT model, great for complex tasks',
    maxTokens: 128000,
    pricing: { input: 0.005, output: 0.015 },
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    description: 'Most intelligent Claude model',
    maxTokens: 200000,
    pricing: { input: 0.003, output: 0.015 },
  },
  {
    id: 'anthropic/claude-3-haiku',
    name: 'Claude 3 Haiku',
    provider: 'anthropic',
    description: 'Fastest and most compact model for near-instant responsiveness',
    maxTokens: 200000,
    pricing: { input: 0.00025, output: 0.00125 },
  },
  {
    id: 'google/gemini-pro-1.5',
    name: 'Gemini Pro 1.5',
    provider: 'google',
    description: 'Google\'s most capable AI model',
    maxTokens: 2000000,
    pricing: { input: 0.00125, output: 0.005 },
  },
];

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [contexts, setContexts] = useState<Context[]>([]);
  const [currentContext, setCurrentContext] = useState<Context | null>(null);
  const [selectedModel, setSelectedModel] = useState<AIModel>(DEFAULT_MODELS[0]);
  const [availableModels, setAvailableModels] = useState<AIModel[]>(DEFAULT_MODELS);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
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

    const { data, error } = await supabase
      .from('contexts')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (!error && data && mountedRef.current) {
      setContexts(data);
    }
  };

  const loadUserProfile = async () => {
    if (!user || !mountedRef.current) return;

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!error && data && mountedRef.current) {
      setUserProfile(data);
    } else if (error && error.code === 'PGRST116' && mountedRef.current) {
      // Profile doesn't exist, create one
      const { data: newProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: user.id,
          selected_theme: 'modern',
          custom_primary_color: '#0f172a',
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
      .from('user_model_preferences')
      .select('*')
      .eq('user_id', user.id);

    if (!error && data && mountedRef.current) {
      const enabledModelIds = data
        .filter((pref: UserModelPreference) => pref.enabled)
        .map((pref: UserModelPreference) => pref.model_id);
      
      // If no preferences exist, show all models
      if (enabledModelIds.length === 0) {
        setAvailableModels(DEFAULT_MODELS);
      } else {
        const filteredModels = DEFAULT_MODELS.filter(model => 
          enabledModelIds.includes(model.id)
        );
        setAvailableModels(filteredModels);
        
        // Update selected model if it's not available
        if (!enabledModelIds.includes(selectedModel.id) && filteredModels.length > 0) {
          setSelectedModel(filteredModels[0]);
        }
      }
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !userProfile || !mountedRef.current) return;

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single();

    if (!error && data && mountedRef.current) {
      setUserProfile(data);
    }
  };

  const createContext = async (title: string, model: string): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('contexts')
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
      setContexts(prev => [newContext, ...prev]);
    }
    return newContext.id;
  };

  const selectContext = async (contextId: string) => {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('context_id', contextId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const context = contexts.find(c => c.id === contextId);
    if (context && mountedRef.current) {
      setCurrentContext({ ...context, messages: messages || [] });
    }
  };

  const sendMessage = async (content: string) => {
    if (!currentContext || !user || !mountedRef.current) return;

    setLoading(true);

    try {
      // Add user message to database
      const { data: userMessage, error: userError } = await supabase
        .from('messages')
        .insert({
          context_id: currentContext.id,
          content,
          role: 'user',
        })
        .select()
        .single();

      if (userError) throw userError;

      // Update current context with user message
      if (mountedRef.current) {
        setCurrentContext(prev => ({
          ...prev!,
          messages: [...(prev!.messages || []), userMessage],
        }));
      }

      // Send to AI API with user profile
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          contextId: currentContext.id,
          model: currentContext.selected_model || selectedModel.id,
          messages: currentContext.messages || [],
          userProfile: { ...userProfile, user_id: user.id },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get AI response');
      }

      const { content: aiContent } = await response.json();

      // Add AI response to database
      const { data: aiMessage, error: aiError } = await supabase
        .from('messages')
        .insert({
          context_id: currentContext.id,
          content: aiContent,
          role: 'assistant',
        })
        .select()
        .single();

      if (aiError) throw aiError;

      // Update current context with AI message
      if (mountedRef.current) {
        setCurrentContext(prev => ({
          ...prev!,
          messages: [...(prev!.messages || []), userMessage, aiMessage],
        }));
      }

      // Update context timestamp (handled by trigger)
      await supabase
        .from('contexts')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', currentContext.id);

    } catch (error) {
      console.error('Error sending message:', error);
      // You might want to show this error to the user
      throw error;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const deleteContext = async (contextId: string) => {
    const { error } = await supabase
      .from('contexts')
      .delete()
      .eq('id', contextId);

    if (error) throw error;

    if (mountedRef.current) {
      setContexts(prev => prev.filter(c => c.id !== contextId));
      if (currentContext?.id === contextId) {
        setCurrentContext(null);
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
        createContext,
        selectContext,
        sendMessage,
        setSelectedModel,
        deleteContext,
        loadUserProfile,
        updateUserProfile,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};