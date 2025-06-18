import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChat } from '@/providers/ChatProvider';
import { Send, Plus, Trash2, Bot } from 'lucide-react-native';
import { Message } from '@/types/database';

export default function ChatScreen() {
  const {
    contexts,
    currentContext,
    selectedModel,
    loading,
    createContext,
    selectContext,
    sendMessage,
    deleteContext,
  } = useChat();

  const [inputText, setInputText] = useState('');
  const [showContexts, setShowContexts] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (currentContext?.messages?.length) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [currentContext?.messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const message = inputText.trim();
    setInputText('');

    if (!currentContext) {
      // Create new context
      const contextId = await createContext(
        message.slice(0, 50) + (message.length > 50 ? '...' : ''),
        selectedModel.id
      );
      await selectContext(contextId);
    }

    await sendMessage(message);
  };

  const handleNewContext = () => {
    setShowContexts(false);
  };

  const handleDeleteContext = (contextId: string) => {
    Alert.alert(
      'Delete Context',
      'Are you sure you want to delete this conversation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteContext(contextId),
        },
      ]
    );
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageContainer,
      item.role === 'user' ? styles.userMessage : styles.assistantMessage
    ]}>
      <View style={[
        styles.messageBubble,
        item.role === 'user' ? styles.userBubble : styles.assistantBubble
      ]}>
        {item.role === 'assistant' && (
          <View style={styles.botIcon}>
            <Bot size={16} color="#8B5CF6" />
          </View>
        )}
        <Text style={[
          styles.messageText,
          item.role === 'user' ? styles.userText : styles.assistantText
        ]}>
          {item.content}
        </Text>
      </View>
    </View>
  );

  const renderContextItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.contextItem}
      onPress={() => {
        selectContext(item.id);
        setShowContexts(false);
      }}
    >
      <View style={styles.contextInfo}>
        <Text style={styles.contextTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.contextModel}>{item.selected_model || selectedModel.name}</Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteContext(item.id)}
      >
        <Trash2 size={16} color="#EF4444" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (showContexts) {
    return (
      <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Conversations</Text>
            <TouchableOpacity
              style={styles.newChatButton}
              onPress={handleNewContext}
            >
              <Plus size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={contexts}
            renderItem={renderContextItem}
            keyExtractor={(item) => item.id}
            style={styles.contextsList}
            showsVerticalScrollIndicator={false}
          />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.contextsButton}
            onPress={() => setShowContexts(true)}
          >
            <Text style={styles.contextsButtonText}>
              {contexts.length} Chats
            </Text>
          </TouchableOpacity>
          <View style={styles.modelIndicator}>
            <Text style={styles.modelText}>{selectedModel.name}</Text>
          </View>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.chatContainer}
        >
          {currentContext?.messages?.length ? (
            <FlatList
              ref={flatListRef}
              data={currentContext.messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              style={styles.messagesList}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />
          ) : (
            <View style={styles.emptyState}>
              <Bot size={64} color="#8B5CF6" />
              <Text style={styles.emptyTitle}>Start a conversation</Text>
              <Text style={styles.emptySubtitle}>
                Ask me anything and I'll help you with {selectedModel.name}
              </Text>
            </View>
          )}

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Type your message..."
              placeholderTextColor="#6B7280"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={2000}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!inputText.trim() || loading) && styles.sendButtonDisabled]}
              onPress={handleSendMessage}
              disabled={!inputText.trim() || loading}
            >
              <LinearGradient
                colors={['#8B5CF6', '#3B82F6']}
                style={styles.sendButtonGradient}
              >
                <Send size={20} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  contextsButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  contextsButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  modelIndicator: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  modelText: {
    color: '#8B5CF6',
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  newChatButton: {
    backgroundColor: '#8B5CF6',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  assistantMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: '#8B5CF6',
  },
  assistantBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  botIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  messageText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    lineHeight: 22,
    flex: 1,
  },
  userText: {
    color: '#FFFFFF',
  },
  assistantText: {
    color: '#FFFFFF',
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  textInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contextsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contextItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  contextInfo: {
    flex: 1,
  },
  contextTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  contextModel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#8B5CF6',
  },
  deleteButton: {
    padding: 8,
  },
});