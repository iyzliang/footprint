const STORAGE_PREFIX = '__fp_';

function isLocalStorageAvailable(): boolean {
  try {
    const testKey = `${STORAGE_PREFIX}test`;
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

const memoryStore = new Map<string, string>();
let storageAvailable: boolean | null = null;

function checkStorage(): boolean {
  if (storageAvailable === null) {
    storageAvailable = typeof window !== 'undefined' && isLocalStorageAvailable();
  }
  return storageAvailable;
}

export const storage = {
  get(key: string): string | null {
    const prefixedKey = `${STORAGE_PREFIX}${key}`;
    if (checkStorage()) {
      return localStorage.getItem(prefixedKey);
    }
    return memoryStore.get(prefixedKey) ?? null;
  },

  set(key: string, value: string): void {
    const prefixedKey = `${STORAGE_PREFIX}${key}`;
    if (checkStorage()) {
      try {
        localStorage.setItem(prefixedKey, value);
      } catch {
        memoryStore.set(prefixedKey, value);
      }
    } else {
      memoryStore.set(prefixedKey, value);
    }
  },

  remove(key: string): void {
    const prefixedKey = `${STORAGE_PREFIX}${key}`;
    if (checkStorage()) {
      localStorage.removeItem(prefixedKey);
    }
    memoryStore.delete(prefixedKey);
  },

  /** Reset cached availability check (useful for testing) */
  _resetCache(): void {
    storageAvailable = null;
    memoryStore.clear();
  },
};
