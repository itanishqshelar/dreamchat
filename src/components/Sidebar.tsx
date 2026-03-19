import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { formatRelativeTime } from '../services/SessionService';
import { Colors, Spacing, FontSize, BorderRadius } from '../theme/colors';
import type { StoredSession } from '../types';

const SIDEBAR_WIDTH = 300;

// ─── Session item ─────────────────────────────────────────────────────────────

type SessionItemProps = {
  session: StoredSession;
  isActive: boolean;
  onPress: () => void;
  onDelete: () => void;
};

function SessionItem({ session, isActive, onPress, onDelete }: SessionItemProps) {
  return (
    <TouchableOpacity
      style={[styles.sessionItem, isActive && styles.sessionItemActive]}
      onPress={onPress}
      activeOpacity={0.65}>
      {/* Active indicator bar */}
      {isActive && <View style={styles.activeBar} />}

      <View style={styles.sessionBody}>
        <View style={styles.sessionTopRow}>
          <Text style={styles.sessionTitle} numberOfLines={1}>
            {session.title}
          </Text>
          <Text style={styles.sessionTime}>
            {formatRelativeTime(session.updatedAt)}
          </Text>
        </View>

        {!!session.preview && (
          <Text style={styles.sessionPreview} numberOfLines={2}>
            {session.preview}
          </Text>
        )}
      </View>

      {/* Delete button */}
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={onDelete}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 4 }}
        activeOpacity={0.6}>
        <Text style={styles.deleteBtnText}>✕</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

type SidebarProps = {
  visible: boolean;
  sessions: StoredSession[];
  currentSessionId: string;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onClose: () => void;
};

export default function Sidebar({
  visible,
  sessions,
  currentSessionId,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  onClose,
}: SidebarProps) {
  // We keep the component mounted during the exit animation, then unmount.
  const [localVisible, setLocalVisible] = useState(false);

  const translateX = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setLocalVisible(true);
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          damping: 22,
          stiffness: 260,
          mass: 0.85,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0.55,
          duration: 230,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -SIDEBAR_WIDTH,
          duration: 210,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(() => setLocalVisible(false));
    }
  }, [visible, translateX, backdropOpacity]);

  if (!localVisible) return null;

  return (
    // absoluteFill so the sidebar layers over the chat content
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Dimmed backdrop — tap to close */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          style={[styles.backdrop, { opacity: backdropOpacity }]}
          pointerEvents="auto"
        />
      </TouchableWithoutFeedback>

      {/* Sliding drawer */}
      <Animated.View
        style={[styles.drawer, { transform: [{ translateX }] }]}
        pointerEvents="auto">
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Chats</Text>

          <TouchableOpacity
            style={styles.newChatBtn}
            onPress={onNewChat}
            activeOpacity={0.75}>
            <View style={styles.newChatIconWrap}>
              {/* Simple pencil-square icon made of Views */}
              <View style={styles.pencilSquare} />
              <View style={styles.pencilTip} />
            </View>
            <Text style={styles.newChatText}>New Chat</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* ── Session list ── */}
        <FlatList
          data={sessions}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <SessionItem
              session={item}
              isActive={item.id === currentSessionId}
              onPress={() => onSelectSession(item.id)}
              onDelete={() => onDeleteSession(item.id)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyTitle}>No previous chats</Text>
              <Text style={styles.emptyHint}>
                Start a conversation and it will appear here.
              </Text>
            </View>
          }
          contentContainerStyle={
            sessions.length === 0 ? styles.emptyListContent : styles.listContent
          }
          showsVerticalScrollIndicator={false}
        />
      </Animated.View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: Colors.bgSecondary,
    borderRightWidth: 1,
    borderRightColor: Colors.divider,
    shadowColor: '#000',
    shadowOffset: { width: 6, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 16,
  },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.xl + Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  newChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.bgTertiary,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.divider,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 2,
  },
  newChatIconWrap: {
    width: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pencilSquare: {
    position: 'absolute',
    width: 11,
    height: 11,
    borderWidth: 1.5,
    borderColor: Colors.accent,
    borderRadius: 2,
    top: 0,
    left: 0,
  },
  pencilTip: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 5,
    height: 5,
    backgroundColor: Colors.accent,
    borderRadius: 1,
    transform: [{ rotate: '45deg' }],
  },
  newChatText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.accent,
  },

  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.xs,
  },

  // ── List
  listContent: {
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xl,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },

  // ── Session item
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.sm,
    marginVertical: 2,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm + 2,
    paddingLeft: Spacing.sm,
    paddingRight: Spacing.xs,
    overflow: 'hidden',
  },
  sessionItemActive: {
    backgroundColor: Colors.bgTertiary,
  },
  activeBar: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    width: 3,
    borderRadius: 2,
    backgroundColor: Colors.accent,
  },
  sessionBody: {
    flex: 1,
    paddingLeft: Spacing.xs,
  },
  sessionTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  sessionTitle: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginRight: Spacing.xs,
  },
  sessionTime: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    flexShrink: 0,
  },
  sessionPreview: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  deleteBtn: {
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  deleteBtnText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '600',
  },

  // ── Empty state
  emptyWrap: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  emptyHint: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
