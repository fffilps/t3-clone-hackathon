import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { useChat } from "@/providers/ChatProvider";
import { UserApiKey, UserModelPreference } from "@/types/database";
import {
  Bot,
  Eye,
  EyeOff,
  Key,
  Palette,
  Plus,
  Save,
  Settings as SettingsIcon,
  Shield,
  Trash2,
} from "lucide-react-native";

interface ApiKeyForm {
  openai: string;
  anthropic: string;
  google: string;
  openrouter: string;
}

interface ModelToggle {
  [key: string]: boolean;
}

export default function SettingsScreen() {
  const { user } = useAuth();
  const {
    userProfile,
    updateUserProfile,
    loadUserProfile,
    refreshModelPreferences,
  } = useChat();

  const [apiKeys, setApiKeys] = useState<ApiKeyForm>({
    openai: "",
    anthropic: "",
    google: "",
    openrouter: "",
  });

  const [showApiKeys, setShowApiKeys] = useState<{ [key: string]: boolean }>({
    openai: false,
    anthropic: false,
    google: false,
    openrouter: false,
  });

  const [hasApiKeys, setHasApiKeys] = useState<{ [key: string]: boolean }>({
    openai: false,
    anthropic: false,
    google: false,
    openrouter: false,
  });

  const [modelPreferences, setModelPreferences] = useState<ModelToggle>({});
  const [loading, setLoading] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState("modern");
  const [customColor, setCustomColor] = useState("#0f172a");

  // Updated models to match Next.js ModelsTab
  const models = [
    // OpenAI Models
    {
      id: "openai/chatgpt-4o-latest",
      name: "ChatGPT 4o",
      provider: "openai",
      description: "Most capable OpenAI model",
      pricing: { input: 0.005, output: 0.015 },
    },
    {
      id: "openai/gpt-4.1-nano-2025-04-14",
      name: "GPT-4.1 Nano",
      provider: "openai",
      description: "Fast and efficient",
      pricing: { input: 0.003, output: 0.009 },
    },
    {
      id: "openai/gpt-4.1-2025-04-14",
      name: "GPT-4.1",
      provider: "openai",
      description: "High performance model",
      pricing: { input: 0.01, output: 0.03 },
    },
    {
      id: "openai/o4-mini-2025-04-16",
      name: "O4 Mini",
      provider: "openai",
      description: "Latest OpenAI model",
      pricing: { input: 0.002, output: 0.006 },
    },
    {
      id: "openai/o3-2025-04-16",
      name: "O3",
      provider: "openai",
      description: "Advanced reasoning model",
      pricing: { input: 0.008, output: 0.024 },
    },
    {
      id: "openai/o3-mini-2025-01-31",
      name: "O3 Mini",
      provider: "openai",
      description: "Fast and cost-effective",
      pricing: { input: 0.001, output: 0.003 },
    },

    // Anthropic Models
    {
      id: "anthropic/claude-sonnet-4-0",
      name: "Claude 4 Sonnet",
      provider: "anthropic",
      description: "Excellent reasoning and coding",
      pricing: { input: 0.003, output: 0.015 },
    },
    {
      id: "anthropic/claude-4-opus",
      name: "Claude 4 Opus",
      provider: "anthropic",
      description: "Most capable Claude model",
      pricing: { input: 0.015, output: 0.075 },
    },
    {
      id: "anthropic/claude-3-5-haiku-latest",
      name: "Claude 3.5 Haiku",
      provider: "anthropic",
      description: "Fast and cost-effective",
      pricing: { input: 0.00025, output: 0.00125 },
    },

    // Google Models
    {
      id: "google/gemini-2.5-pro",
      name: "Gemini 2.5 Pro",
      provider: "google",
      description: "Advanced multimodal capabilities",
      pricing: { input: 0.0035, output: 0.0105 },
    },
    {
      id: "google/gemini-2.5-flash",
      name: "Gemini 2.5 Flash",
      provider: "google",
      description: "Speed optimized",
      pricing: { input: 0.000075, output: 0.0003 },
    },
    {
      id: "google/gemini-2.0-flash",
      name: "Gemini 2.0 Flash",
      provider: "google",
      description: "Balanced performance",
      pricing: { input: 0.000075, output: 0.0003 },
    },
  ];

  useEffect(() => {
    if (user) {
      loadApiKeys();
      loadModelPreferences();
      if (userProfile) {
        setSelectedTheme(userProfile.selected_theme || "modern");
        setCustomColor(userProfile.custom_primary_color || "#0f172a");
      }
    }
  }, [user, userProfile]);

  const loadApiKeys = async () => {
    if (!user) return;

    try {
      // Fetch API keys from user_profiles table (OpenAI, Google, Anthropic)
      const { data: profileData, error: profileError } = await supabase
        .from("user_profiles")
        .select("openai_api_key, google_gemini_api_key, anthropic_api_key")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError && profileError.code !== "PGRST116") {
        console.error("Error fetching profile API keys:", profileError);
      }

      // Fetch OpenRouter key from user_api_keys table
      const { data: openRouterData, error: openRouterError } = await supabase
        .from("user_api_keys")
        .select("api_key_encrypted")
        .eq("user_id", user.id)
        .eq("provider", "openrouter")
        .maybeSingle();

      if (openRouterError && openRouterError.code !== "PGRST116") {
        console.error("Error fetching OpenRouter API key:", openRouterError);
      }

      const keyMap: ApiKeyForm = {
        openai: "",
        anthropic: "",
        google: "",
        openrouter: "",
      };

      const hasKeyMap: { [key: string]: boolean } = {
        openai: false,
        anthropic: false,
        google: false,
        openrouter: false,
      };

      // Set keys from user_profiles
      if (profileData) {
        if (profileData.openai_api_key) {
          keyMap.openai = "••••••••••••••••••••••••••••••••••••••••";
          hasKeyMap.openai = true;
        }
        if (profileData.google_gemini_api_key) {
          keyMap.google = "••••••••••••••••••••••••••••••••••••••••";
          hasKeyMap.google = true;
        }
        if (profileData.anthropic_api_key) {
          keyMap.anthropic = "••••••••••••••••••••••••••••••••••••••••";
          hasKeyMap.anthropic = true;
        }
      }

      // Set OpenRouter key from user_api_keys
      if (openRouterData?.api_key_encrypted) {
        keyMap.openrouter = "••••••••••••••••••••••••••••••••••••••••";
        hasKeyMap.openrouter = true;
      }

      setApiKeys(keyMap);
      setHasApiKeys(hasKeyMap);
    } catch (error) {
      console.error("Error loading API keys:", error);
    }
  };

  const loadModelPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_model_preferences")
        .select("*")
        .eq("user_id", user.id);

      if (!error && data) {
        const preferences: ModelToggle = {};
        data.forEach((pref: UserModelPreference) => {
          preferences[pref.model_id] = pref.enabled;
        });

        // Set defaults for models not in preferences
        models.forEach((model) => {
          if (!(model.id in preferences)) {
            preferences[model.id] = true;
          }
        });

        setModelPreferences(preferences);
      } else {
        // Set all models as enabled by default
        const defaultPrefs: ModelToggle = {};
        models.forEach((model) => {
          defaultPrefs[model.id] = true;
        });
        setModelPreferences(defaultPrefs);
      }
    } catch (error) {
      console.error("Error loading model preferences:", error);
    }
  };

  const saveApiKey = async (provider: string, key: string) => {
    if (!user || !key.trim()) {
      Alert.alert("Error", "Please enter a valid API key");
      return;
    }

    // Basic validation for API key format
    if (key.length < 20) {
      Alert.alert(
        "Error",
        "API key appears to be too short. Please check and try again.",
      );
      return;
    }

    setLoading(true);
    try {
      if (provider === "openrouter") {
        // Save OpenRouter key to user_api_keys table
        const { error } = await supabase.from("user_api_keys").upsert(
          {
            user_id: user.id,
            provider: "openrouter",
            api_key_encrypted: key.trim(),
          },
          {
            onConflict: "user_id,provider",
          },
        );

        if (error) throw error;
      } else {
        // Save other keys to user_profiles table
        const columnMap = {
          openai: "openai_api_key",
          google: "google_gemini_api_key",
          anthropic: "anthropic_api_key",
        };

        const { error } = await supabase.from("user_profiles").upsert(
          {
            user_id: user.id,
            [columnMap[provider as keyof typeof columnMap]]: key.trim(),
          },
          {
            onConflict: "user_id",
          },
        );

        if (error) throw error;
      }

      Alert.alert(
        "Success",
        `${provider.toUpperCase()} API key saved successfully`,
      );
      await loadApiKeys();

      // Clear the input field
      setApiKeys((prev) => ({
        ...prev,
        [provider]: "••••••••••••••••••••••••••••••••••••••••",
      }));
    } catch (error) {
      Alert.alert("Error", "Failed to save API key");
      console.error("Error saving API key:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteApiKey = async (provider: string) => {
    if (!user) return;

    Alert.alert(
      "Delete API Key",
      `Are you sure you want to delete your ${provider.toUpperCase()} API key?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              if (provider === "openrouter") {
                // Delete OpenRouter key from user_api_keys table
                const { error } = await supabase
                  .from("user_api_keys")
                  .delete()
                  .eq("user_id", user.id)
                  .eq("provider", "openrouter");

                if (error) throw error;
              } else {
                // Delete other keys from user_profiles table by setting to null
                const columnMap = {
                  openai: "openai_api_key",
                  google: "google_gemini_api_key",
                  anthropic: "anthropic_api_key",
                };

                const { error } = await supabase.from("user_profiles").upsert(
                  {
                    user_id: user.id,
                    [columnMap[provider as keyof typeof columnMap]]: null,
                  },
                  {
                    onConflict: "user_id",
                  },
                );

                if (error) throw error;
              }

              setApiKeys((prev) => ({ ...prev, [provider]: "" }));
              setHasApiKeys((prev) => ({ ...prev, [provider]: false }));
              Alert.alert("Success", "API key deleted successfully");
            } catch (error) {
              Alert.alert("Error", "Failed to delete API key");
              console.error("Error deleting API key:", error);
            }
          },
        },
      ],
    );
  };

  const toggleModelPreference = async (modelId: string, enabled: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase.from("user_model_preferences").upsert(
        {
          user_id: user.id,
          model_id: modelId,
          enabled,
        },
        {
          onConflict: "user_id,model_id",
        },
      );

      if (error) throw error;

      setModelPreferences((prev) => ({ ...prev, [modelId]: enabled }));

      // Refresh the available models in the chat provider
      await refreshModelPreferences();
    } catch (error) {
      console.error("Error updating model preference:", error);
      Alert.alert("Error", "Failed to update model preference");
    }
  };

  const saveThemeSettings = async () => {
    try {
      await updateUserProfile({
        selected_theme: selectedTheme,
        custom_primary_color: customColor,
      });
      Alert.alert("Success", "Theme settings saved successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to save theme settings");
    }
  };

  const ApiKeySection = ({
    provider,
    title,
    description,
  }: {
    provider: keyof ApiKeyForm;
    title: string;
    description: string;
  }) => (
    <View style={styles.apiKeySection}>
      <View style={styles.apiKeyHeader}>
        <View style={styles.apiKeyInfo}>
          <Text style={styles.apiKeyTitle}>{title}</Text>
          <Text style={styles.apiKeyDescription}>{description}</Text>
          {hasApiKeys[provider] && (
            <Text style={styles.apiKeyStatus}>✓ API key configured</Text>
          )}
        </View>
        {hasApiKeys[provider] && (
          <TouchableOpacity
            style={styles.deleteKeyButton}
            onPress={() => deleteApiKey(provider)}
          >
            <Trash2 size={16} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.apiKeyInputContainer}>
        <TextInput
          style={styles.apiKeyInput}
          placeholder={
            hasApiKeys[provider]
              ? "Enter new API key to update"
              : `Enter your ${title} API key`
          }
          placeholderTextColor="#6B7280"
          value={
            showApiKeys[provider]
              ? apiKeys[provider]
              : hasApiKeys[provider]
                ? "••••••••••••••••••••••••••••••••••••••••"
                : ""
          }
          onChangeText={(text) =>
            setApiKeys((prev) => ({ ...prev, [provider]: text }))
          }
          secureTextEntry={!showApiKeys[provider] && hasApiKeys[provider]}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={styles.eyeButton}
          onPress={() =>
            setShowApiKeys((prev) => ({ ...prev, [provider]: !prev[provider] }))
          }
        >
          {showApiKeys[provider] ? (
            <EyeOff size={20} color="#6B7280" />
          ) : (
            <Eye size={20} color="#6B7280" />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.saveKeyButton,
            loading && styles.saveKeyButtonDisabled,
          ]}
          onPress={() => saveApiKey(provider, apiKeys[provider])}
          disabled={
            loading ||
            !apiKeys[provider] ||
            apiKeys[provider] === "••••••••••••••••••••••••••••••••••••••••"
          }
        >
          <Save size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case "openai":
        return "#10B981";
      case "anthropic":
        return "#3B82F6";
      case "google":
        return "#F59E0B";
      default:
        return "#8B5CF6";
    }
  };

  return (
    <LinearGradient colors={["#1a1a2e", "#16213e"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <SettingsIcon size={24} color="#8B5CF6" />
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* API Keys Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Key size={20} color="#8B5CF6" />
              <Text style={styles.sectionTitle}>API Keys</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Configure your AI provider API keys. These keys are stored
              securely and used to access AI models. OpenRouter serves as a
              fallback when other keys are unavailable.
            </Text>

            <ApiKeySection
              provider="openai"
              title="OpenAI"
              description="GPT models (GPT-4, GPT-3.5)"
            />

            <ApiKeySection
              provider="anthropic"
              title="Anthropic"
              description="Claude models (Claude 3.5 Sonnet, Haiku)"
            />

            <ApiKeySection
              provider="google"
              title="Google"
              description="Gemini models (Gemini Pro 1.5)"
            />

            <ApiKeySection
              provider="openrouter"
              title="OpenRouter"
              description="Fallback provider for all models"
            />
          </View>

          {/* Model Preferences Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Bot size={20} color="#8B5CF6" />
              <Text style={styles.sectionTitle}>Model Preferences</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Enable or disable specific AI models in your chat interface. Only
              enabled models will appear in the model selection.
            </Text>

            {models.map((model) => (
              <View key={model.id} style={styles.modelItem}>
                <View style={styles.modelInfo}>
                  <View
                    style={[
                      styles.modelIndicator,
                      { backgroundColor: getProviderColor(model.provider) },
                    ]}
                  />
                  <View style={styles.modelDetails}>
                    <Text style={styles.modelName}>{model.name}</Text>
                    <Text style={styles.modelDescription}>
                      {model.description}
                    </Text>
                    <Text style={styles.modelPricing}>
                      Input: ${model.pricing.input}/1K • Output: $
                      {model.pricing.output}/1K
                    </Text>
                  </View>
                </View>
                <Switch
                  value={modelPreferences[model.id] || false}
                  onValueChange={(enabled) =>
                    toggleModelPreference(model.id, enabled)
                  }
                  trackColor={{ false: "#374151", true: "#8B5CF6" }}
                  thumbColor={
                    modelPreferences[model.id] ? "#FFFFFF" : "#9CA3AF"
                  }
                />
              </View>
            ))}
          </View>

          {/* Theme Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Palette size={20} color="#8B5CF6" />
              <Text style={styles.sectionTitle}>Appearance</Text>
            </View>

            <View style={styles.themeItem}>
              <Text style={styles.themeLabel}>Theme</Text>
              <View style={styles.themeOptions}>
                {["modern", "classic", "minimal"].map((theme) => (
                  <TouchableOpacity
                    key={theme}
                    style={[
                      styles.themeOption,
                      selectedTheme === theme && styles.themeOptionSelected,
                    ]}
                    onPress={() => setSelectedTheme(theme)}
                  >
                    <Text
                      style={[
                        styles.themeOptionText,
                        selectedTheme === theme &&
                          styles.themeOptionTextSelected,
                      ]}
                    >
                      {theme.charAt(0).toUpperCase() + theme.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.colorPickerContainer}>
              <Text style={styles.themeLabel}>Primary Color</Text>
              <View style={styles.colorOptions}>
                {[
                  "#0f172a",
                  "#8B5CF6",
                  "#3B82F6",
                  "#10B981",
                  "#F59E0B",
                  "#EF4444",
                ].map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      customColor === color && styles.colorOptionSelected,
                    ]}
                    onPress={() => setCustomColor(color)}
                  />
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={styles.saveThemeButton}
              onPress={saveThemeSettings}
            >
              <Text style={styles.saveThemeButtonText}>
                Save Theme Settings
              </Text>
            </TouchableOpacity>
          </View>

          {/* Security Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Shield size={20} color="#8B5CF6" />
              <Text style={styles.sectionTitle}>Security & Privacy</Text>
            </View>
            <Text style={styles.securityNote}>
              Your API keys are stored securely in our database. They are only
              used to make requests to AI providers on your behalf and are never
              shared with third parties.
            </Text>
            <Text style={styles.securityNote}>
              For maximum security in production environments, API keys should
              be encrypted before storage. This implementation serves as a
              foundation that can be enhanced with proper encryption.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: "Inter-Bold",
    color: "#FFFFFF",
    marginLeft: 12,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter-SemiBold",
    color: "#FFFFFF",
    marginLeft: 8,
  },
  sectionDescription: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    color: "#9CA3AF",
    marginBottom: 20,
    lineHeight: 20,
  },
  apiKeySection: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  apiKeyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  apiKeyInfo: {
    flex: 1,
  },
  apiKeyTitle: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  apiKeyDescription: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
    color: "#9CA3AF",
    marginBottom: 4,
  },
  apiKeyStatus: {
    fontSize: 11,
    fontFamily: "Inter-Medium",
    color: "#10B981",
  },
  deleteKeyButton: {
    padding: 8,
  },
  apiKeyInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  apiKeyInput: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter-Regular",
    color: "#FFFFFF",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  eyeButton: {
    padding: 8,
    marginRight: 8,
  },
  saveKeyButton: {
    backgroundColor: "#8B5CF6",
    borderRadius: 8,
    padding: 10,
  },
  saveKeyButtonDisabled: {
    opacity: 0.5,
  },
  modelItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  modelInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  modelIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  modelDetails: {
    flex: 1,
  },
  modelName: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  modelDescription: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
    color: "#9CA3AF",
    marginBottom: 2,
  },
  modelPricing: {
    fontSize: 10,
    fontFamily: "Inter-Regular",
    color: "#6B7280",
  },
  themeItem: {
    marginBottom: 20,
  },
  themeLabel: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  themeOptions: {
    flexDirection: "row",
    gap: 8,
  },
  themeOption: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  themeOptionSelected: {
    backgroundColor: "#8B5CF6",
    borderColor: "#8B5CF6",
  },
  themeOptionText: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
    color: "#9CA3AF",
  },
  themeOptionTextSelected: {
    color: "#FFFFFF",
  },
  colorPickerContainer: {
    marginBottom: 20,
  },
  colorOptions: {
    flexDirection: "row",
    gap: 12,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorOptionSelected: {
    borderColor: "#FFFFFF",
  },
  saveThemeButton: {
    backgroundColor: "#8B5CF6",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  saveThemeButtonText: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
    color: "#FFFFFF",
  },
  securityNote: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    color: "#9CA3AF",
    lineHeight: 20,
    marginBottom: 12,
  },
});
