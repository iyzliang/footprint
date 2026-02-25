import type { FootprintPlugin, PluginContext } from '../types';

export interface ErrorTrackOptions {
  /** Enable JS runtime error tracking (default: true) */
  jsError?: boolean;
  /** Enable unhandled promise rejection tracking (default: true) */
  promiseError?: boolean;
  /** Enable resource load error tracking (default: true) */
  resourceError?: boolean;
  /** Deduplication window in ms — same error won't be reported twice within this period (default: 2000) */
  dedupeInterval?: number;
}

const DEFAULT_OPTIONS: Required<ErrorTrackOptions> = {
  jsError: true,
  promiseError: true,
  resourceError: true,
  dedupeInterval: 2000,
};

export function errorTrack(userOptions?: ErrorTrackOptions): FootprintPlugin {
  const options = { ...DEFAULT_OPTIONS, ...userOptions };

  let ctx: PluginContext;
  const cleanupFns: (() => void)[] = [];
  const recentErrors = new Map<string, number>();

  function isDuplicate(key: string): boolean {
    const now = Date.now();
    const lastSeen = recentErrors.get(key);
    if (lastSeen && now - lastSeen < options.dedupeInterval) {
      return true;
    }
    recentErrors.set(key, now);

    // Cleanup old entries
    if (recentErrors.size > 100) {
      for (const [k, t] of recentErrors) {
        if (now - t >= options.dedupeInterval) {
          recentErrors.delete(k);
        }
      }
    }

    return false;
  }

  function setupJsErrorTracking(): void {
    if (typeof window === 'undefined') return;

    const handler = (event: ErrorEvent): void => {
      const { message, filename, lineno, colno, error } = event;
      const stack = error?.stack || '';
      const dedupeKey = `js:${message}:${filename}:${lineno}`;

      if (isDuplicate(dedupeKey)) return;

      ctx.track('js_error', {
        message,
        stack,
        filename: filename || '',
        lineno: lineno || 0,
        colno: colno || 0,
        type: 'js_error',
      });
    };

    window.addEventListener('error', handler);
    cleanupFns.push(() => window.removeEventListener('error', handler));
  }

  function setupPromiseErrorTracking(): void {
    if (typeof window === 'undefined') return;

    const handler = (event: PromiseRejectionEvent): void => {
      const reason = event.reason;
      let message: string;
      let stack = '';

      if (reason instanceof Error) {
        message = reason.message;
        stack = reason.stack || '';
      } else if (typeof reason === 'string') {
        message = reason;
      } else {
        try {
          message = JSON.stringify(reason);
        } catch {
          message = String(reason);
        }
      }

      const dedupeKey = `promise:${message}`;
      if (isDuplicate(dedupeKey)) return;

      ctx.track('promise_error', {
        message,
        stack,
        type: 'promise_error',
      });
    };

    window.addEventListener('unhandledrejection', handler);
    cleanupFns.push(() => window.removeEventListener('unhandledrejection', handler));
  }

  function setupResourceErrorTracking(): void {
    if (typeof window === 'undefined') return;

    const handler = (event: Event): void => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      // Only handle resource elements, not script errors
      const tagName = target.tagName?.toLowerCase();
      if (!tagName || !['img', 'script', 'link', 'video', 'audio', 'source'].includes(tagName)) {
        return;
      }

      const src =
        (target as HTMLImageElement).src ||
        (target as HTMLLinkElement).href ||
        (target as HTMLSourceElement).src ||
        '';

      const dedupeKey = `resource:${tagName}:${src}`;
      if (isDuplicate(dedupeKey)) return;

      ctx.track('resource_error', {
        tagName,
        src,
        type: 'resource_error',
      });
    };

    // Use capture phase to catch resource errors that don't bubble
    window.addEventListener('error', handler, true);
    cleanupFns.push(() => window.removeEventListener('error', handler, true));
  }

  return {
    name: 'errorTrack',
    setup(context: PluginContext) {
      ctx = context;

      if (options.jsError) setupJsErrorTracking();
      if (options.promiseError) setupPromiseErrorTracking();
      if (options.resourceError) setupResourceErrorTracking();
    },
    destroy() {
      for (const fn of cleanupFns) {
        fn();
      }
      cleanupFns.length = 0;
      recentErrors.clear();
    },
  };
}
