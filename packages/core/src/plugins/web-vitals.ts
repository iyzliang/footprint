import type { FootprintPlugin, PluginContext } from '../types';

export interface WebVitalsOptions {
  /** Report all changes, not just the final value (default: false) */
  reportAllChanges?: boolean;
}

export function webVitals(options?: WebVitalsOptions): FootprintPlugin {
  const reportAllChanges = options?.reportAllChanges ?? false;

  return {
    name: 'webVitals',
    setup(ctx: PluginContext) {
      loadAndReport(ctx, reportAllChanges);
    },
  };
}

async function loadAndReport(ctx: PluginContext, reportAllChanges: boolean): Promise<void> {
  try {
    const vitals = await import('web-vitals');

    const report = (name: string) => {
      return (metric: { value: number; rating: string; id: string }) => {
        ctx.track('web_vitals', {
          metric: name,
          value: metric.value,
          rating: metric.rating,
          metricId: metric.id,
        });
      };
    };

    const opts = { reportAllChanges };

    if (vitals.onCLS) vitals.onCLS(report('CLS'), opts);
    if (vitals.onINP) vitals.onINP(report('INP'), opts);
    if (vitals.onLCP) vitals.onLCP(report('LCP'), opts);
    if (vitals.onFCP) vitals.onFCP(report('FCP'), opts);
    if (vitals.onTTFB) vitals.onTTFB(report('TTFB'), opts);
  } catch {
    // web-vitals may not be available in all environments (e.g. SSR, Node)
  }
}
