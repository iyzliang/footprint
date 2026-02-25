import type { FootprintPlugin } from './plugin';

export interface FootprintConfig {
  /** Unique project identifier, obtained from the dashboard */
  appId: string;

  /** Server endpoint URL for event collection */
  serverUrl: string;

  /** Enable debug mode to print logs to console (default: false) */
  debug?: boolean;

  /** Plugins to register on initialization */
  plugins?: FootprintPlugin[];

  /** Max number of events to buffer before flushing (default: 10) */
  flushThreshold?: number;

  /** Interval in ms between automatic flushes (default: 5000) */
  flushInterval?: number;

  /** Max number of retry attempts for failed requests (default: 3) */
  maxRetries?: number;

  /** Session timeout in ms — a new session starts after this idle period (default: 1800000 = 30min) */
  sessionTimeout?: number;
}
