export async function POST(request: Request) {
  try {
    const { message, contextId, model, messages, userProfile } = await request.json();

    // Import supabase to get user's API keys
    const { supabase } = await import('@/lib/supabase');
    
    // Get user ID from the userProfile
    const userId = userProfile?.user_id;
    
    if (!userId) {
      throw new Error('User authentication required');
    }
    
    let apiKey: string = '';
    let useOpenRouter = false;
    
    // Determine the provider from the model ID
    const [provider] = model.split('/');
    
    // Try to get user's API key for the specific provider
    const { data: userApiKeys } = await supabase
      .from('user_api_keys')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', provider)
      .single();
    
    if (userApiKeys?.api_key_encrypted) {
      // In a real app, you'd decrypt this
      apiKey = userApiKeys.api_key_encrypted;
    } else {
      // Check for OpenRouter as fallback
      const { data: openRouterKey } = await supabase
        .from('user_api_keys')
        .select('*')
        .eq('user_id', userId)
        .eq('provider', 'openrouter')
        .single();
      
      if (openRouterKey?.api_key_encrypted) {
        apiKey = openRouterKey.api_key_encrypted;
        useOpenRouter = true;
      }
    }
    
    // Fallback to environment variables if no user API key
    if (!apiKey) {
      if (provider === 'openai') {
        apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';
      } else if (provider === 'anthropic') {
        apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '';
      } else if (provider === 'google') {
        apiKey = process.env.EXPO_PUBLIC_GOOGLE_API_KEY || '';
      }
      
      // If still no key, try OpenRouter from env
      if (!apiKey) {
        apiKey = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || '';
        useOpenRouter = true;
      }
    }

    if (!apiKey || apiKey.trim() === '') {
      throw new Error(`No API key configured for ${provider}. Please add your API key in Settings or configure OpenRouter as a fallback.`);
    }

    let apiUrl: string;
    let requestBody: any;
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Build conversation history
    const conversationMessages = messages.map((msg: any) => ({
      role: msg.role === 'system' ? 'system' : msg.role,
      content: msg.content,
    }));
    
    // Add system message if user has preferences
    if (userProfile?.preferred_name || userProfile?.occupation || userProfile?.chat_traits) {
      const systemPrompt = `You are a helpful AI assistant. ${
        userProfile.preferred_name ? `The user prefers to be called ${userProfile.preferred_name}. ` : ''
      }${
        userProfile.occupation ? `They work as a ${userProfile.occupation}. ` : ''
      }${
        userProfile.chat_traits?.length ? `Their communication preferences: ${userProfile.chat_traits.join(', ')}. ` : ''
      }Please tailor your responses accordingly.`;
      
      conversationMessages.unshift({ role: 'system', content: systemPrompt });
    }
    
    conversationMessages.push({ role: 'user', content: message });

    if (useOpenRouter) {
      // Use OpenRouter API
      apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
      headers['Authorization'] = `Bearer ${apiKey}`;
      headers['HTTP-Referer'] = 'https://your-app.com';
      headers['X-Title'] = 'AI Chat Mobile';
      
      requestBody = {
        model: model, // Use full model ID for OpenRouter
        messages: conversationMessages,
        max_tokens: 1000,
        temperature: 0.7,
      };
    } else if (provider === 'openai') {
      // OpenAI API
      apiUrl = 'https://api.openai.com/v1/chat/completions';
      headers['Authorization'] = `Bearer ${apiKey}`;
      
      requestBody = {
        model: model.replace('openai/', ''),
        messages: conversationMessages,
        max_tokens: 1000,
        temperature: 0.7,
      };
    } else if (provider === 'anthropic') {
      // Anthropic API
      apiUrl = 'https://api.anthropic.com/v1/messages';
      headers['x-api-key'] = apiKey;
      headers['anthropic-version'] = '2023-06-01';
      
      // Separate system messages from conversation for Anthropic
      const systemMessages = conversationMessages.filter(msg => msg.role === 'system');
      const chatMessages = conversationMessages.filter(msg => msg.role !== 'system');
      
      requestBody = {
        model: model.replace('anthropic/', ''),
        max_tokens: 1000,
        messages: chatMessages,
        system: systemMessages.length > 0 ? systemMessages[0].content : undefined,
      };
    } else if (provider === 'google') {
      // Google Gemini API
      const modelName = model.replace('google/', '');
      apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      
      // Convert conversation to Gemini format
      const contents = conversationMessages
        .filter(msg => msg.role !== 'system')
        .map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        }));
      
      requestBody = {
        contents,
        systemInstruction: conversationMessages.find(msg => msg.role === 'system')?.content,
      };
    } else {
      throw new Error('Unsupported model provider');
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      
      // Handle specific error cases
      if (response.status === 401) {
        throw new Error(`Invalid API key for ${provider}. Please check your API key in Settings.`);
      } else if (response.status === 429) {
        throw new Error(`Rate limit exceeded for ${provider}. Please try again later.`);
      } else if (response.status === 402) {
        throw new Error(`Insufficient credits for ${provider}. Please check your account balance.`);
      } else {
        throw new Error(`API request failed: ${response.statusText}`);
      }
    }

    const data = await response.json();
    
    let content: string;
    
    if (useOpenRouter || provider === 'openai') {
      content = data.choices[0].message.content;
    } else if (provider === 'anthropic') {
      content = data.content[0].text;
    } else if (provider === 'google') {
      content = data.candidates[0].content.parts[0].text;
    } else {
      throw new Error('Unsupported model response format');
    }

    return Response.json({ content });
  } catch (error) {
    console.error('Chat API error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to process chat request' },
      { status: 500 }
    );
  }
}