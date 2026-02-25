import { inject } from 'vue';
import type { Footprint } from '@footprint/core';
import { FOOTPRINT_INJECTION_KEY } from './key';

export function useFootprint(): Footprint {
  const instance = inject(FOOTPRINT_INJECTION_KEY);
  if (!instance) {
    throw new Error('useFootprint must be used within a component that has FootprintPlugin installed');
  }
  return instance;
}
