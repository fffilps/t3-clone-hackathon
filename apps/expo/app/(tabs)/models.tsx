import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChat } from '@/providers/ChatProvider';
import { Check, Zap, Brain, Sparkles, CircleAlert as AlertCircle } from 'lucide-react-native';
import { AIModel } from '@/types/database';

const getProviderIcon = (provider: string) => {
  switch (provider) {
    case 'openai':
      return <Sparkles size={20} color="#10B981" />;
    case 'anthropic':
      return <Brain size={20} color="#3B82F6" />;
    case 'google':
      return <Zap size={20} color="#F59E0B" />;
    default:
      return <Sparkles size={20} color="#8B5CF6" />;
  }
};

const getProviderColor = (provider: string) => {
  switch (provider) {
    case 'openai':
      return '#10B981';
    case 'anthropic':
      return '#3B82F6';
    case 'google':
      return '#F59E0B';
    default:
      return '#8B5CF6';
  }
};

export default function ModelsScreen() {
  const { availableModels, selectedModel, setSelectedModel } = useChat();

  const renderModelItem = ({ item }: { item: AIModel }) => {
    const isSelected = selectedModel.id === item.id;
    const providerColor = getProviderColor(item.provider);

    return (
      <TouchableOpacity
        style={[
          styles.modelCard,
          isSelected && { ...styles.selectedCard, borderColor: providerColor }
        ]}
        onPress={() => setSelectedModel(item)}
      >
        <View style={styles.modelHeader}>
          <View style={styles.modelInfo}>
            {getProviderIcon(item.provider)}
            <View style={styles.modelTitleContainer}>
              <Text style={styles.modelName}>{item.name}</Text>
              <Text style={[styles.modelProvider, { color: providerColor }]}>
                {item.provider.toUpperCase()}
              </Text>
            </View>
          </View>
          {isSelected && (
            <View style={[styles.checkIcon, { backgroundColor: providerColor }]}>
              <Check size={16} color="#FFFFFF" />
            </View>
          )}
        </View>
        
        <Text style={styles.modelDescription}>{item.description}</Text>
        
        <View style={styles.modelSpecs}>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Max Tokens</Text>
            <Text style={styles.specValue}>{item.maxTokens.toLocaleString()}</Text>
          </View>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Input</Text>
            <Text style={styles.specValue}>${item.pricing.input}/1K tokens</Text>
          </View>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Output</Text>
            <Text style={styles.specValue}>${item.pricing.output}/1K tokens</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>AI Models</Text>
          <Text style={styles.headerSubtitle}>
            Choose from your enabled AI models
          </Text>
        </View>

        {availableModels.length === 0 ? (
          <View style={styles.emptyState}>
            <AlertCircle size={64} color="#8B5CF6" />
            <Text style={styles.emptyTitle}>No Models Available</Text>
            <Text style={styles.emptySubtitle}>
              Enable models in Settings to start chatting with AI
            </Text>
          </View>
        ) : (
          <FlatList
            data={availableModels}
            renderItem={renderModelItem}
            keyExtractor={(item) => item.id}
            style={styles.modelsList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modelsListContent}
          />
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Currently selected: <Text style={styles.selectedModelText}>{selectedModel.name}</Text>
          </Text>
          <Text style={styles.footerNote}>
            Manage model availability in Settings
          </Text>
        </View>
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
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
  },
  modelsList: {
    flex: 1,
  },
  modelsListContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modelCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
  },
  modelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modelTitleContainer: {
    marginLeft: 12,
    flex: 1,
  },
  modelName: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  modelProvider: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    opacity: 0.8,
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modelDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#D1D5DB',
    lineHeight: 20,
    marginBottom: 16,
  },
  modelSpecs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  specItem: {
    flex: 1,
    alignItems: 'center',
  },
  specLabel: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  specValue: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 4,
  },
  footerNote: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
  selectedModelText: {
    color: '#8B5CF6',
    fontFamily: 'Inter-SemiBold',
  },
});