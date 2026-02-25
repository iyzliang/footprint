import type { App, Plugin } from 'vue';
import type { Footprint } from '@footprint/core';
import { FOOTPRINT_INJECTION_KEY } from './key';
import { vTrack } from './directive';

interface FootprintPluginOptions {
  instance: Footprint;
}

export const FootprintPlugin: Plugin = {
  install(app: App, options: FootprintPluginOptions) {
    if (!options?.instance) {
      throw new Error('FootprintPlugin: instance is required');
    }

    app.provide(FOOTPRINT_INJECTION_KEY, options.instance);
    app.directive('track', vTrack(options.instance));
  },
};
