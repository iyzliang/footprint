export const VERSION = '0.0.1';

export { Footprint } from './footprint';

export { autoTrack } from './plugins';
export type { AutoTrackOptions } from './plugins';

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
