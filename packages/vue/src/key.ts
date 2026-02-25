import type { InjectionKey } from 'vue';
import type { Footprint } from '@footprint/core';

export const FOOTPRINT_INJECTION_KEY: InjectionKey<Footprint> = Symbol('footprint');
