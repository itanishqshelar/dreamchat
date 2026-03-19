// Shared types used across hooks, services, and components.
// Defined here to avoid circular import chains.

export type UIMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  isThinking?: boolean;
};

export type StoredSession = {
  id: string;
  /** Truncated first user message — shown as the session title in the sidebar. */
  title: string;
  /** Truncated last assistant reply — shown as the preview line in the sidebar. */
  preview: string;
  createdAt: number;
  updatedAt: number;
  messages: UIMessage[];
};
