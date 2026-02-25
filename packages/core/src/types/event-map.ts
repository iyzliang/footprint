/**
 * Extensible event map interface for type-safe tracking.
 *
 * Users can augment this interface via module declaration merging:
 * ```ts
 * declare module '@footprint/core' {
 *   interface EventMap {
 *     buy_click: { sku: string; price: number };
 *     page_view: { path: string };
 *   }
 * }
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface EventMap {}

/**
 * Resolves the event name type.
 * If EventMap has entries, restricts to those keys; otherwise allows any string.
 */
export type EventName = keyof EventMap extends never ? string : keyof EventMap & string;

/**
 * Resolves the properties type for a given event name.
 * If EventMap has an entry for the event, uses that type; otherwise allows any record.
 */
export type EventProperties<E extends EventName> = keyof EventMap extends never
  ? Record<string, unknown>
  : E extends keyof EventMap
    ? EventMap[E]
    : Record<string, unknown>;
