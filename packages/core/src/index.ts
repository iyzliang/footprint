export const VERSION = '0.1.0';

export { Footprint } from './footprint';

export { autoTrack, webVitals, errorTrack } from './plugins';
export type { AutoTrackOptions, WebVitalsOptions, ErrorTrackOptions } from './plugins';

export type {
  PageInfo,
  DeviceInfo,
  FootprintConfig,
  TrackEvent,
  TransportData,
  EventMap,
  EventName,
  EventProperties,
  FootprintPlugin,
  PluginContext,
  FootprintConfigReadonly,
} from './types';
