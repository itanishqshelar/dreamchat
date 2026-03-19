import ReactNativeBlobUtil from 'react-native-blob-util';
import type { UIMessage, StoredSession } from '../types';

// ─── Paths ────────────────────────────────────────────────────────────────────

function getSessionsFilePath(): string {
  return `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/dreamchat_sessions.json`;
}

// ─── Persistence ──────────────────────────────────────────────────────────────

export async function loadAllSessions(): Promise<StoredSession[]> {
  try {
    const path = getSessionsFilePath();
    const exists = await ReactNativeBlobUtil.fs.exists(path);
    if (!exists) return [];
    const raw = await ReactNativeBlobUtil.fs.readFile(path, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeSessions(sessions: StoredSession[]): Promise<void> {
  const path = getSessionsFilePath();
  await ReactNativeBlobUtil.fs.writeFile(
    path,
    JSON.stringify(sessions),
    'utf8',
  );
}

/**
 * Upserts a session into the persisted list.
 * If the session already exists its createdAt is preserved; updatedAt is always
 * taken from the incoming object so the caller controls it.
 */
export async function saveSession(session: StoredSession): Promise<void> {
  const all = await loadAllSessions();
  const idx = all.findIndex(s => s.id === session.id);

  if (idx !== -1) {
    // Keep original creation timestamp
    all[idx] = { ...session, createdAt: all[idx].createdAt };
  } else {
    all.unshift(session);
  }

  // Always keep newest-updated first
  all.sort((a, b) => b.updatedAt - a.updatedAt);
  await writeSessions(all);
}

/** Removes a session from the persisted list by id. */
export async function deleteSession(id: string): Promise<void> {
  const all = await loadAllSessions();
  await writeSessions(all.filter(s => s.id !== id));
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Derives a human-readable title from the first user message in a session.
 * Falls back to "New Chat" when no user message is present yet.
 */
export function deriveTitle(messages: UIMessage[]): string {
  const first = messages.find(m => m.role === 'user');
  if (!first) return 'New Chat';
  const t = first.content.trim();
  return t.length > 42 ? t.slice(0, 42).trimEnd() + '…' : t;
}

/**
 * Derives a short preview from the last completed assistant message.
 * Strips common markdown symbols so the sidebar looks clean.
 */
export function derivePreview(messages: UIMessage[]): string {
  const last = [...messages]
    .reverse()
    .find(m => m.role === 'assistant' && m.content && !m.isStreaming);
  if (!last) return '';
  // Strip markdown symbols that would look noisy in a one-liner preview
  const t = last.content.replace(/[#*`_~>]/g, '').replace(/\s+/g, ' ').trim();
  return t.length > 65 ? t.slice(0, 65).trimEnd() + '…' : t;
}

/**
 * Generates a short, time-ordered unique session id.
 * Format: <base36 timestamp>-<random suffix>  e.g. "lrxk8yg0-a3k9z"
 */
export function generateSessionId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Formats a timestamp into a concise relative time string for the sidebar.
 */
export function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}
