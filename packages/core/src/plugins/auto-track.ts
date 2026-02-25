import type { FootprintPlugin, PluginContext } from '../types';

export interface AutoTrackOptions {
  /** Enable automatic page view tracking (default: true) */
  pageView?: boolean;
  /** Enable automatic click tracking (default: true) */
  click?: boolean;
  /** Enable page leave / dwell time tracking (default: true) */
  pageLeave?: boolean;
  /** CSS selector filter for click tracking — only track clicks matching this selector */
  clickSelector?: string;
}

const DEFAULT_OPTIONS: Required<AutoTrackOptions> = {
  pageView: true,
  click: true,
  pageLeave: true,
  clickSelector: '',
};

export function autoTrack(userOptions?: AutoTrackOptions): FootprintPlugin {
  const options = { ...DEFAULT_OPTIONS, ...userOptions };

  let ctx: PluginContext;
  let pageEnterTime = Date.now();
  let currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const cleanupFns: (() => void)[] = [];

  function trackPageView(): void {
    currentUrl = window.location.href;
    pageEnterTime = Date.now();
    ctx.track('page_view', {
      url: window.location.href,
      path: window.location.pathname,
      hash: window.location.hash,
      search: window.location.search,
    });
  }

  function trackPageLeave(): void {
    const duration = Date.now() - pageEnterTime;
    ctx.track('page_leave', {
      url: currentUrl,
      duration,
    });
  }

  function setupPageViewTracking(): void {
    if (typeof window === 'undefined') return;

    trackPageView();

    const onPopState = (): void => {
      trackPageView();
    };
    window.addEventListener('popstate', onPopState);
    cleanupFns.push(() => window.removeEventListener('popstate', onPopState));

    const originalPushState = history.pushState.bind(history);
    const originalReplaceState = history.replaceState.bind(history);

    history.pushState = function (...args: Parameters<typeof history.pushState>) {
      originalPushState(...args);
      trackPageView();
    };

    history.replaceState = function (...args: Parameters<typeof history.replaceState>) {
      originalReplaceState(...args);
      trackPageView();
    };

    cleanupFns.push(() => {
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    });
  }

  function setupClickTracking(): void {
    if (typeof document === 'undefined') return;

    const onClick = (event: MouseEvent): void => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      if (options.clickSelector && !target.closest(options.clickSelector)) {
        return;
      }

      const element = target.closest('[data-track]') || target;
      const tagName = element.tagName?.toLowerCase() || '';
      const text = (element.textContent || '').trim().slice(0, 200);
      const dataTrack = element.getAttribute?.('data-track') || '';
      const id = element.id || '';
      const className = element.className || '';

      ctx.track('element_click', {
        tagName,
        text,
        dataTrack,
        id,
        className: typeof className === 'string' ? className : '',
        xpath: getSimpleXPath(element),
      });
    };

    document.addEventListener('click', onClick, true);
    cleanupFns.push(() => document.removeEventListener('click', onClick, true));
  }

  function setupPageLeaveTracking(): void {
    if (typeof window === 'undefined') return;

    const onBeforeUnload = (): void => {
      trackPageLeave();
    };

    const onVisibilityChange = (): void => {
      if (document.visibilityState === 'hidden') {
        trackPageLeave();
      } else if (document.visibilityState === 'visible') {
        pageEnterTime = Date.now();
      }
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('visibilitychange', onVisibilityChange);

    cleanupFns.push(() => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    });
  }

  return {
    name: 'autoTrack',
    setup(context: PluginContext) {
      ctx = context;

      if (options.pageView) setupPageViewTracking();
      if (options.click) setupClickTracking();
      if (options.pageLeave) setupPageLeaveTracking();
    },
    destroy() {
      for (const fn of cleanupFns) {
        fn();
      }
      cleanupFns.length = 0;
    },
  };
}

function getSimpleXPath(element: Element): string {
  const parts: string[] = [];
  let current: Element | null = element;

  while (current && current !== document.body) {
    const tag = current.tagName.toLowerCase();
    const parent = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter((c) => c.tagName === current!.tagName);
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        parts.unshift(`${tag}[${index}]`);
      } else {
        parts.unshift(tag);
      }
    } else {
      parts.unshift(tag);
    }
    current = parent;
  }

  return '/' + parts.join('/');
}
