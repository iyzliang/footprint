import type { PageInfo, DeviceInfo } from '../types';

export function getPageInfo(): PageInfo {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { url: '', title: '', referrer: '' };
  }

  return {
    url: window.location.href,
    title: document.title,
    referrer: document.referrer,
  };
}

export function getDeviceInfo(): DeviceInfo {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { ua: '', screen: '', language: '' };
  }

  return {
    ua: navigator.userAgent,
    screen: `${window.screen.width}x${window.screen.height}`,
    language: navigator.language,
  };
}
