import { describe, it, expect } from 'vitest';
import { getPageInfo, getDeviceInfo } from '../src/utils/collect-info';

describe('getPageInfo', () => {
  it('should return current page info', () => {
    const info = getPageInfo();
    expect(info).toHaveProperty('url');
    expect(info).toHaveProperty('title');
    expect(info).toHaveProperty('referrer');
    expect(typeof info.url).toBe('string');
    expect(typeof info.title).toBe('string');
    expect(typeof info.referrer).toBe('string');
  });

  it('should return the current URL', () => {
    const info = getPageInfo();
    expect(info.url).toContain('http');
  });
});

describe('getDeviceInfo', () => {
  it('should return device info', () => {
    const info = getDeviceInfo();
    expect(info).toHaveProperty('ua');
    expect(info).toHaveProperty('screen');
    expect(info).toHaveProperty('language');
    expect(typeof info.ua).toBe('string');
    expect(typeof info.screen).toBe('string');
    expect(typeof info.language).toBe('string');
  });

  it('should return screen resolution in WxH format', () => {
    const info = getDeviceInfo();
    expect(info.screen).toMatch(/^\d+x\d+$/);
  });

  it('should return a non-empty user agent', () => {
    const info = getDeviceInfo();
    expect(info.ua.length).toBeGreaterThan(0);
  });

  it('should return a non-empty language', () => {
    const info = getDeviceInfo();
    expect(info.language.length).toBeGreaterThan(0);
  });
});
