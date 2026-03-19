import { useState, useCallback, useRef, useEffect } from 'react';
import {
  generateResponse,
  stopGeneration,
  clearKVCache,
  type ChatMessage,
  type StreamCallback,
} from '../services/LlamaService';
import {
  loadAllSessions,
  saveSession,
  deleteSession as deleteSessionFile,
  deriveTitle,
  derivePreview,
  generateSessionId,
} from '../services/SessionService';
import type { UIMessage, StoredSession } from '../types';

export type { UIMessage };

// ─── Constants ────────────────────────────────────────────────────────────────

// Maximum number of previous messages kept verbatim in the prompt.
// With n_ctx=4096 this fits ~10 full exchanges plus system prompt + new reply.
// When the window trims, the KV-cache for that session is wiped so llama.cpp
// doesn't try to replay a prompt that no longer matches the saved state.
const MAX_HISTORY = 20;

// ─── Think-tag helpers ───────────────────────────────────────────────────────

function stripThinkTags(raw: string): string {
  let cleaned = raw.replace(/<think>[\s\S]*?<\/think>/g, '');
  const openIdx = cleaned.indexOf('<think>');
  if (openIdx !== -1) {
    cleaned = cleaned.substring(0, openIdx);
  }
  return cleaned.trim();
}

function isInsideThinkBlock(raw: string): boolean {
  const lastOpen = raw.lastIndexOf('<think>');
  const lastClose = raw.lastIndexOf('</think>');
  return lastOpen !== -1 && lastOpen > lastClose;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useChat() {
  const [sessions, setSessions] = useState<StoredSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>(() =>
    generateSessionId(),
  );
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const messageIdCounter = useRef(0);
  const rawContentRef = useRef('');
  // Tracks the createdAt timestamp of the active session so updates preserve it.
  const sessionCreatedAtRef = useRef<number>(Date.now());

  // ── Helpers ──────────────────────────────────────────────────────────────

  const generateId = useCallback(() => {
    messageIdCounter.current += 1;
    return `msg-${Date.now()}-${messageIdCounter.current}`;
  }, []);

  // ── Load sessions from disk on mount ─────────────────────────────────────

  useEffect(() => {
    loadAllSessions().then(loaded => {
      setSessions(loaded);
      if (loaded.length > 0) {
        const latest = loaded[0];
        setCurrentSessionId(latest.id);
        setMessages(latest.messages);
        sessionCreatedAtRef.current = latest.createdAt;
      }
    });
  }, []);

  // ── Persist the current session to disk ──────────────────────────────────

  const persistSession = useCallback(
    async (sessionId: string, msgs: UIMessage[]) => {
      if (msgs.length === 0) return;

      const session: StoredSession = {
        id: sessionId,
        title: deriveTitle(msgs),
        preview: derivePreview(msgs),
        createdAt: sessionCreatedAtRef.current,
        updatedAt: Date.now(),
        // Strip transient streaming flags before writing to disk
        messages: msgs.map(m => ({
          id: m.id,
          role: m.role,
          content: m.content,
        })),
      };

      await saveSession(session);

      setSessions(prev => {
        const without = prev.filter(s => s.id !== sessionId);
        return [session, ...without].sort((a, b) => b.updatedAt - a.updatedAt);
      });
    },
    [],
  );

  // ── Send a message ────────────────────────────────────────────────────────

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isGenerating) return;

      const sessionId = currentSessionId;

      const userMsg: UIMessage = {
        id: generateId(),
        role: 'user',
        content: text.trim(),
      };

      const assistantMsg: UIMessage = {
        id: generateId(),
        role: 'assistant',
        content: '',
        isStreaming: true,
        isThinking: true,
      };

      rawContentRef.current = '';

      setMessages(prev => [...prev, userMsg, assistantMsg]);
      setIsGenerating(true);

      // If adding this exchange would push old messages out of the window,
      // the prompt prefix will change — invalidate the KV-cache for this
      // session so llama.cpp doesn't try to match a stale state.
      const willTrim = messages.length >= MAX_HISTORY;
      if (willTrim) {
        clearKVCache(sessionId).catch(() => {});
      }

      // Build the history slice sent to the model
      const recentMessages = messages.slice(-MAX_HISTORY);
      const history: ChatMessage[] = [
        ...recentMessages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        { role: 'user' as const, content: text.trim() },
      ];

      try {
        const onToken: StreamCallback = (token: string) => {
          rawContentRef.current += token;
          const raw = rawContentRef.current;
          const thinking = isInsideThinkBlock(raw);
          const visibleContent = stripThinkTags(raw);

          setMessages(prev =>
            prev.map(m =>
              m.id === assistantMsg.id
                ? {
                    ...m,
                    content: visibleContent,
                    isThinking: thinking && visibleContent.length === 0,
                  }
                : m,
            ),
          );
        };

        await generateResponse(history, onToken, sessionId);

        const finalContent = stripThinkTags(rawContentRef.current);

        // Build the final message list (used for both state + persistence)
        const finalMessages: UIMessage[] = [
          ...messages,
          userMsg,
          {
            ...assistantMsg,
            content: finalContent,
            isStreaming: false,
            isThinking: false,
          },
        ];

        setMessages(prev =>
          prev.map(m =>
            m.id === assistantMsg.id
              ? {
                  ...m,
                  content: finalContent,
                  isStreaming: false,
                  isThinking: false,
                }
              : m,
          ),
        );

        // Persist to disk (non-blocking — don't await in the critical path)
        persistSession(sessionId, finalMessages).catch(() => {});
      } catch {
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantMsg.id
              ? {
                  ...m,
                  content: 'Sorry, something went wrong. Please try again.',
                  isStreaming: false,
                  isThinking: false,
                }
              : m,
          ),
        );
      } finally {
        setIsGenerating(false);
      }
    },
    [messages, isGenerating, generateId, currentSessionId, persistSession],
  );

  // ── Stop generation ───────────────────────────────────────────────────────

  const stopGenerating = useCallback(async () => {
    try {
      await stopGeneration();
    } catch {
      // ignore
    }
    setMessages(prev =>
      prev.map(m =>
        m.isStreaming ? { ...m, isStreaming: false, isThinking: false } : m,
      ),
    );
    setIsGenerating(false);
  }, []);

  // ── Switch to an existing session ─────────────────────────────────────────

  const selectSession = useCallback(
    (id: string) => {
      if (isGenerating) return;
      const session = sessions.find(s => s.id === id);
      if (!session) return;
      setCurrentSessionId(id);
      setMessages(session.messages);
      sessionCreatedAtRef.current = session.createdAt;
    },
    [sessions, isGenerating],
  );

  // ── Start a brand-new chat ────────────────────────────────────────────────

  const newChat = useCallback(() => {
    if (isGenerating) return;
    const id = generateSessionId();
    setCurrentSessionId(id);
    setMessages([]);
    sessionCreatedAtRef.current = Date.now();
  }, [isGenerating]);

  // ── Delete a session ──────────────────────────────────────────────────────

  const deleteSession = useCallback(
    async (id: string) => {
      // Remove metadata from disk
      await deleteSessionFile(id).catch(() => {});
      // Remove its KV-cache file
      await clearKVCache(id).catch(() => {});

      setSessions(prev => prev.filter(s => s.id !== id));

      // If the user deleted the active session, open a fresh one
      if (id === currentSessionId) {
        const newId = generateSessionId();
        setCurrentSessionId(newId);
        setMessages([]);
        sessionCreatedAtRef.current = Date.now();
      }
    },
    [currentSessionId],
  );

  // ── Clear current chat (start fresh without deleting history) ─────────────

  const clearChat = useCallback(() => {
    if (isGenerating) return;
    newChat();
  }, [isGenerating, newChat]);

  return {
    sessions,
    currentSessionId,
    messages,
    isGenerating,
    sendMessage,
    stopGenerating,
    selectSession,
    newChat,
    deleteSession,
    clearChat,
  };
}
