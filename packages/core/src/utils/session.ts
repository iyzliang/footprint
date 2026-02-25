import { storage } from './storage';
import { generateUUID } from './uuid';

const SESSION_ID_KEY = 'session_id';
const SESSION_LAST_ACTIVITY_KEY = 'session_last_activity';

const DEFAULT_SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export class SessionManager {
  private sessionId: string;
  private lastActivity: number;
  private timeout: number;
  private visibilityHandler: (() => void) | null = null;

  constructor(timeout: number = DEFAULT_SESSION_TIMEOUT) {
    this.timeout = timeout;
    this.lastActivity = Date.now();

    const existingId = storage.get(SESSION_ID_KEY);
    const existingActivity = storage.get(SESSION_LAST_ACTIVITY_KEY);

    if (existingId && existingActivity) {
      const lastActivityTime = parseInt(existingActivity, 10);
      if (Date.now() - lastActivityTime < this.timeout) {
        this.sessionId = existingId;
        this.lastActivity = lastActivityTime;
      } else {
        this.sessionId = this.createNewSession();
      }
    } else {
      this.sessionId = this.createNewSession();
    }

    this.setupVisibilityListener();
  }

  getSessionId(): string {
    this.touch();
    return this.sessionId;
  }

  touch(): void {
    const now = Date.now();
    if (now - this.lastActivity >= this.timeout) {
      this.sessionId = this.createNewSession();
    }
    this.lastActivity = now;
    storage.set(SESSION_LAST_ACTIVITY_KEY, String(this.lastActivity));
  }

  destroy(): void {
    if (this.visibilityHandler && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }
  }

  private createNewSession(): string {
    const id = generateUUID();
    storage.set(SESSION_ID_KEY, id);
    storage.set(SESSION_LAST_ACTIVITY_KEY, String(Date.now()));
    return id;
  }

  private setupVisibilityListener(): void {
    if (typeof document === 'undefined') return;

    this.visibilityHandler = () => {
      if (document.visibilityState === 'visible') {
        const storedActivity = storage.get(SESSION_LAST_ACTIVITY_KEY);
        const lastActivityTime = storedActivity ? parseInt(storedActivity, 10) : this.lastActivity;

        if (Date.now() - lastActivityTime >= this.timeout) {
          this.sessionId = this.createNewSession();
        }
        this.lastActivity = Date.now();
        storage.set(SESSION_LAST_ACTIVITY_KEY, String(this.lastActivity));
      }
    };

    document.addEventListener('visibilitychange', this.visibilityHandler);
  }
}
