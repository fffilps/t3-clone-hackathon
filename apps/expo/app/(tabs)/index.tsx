import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useChat } from "@/providers/ChatProvider";
import { Message } from "@/types/database";
import { Bot, Plus, Send, Trash2 } from "lucide-react-native";

export default function ChatScreen() {
  const {
    contexts,
    currentContext,
    selectedModel,
    loading,
    loadingMore,
    hasMore,
    createContext,
    selectContext,
    sendMessage,
    deleteContext,
    loadMoreContexts,
  } = useChat();

  const [inputText, setInputText] = useState("");
  const [showContexts, setShowContexts] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const [hasAutoScrolled, setHasAutoScrolled] = useState(false);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const message = inputText.trim();
    setInputText("");

    if (!currentContext) {
      // Create new context
      const contextId = await createContext(
        message.slice(0, 50) + (message.length > 50 ? "..." : ""),
        selectedModel.id,
      );
      await selectContext(contextId);
    }

    await sendMessage(message);
  };

  const handleNewContext = () => {
    setShowContexts(false);
    setHasAutoScrolled(false);
  };

  const handleDeleteContext = (contextId: string) => {
    Alert.alert(
      "Delete Context",
      "Are you sure you want to delete this conversation?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteContext(contextId),
        },
      ],
    );
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isPending =
      item.content === "Thinking..." || item.id.startsWith("temp-");

    return (
      <View
        style={[
          styles.messageRow,
          item.role === "user" ? styles.userRow : styles.assistantRow,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            item.role === "user" ? styles.userBubble : styles.assistantBubble,
            isPending && styles.pendingBubble,
          ]}
        >
          {item.role === "assistant" ? (
            <View style={styles.assistantContentRow}>
              <View style={styles.botIcon}>
                <Bot size={16} color="#8B5CF6" />
              </View>
              <Text
                style={[
                  styles.messageText,
                  styles.assistantText,
                  isPending && styles.pendingText,
                ]}
                numberOfLines={0}
              >
                {item.content}
              </Text>
              {isPending && (
                <ActivityIndicator
                  size="small"
                  color="#8B5CF6"
                  style={styles.pendingSpinner}
                />
              )}
            </View>
          ) : (
            <Text style={[styles.messageText, styles.userText]}>
              {item.content}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderContextItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.contextItem}
      onPress={() => {
        selectContext(item.id);
        setShowContexts(false);
        setHasAutoScrolled(false);
      }}
    >
      <View style={styles.contextInfo}>
        <Text style={styles.contextTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.contextModel}>
          {item.selected_model || selectedModel.name}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteContext(item.id)}
      >
        <Trash2 size={16} color="#EF4444" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // Auto-scroll to bottom only when first opening (first load of messages)
  useEffect(() => {
    if (currentContext?.messages?.length && !hasAutoScrolled) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
        setHasAutoScrolled(true);
      }, 100);
    }
  }, [currentContext?.messages, hasAutoScrolled]);

  if (showContexts) {
    return (
      <LinearGradient colors={["#1a1a2e", "#16213e"]} style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
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
            contentContainerStyle={styles.contextsListContent}
            showsVerticalScrollIndicator={false}
            onEndReached={() => {
              if (hasMore && !loadingMore) {
                loadMoreContexts();
              }
            }}
            onEndReachedThreshold={0.1}
            ListFooterComponent={() =>
              loadingMore ? (
                <View style={styles.loadingMoreContainer}>
                  <ActivityIndicator size="small" color="#8B5CF6" />
                  <Text style={styles.loadingMoreText}>
                    Loading more chats...
                  </Text>
                </View>
              ) : null
            }
          />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#1a1a2e", "#16213e"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
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
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.chatContainer}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          {currentContext?.messages?.length ? (
            <FlatList
              ref={flatListRef}
              data={currentContext.messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              style={styles.messagesList}
              contentContainerStyle={{ paddingVertical: 12 }}
              showsVerticalScrollIndicator={true}
              scrollEventThrottle={16}
              removeClippedSubviews={true}
              maxToRenderPerBatch={10}
              windowSize={10}
              initialNumToRender={10}
              getItemLayout={(data, index) => ({
                length: 80, // Approximate height of each message
                offset: 80 * index,
                index,
              })}
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
              style={[
                styles.sendButton,
                (!inputText.trim() || loading) && styles.sendButtonDisabled,
              ]}
              onPress={handleSendMessage}
              disabled={!inputText.trim() || loading}
            >
              <LinearGradient
                colors={["#8B5CF6", "#3B82F6"]}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  contextsButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  contextsButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Inter-Medium",
  },
  modelIndicator: {
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  modelText: {
    color: "#8B5CF6",
    fontSize: 12,
    fontFamily: "Inter-SemiBold",
  },
  newChatButton: {
    backgroundColor: "#8B5CF6",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: "Inter-Bold",
    color: "#FFFFFF",
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  messageRow: {
    flexDirection: "row",
    marginVertical: 4,
  },
  userRow: {
    justifyContent: "flex-end",
  },
  assistantRow: {
    justifyContent: "flex-start",
  },
  messageBubble: {
    maxWidth: "80%",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: "#8B5CF6",
  },
  assistantBubble: {
    backgroundColor: "rgba(255,255,255,0.08)",
    flexDirection: "row",
    alignItems: "flex-start",
  },
  assistantContentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    flexShrink: 1,
    flexWrap: "wrap",
  },
  botIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  messageText: {
    fontSize: 16,
    fontFamily: "Inter-Regular",
    lineHeight: 22,
    color: "#FFFFFF",
    flexShrink: 1,
    flexWrap: "wrap",
    flex: 1,
  },
  userText: {
    color: "#FFFFFF",
  },
  assistantText: {
    color: "#FFFFFF",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontFamily: "Inter-Bold",
    color: "#FFFFFF",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: "Inter-Regular",
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 24,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  textInput: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: "Inter-Regular",
    color: "#FFFFFF",
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  contextsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contextItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  contextInfo: {
    flex: 1,
  },
  contextTitle: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  contextModel: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
    color: "#8B5CF6",
  },
  deleteButton: {
    padding: 8,
  },
  contextsListContent: {
    paddingBottom: 20,
  },
  loadingMoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  loadingMoreText: {
    color: "#8B5CF6",
    fontSize: 14,
    fontFamily: "Inter-Regular",
    marginLeft: 8,
  },
  pendingBubble: {
    opacity: 0.6,
  },
  pendingText: {
    opacity: 0.7,
  },
  pendingSpinner: {
    marginLeft: 8,
  },
});
