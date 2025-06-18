export interface Database {
  public: {
    Tables: {
      contexts: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          created_at: string;
          updated_at: string;
          selected_model: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          created_at?: string;
          updated_at?: string;
          selected_model?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          created_at?: string;
          updated_at?: string;
          selected_model?: string | null;
        };
      };
      messages: {
        Row: {
          id: string;
          context_id: string;
          role: 'user' | 'assistant' | 'system';
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          context_id: string;
          role: 'user' | 'assistant' | 'system';
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          context_id?: string;
          role?: 'user' | 'assistant' | 'system';
          content?: string;
          created_at?: string;
        };
      };
      user_api_keys: {
        Row: {
          id: string;
          user_id: string;
          provider: string;
          api_key_encrypted: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          provider?: string;
          api_key_encrypted: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          provider?: string;
          api_key_encrypted?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          preferred_name: string | null;
          occupation: string | null;
          chat_traits: string[] | null;
          created_at: string;
          updated_at: string;
          openai_api_key: string | null;
          google_gemini_api_key: string | null;
          anthropic_api_key: string | null;
          selected_theme: string | null;
          custom_primary_color: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          preferred_name?: string | null;
          occupation?: string | null;
          chat_traits?: string[] | null;
          created_at?: string;
          updated_at?: string;
          openai_api_key?: string | null;
          google_gemini_api_key?: string | null;
          anthropic_api_key?: string | null;
          selected_theme?: string | null;
          custom_primary_color?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          preferred_name?: string | null;
          occupation?: string | null;
          chat_traits?: string[] | null;
          created_at?: string;
          updated_at?: string;
          openai_api_key?: string | null;
          google_gemini_api_key?: string | null;
          anthropic_api_key?: string | null;
          selected_theme?: string | null;
          custom_primary_color?: string | null;
        };
      };
      user_model_preferences: {
        Row: {
          id: string;
          user_id: string;
          model_id: string;
          enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          model_id: string;
          enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          model_id?: string;
          enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Enums: {
      message_role: 'user' | 'assistant' | 'system';
    };
  };
}

export interface AIModel {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google';
  description: string;
  maxTokens: number;
  pricing: {
    input: number;
    output: number;
  };
}

export interface Message {
  id: string;
  context_id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  created_at: string;
}

export interface Context {
  id: string;
  user_id: string;
  title: string;
  selected_model: string | null;
  created_at: string;
  updated_at: string;
  messages?: Message[];
}

export interface UserProfile {
  id: string;
  user_id: string;
  preferred_name: string | null;
  occupation: string | null;
  chat_traits: string[] | null;
  created_at: string;
  updated_at: string;
  openai_api_key: string | null;
  google_gemini_api_key: string | null;
  anthropic_api_key: string | null;
  selected_theme: string | null;
  custom_primary_color: string | null;
}

export interface UserApiKey {
  id: string;
  user_id: string;
  provider: string;
  api_key_encrypted: string;
  created_at: string;
  updated_at: string;
}

export interface UserModelPreference {
  id: string;
  user_id: string;
  model_id: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}