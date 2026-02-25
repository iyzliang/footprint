import { storage } from './storage';
import { generateUUID } from './uuid';

const ANONYMOUS_ID_KEY = 'anonymous_id';

let cachedId: string | null = null;

export function getAnonymousId(): string {
  if (cachedId) {
    return cachedId;
  }

  const stored = storage.get(ANONYMOUS_ID_KEY);
  if (stored) {
    cachedId = stored;
    return cachedId;
  }

  cachedId = generateUUID();
  storage.set(ANONYMOUS_ID_KEY, cachedId);
  return cachedId;
}

export function resetAnonymousId(): void {
  cachedId = null;
  storage.remove(ANONYMOUS_ID_KEY);
}
