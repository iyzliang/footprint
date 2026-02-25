import type { Directive, DirectiveBinding } from 'vue';
import type { Footprint } from '@footprint/core';

interface TrackBinding {
  event: string;
  props?: Record<string, unknown>;
}

export function vTrack(instance: Footprint): Directive<HTMLElement, TrackBinding> {
  const handlerMap = new WeakMap<HTMLElement, (e: Event) => void>();

  return {
    mounted(el: HTMLElement, binding: DirectiveBinding<TrackBinding>) {
      const eventType = binding.arg ?? 'click';
      const { event, props } = binding.value;

      const handler = () => {
        instance.track(event, props);
      };

      handlerMap.set(el, handler);
      el.addEventListener(eventType, handler);
    },
    updated(el: HTMLElement, binding: DirectiveBinding<TrackBinding>) {
      const eventType = binding.arg ?? 'click';
      const oldHandler = handlerMap.get(el);
      if (oldHandler) {
        el.removeEventListener(eventType, oldHandler);
      }

      const { event, props } = binding.value;
      const handler = () => {
        instance.track(event, props);
      };

      handlerMap.set(el, handler);
      el.addEventListener(eventType, handler);
    },
    unmounted(el: HTMLElement, binding: DirectiveBinding<TrackBinding>) {
      const eventType = binding.arg ?? 'click';
      const handler = handlerMap.get(el);
      if (handler) {
        el.removeEventListener(eventType, handler);
        handlerMap.delete(el);
      }
    },
  };
}
