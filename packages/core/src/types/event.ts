import type { DeviceInfo, PageInfo } from './common';

export interface TrackEvent {
  eventName: string;
  properties: Record<string, unknown>;
  timestamp: number;
  sessionId: string;
  userId?: string;
  anonymousId: string;
  appId: string;
  page: PageInfo;
  device: DeviceInfo;
}

export interface TransportData {
  appId: string;
  events: TrackEvent[];
}
