export interface ChatHistoryPayload<T> {
  messages: T[];
  selectedClusterId?: string;
  selectedLocalityId?: string;
  updatedAt: string;
}

const STORAGE_PREFIX = 'hyd.copilot.chat.';

export function getChatStorageKey(userId?: string | number): string {
  return `${STORAGE_PREFIX}${userId || 'planner_current'}`;
}

export function loadCopilotChat<T>(userId?: string | number): ChatHistoryPayload<T> | null {
  try {
    const key = getChatStorageKey(userId);
    // Check sessionStorage first for current tab/window, then localStorage for persistence across reloads
    const raw = sessionStorage.getItem(key) || localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.messages) && parsed.messages.length > 0) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveCopilotChat<T>(
  userId: string | number | undefined,
  data: { messages: T[]; selectedClusterId?: string; selectedLocalityId?: string },
): void {
  try {
    const key = getChatStorageKey(userId);
    const payload: ChatHistoryPayload<T> = {
      messages: data.messages,
      selectedClusterId: data.selectedClusterId,
      selectedLocalityId: data.selectedLocalityId,
      updatedAt: new Date().toISOString(),
    };
    const serialized = JSON.stringify(payload);
    // Store in both sessionStorage and localStorage for the active logged-in user
    sessionStorage.setItem(key, serialized);
    localStorage.setItem(key, serialized);
  } catch (err) {
    console.warn('Could not save copilot chat session:', err);
  }
}

export function clearCopilotChat(userId?: string | number): void {
  try {
    const key = getChatStorageKey(userId);
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function clearAllCopilotChatSessions(): void {
  try {
    // Clear all keys starting with hyd.copilot.chat.
    const clearStorage = (storage: Storage) => {
      const keysToRemove: string[] = [];
      for (let i = 0; i < storage.length; i++) {
        const k = storage.key(i);
        if (k && k.startsWith(STORAGE_PREFIX)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => storage.removeItem(k));
    };

    clearStorage(sessionStorage);
    clearStorage(localStorage);
  } catch {
    // ignore
  }
}
