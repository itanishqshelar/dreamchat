import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useChat, type UIMessage } from '../hooks/useChat';
import ChatMessage from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';
import Sidebar from '../components/Sidebar';
import { Colors, Spacing, FontSize, BorderRadius } from '../theme/colors';

export default function ChatScreen() {
  const {
    sessions,
    currentSessionId,
    messages,
    isGenerating,
    sendMessage,
    stopGenerating,
    selectSession,
    newChat,
    deleteSession,
  } = useChat();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Auto-scroll to the latest message whenever messages change
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSelectSession = (id: string) => {
    selectSession(id);
    setSidebarOpen(false);
  };

  const handleNewChat = () => {
    newChat();
    setSidebarOpen(false);
  };

  const renderMessage = ({ item }: { item: UIMessage }) => (
    <ChatMessage
      role={item.role}
      content={item.content}
      isStreaming={item.isStreaming}
      isThinking={item.isThinking}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyLogo}>
        <Text style={styles.emptyLogoText}>D</Text>
      </View>
      <Text style={styles.emptyTitle}>DreamChat</Text>
      <Text style={styles.emptySubtitle}>Your offline AI assistant</Text>

      <View style={styles.suggestionsContainer}>
        {[
          'Explain quantum computing simply',
          'Write a short poem about coding',
          'What are the benefits of open source?',
        ].map((suggestion, index) => (
          <TouchableOpacity
            key={index}
            style={styles.suggestionChip}
            onPress={() => sendMessage(suggestion)}
            activeOpacity={0.7}
          >
            <Text style={styles.suggestionText}>{suggestion}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.bgSecondary}
      />

      {/* ── Header ── */}
      <View style={styles.header}>
        {/* Hamburger — opens session sidebar */}
        <TouchableOpacity
          style={styles.hamburgerBtn}
          onPress={() => setSidebarOpen(true)}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <View style={styles.hamburgerLine} />
          <View style={styles.hamburgerLine} />
          <View style={styles.hamburgerLine} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>DreamChat</Text>

        {/* New-chat button on the right */}
        <TouchableOpacity
          style={styles.newChatHeaderBtn}
          onPress={handleNewChat}
          activeOpacity={0.7}
        >
          <Text style={styles.newChatHeaderText}>New</Text>
        </TouchableOpacity>
      </View>

      {/* ── Chat area ── */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={[
            styles.messageList,
            messages.length === 0 && styles.messageListEmpty,
          ]}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            if (messages.length > 0) {
              flatListRef.current?.scrollToEnd({ animated: true });
            }
          }}
        />

        <ChatInput
          onSend={sendMessage}
          onStop={stopGenerating}
          disabled={isGenerating}
          isGenerating={isGenerating}
        />
      </KeyboardAvoidingView>

      {/* ── Sidebar overlay — renders on top of everything ── */}
      <Sidebar
        visible={sidebarOpen}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onNewChat={handleNewChat}
        onSelectSession={handleSelectSession}
        onDeleteSession={deleteSession}
        onClose={() => setSidebarOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    paddingTop: Spacing.xl + Spacing.md,
    backgroundColor: Colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  hamburgerBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 5,
    marginRight: Spacing.sm,
  },
  hamburgerLine: {
    height: 2,
    borderRadius: 1,
    backgroundColor: Colors.textSecondary,
    // Lines decrease in width: 22 → 16 → 22 for a classic staggered look
    width: 22,
  },
  headerTitle: {
    flex: 1,
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  newChatHeaderBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    backgroundColor: Colors.bgTertiary,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  newChatHeaderText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },

  // ── Chat
  chatContainer: {
    flex: 1,
  },
  messageList: {
    paddingVertical: Spacing.sm,
  },
  messageListEmpty: {
    flex: 1,
  },

  // ── Empty / welcome state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyLogo: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.bgGlass,
    borderWidth: 1,
    borderColor: Colors.bgGlassBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  emptyLogoText: {
    fontSize: FontSize.xl,
    fontWeight: '600',
    color: Colors.accent,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  suggestionsContainer: {
    width: '100%',
    gap: Spacing.sm,
  },
  suggestionChip: {
    backgroundColor: Colors.bgGlass,
    borderWidth: 1,
    borderColor: Colors.bgGlassBorder,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  suggestionText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
});
