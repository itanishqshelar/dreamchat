import { initLlama, type LlamaContext } from 'llama.rn';
import ReactNativeBlobUtil from 'react-native-blob-util';

let context: LlamaContext | null = null;

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

const SYSTEM_PROMPT =
  'You are DreamChat, a helpful, harmless, and honest AI assistant. You answer questions accurately and concisely.';

// ─── KV-cache helpers ─────────────────────────────────────────────────────────
// Each chat session gets its own KV-cache file so that switching between
// sessions doesn't invalidate another session's cached computation.
// On a follow-up message within the same session, llama.cpp restores the cache
// and only evaluates the new tokens — making follow-ups nearly instant.

function getKVCachePath(sessionId: string): string {
  return `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/kvcache_${sessionId}.bin`;
}

async function tryLoadSession(sessionId: string): Promise<void> {
  if (!context) return;
  const path = getKVCachePath(sessionId);
  const exists = await ReactNativeBlobUtil.fs.exists(path).catch(() => false);
  if (!exists) return;
  try {
    await context.loadSession(path);
  } catch {
    // Corrupt or stale cache (e.g. after model update) — wipe and start fresh.
    await ReactNativeBlobUtil.fs.unlink(path).catch(() => {});
  }
}

async function trySaveSession(sessionId: string): Promise<void> {
  if (!context) return;
  try {
    await context.saveSession(getKVCachePath(sessionId));
  } catch {
    // Non-critical — the next turn will just re-evaluate from history.
  }
}

/**
 * Deletes the on-disk KV-cache for a specific session.
 * Call this when the user deletes a session or when the history window trims.
 */
export async function clearKVCache(sessionId: string): Promise<void> {
  await ReactNativeBlobUtil.fs
    .unlink(getKVCachePath(sessionId))
    .catch(() => {});
}

// ─── Model init ───────────────────────────────────────────────────────────────

export async function initModel(modelPath: string): Promise<void> {
  if (context) return; // already loaded

  context = await initLlama({
    model: modelPath,
    n_ctx: 4096, // enough for ~20 messages; also the max session replay size
    n_batch: 512,
    n_threads: 6,
    n_gpu_layers: 99, // offload everything to GPU (Metal on iOS / Vulkan on Android)
    use_mlock: true,
    use_mmap: true,
  });
}

export function isModelLoaded(): boolean {
  return context !== null;
}

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildPrompt(messages: ChatMessage[]): string {
  let prompt = `<|im_start|>system\n${SYSTEM_PROMPT}<|im_end|>\n`;

  for (const msg of messages) {
    if (msg.role === 'system') continue;
    prompt += `<|im_start|>${msg.role}\n${msg.content}<|im_end|>\n`;
  }

  prompt += '<|im_start|>assistant\n';
  return prompt;
}

// ─── Generation ───────────────────────────────────────────────────────────────

export type StreamCallback = (token: string) => void;

export async function generateResponse(
  messages: ChatMessage[],
  onToken: StreamCallback,
  sessionId: string,
): Promise<string> {
  if (!context) {
    throw new Error('Model not initialized. Call initModel first.');
  }

  const prompt = buildPrompt(messages);

  // Restore this session's KV-cache so only the new tokens need evaluation.
  await tryLoadSession(sessionId);

  const result = await context.completion(
    {
      prompt,
      n_predict: 1024,
      temperature: 0.7,
      top_p: 0.9,
      top_k: 40,
      enable_thinking: false, // skip chain-of-thought — biggest speed win
      stop: ['<|im_end|>', '<|im_start|>'],
    },
    (data: { token: string }) => {
      onToken(data.token);
    },
  );

  // Only persist the cache when generation completed naturally.
  // An interrupted (stopped) completion leaves the context in a partial state;
  // it is safer to let the next call re-evaluate from history.
  if (!result.interrupted) {
    await trySaveSession(sessionId);
  }

  // result.content already has reasoning tokens stripped by the native layer;
  // fall back to result.text for older llama.rn builds.
  return result.content?.trim() ? result.content : result.text;
}

// ─── Stop / release ───────────────────────────────────────────────────────────

export async function stopGeneration(): Promise<void> {
  if (context) {
    await context.stopCompletion();
  }
}

export async function releaseModel(): Promise<void> {
  if (context) {
    await context.release();
    context = null;
  }
}
