import { useCallback } from 'react';
import { useFootprint } from './useFootprint';

export function useTrack() {
  const fp = useFootprint();

  return useCallback(
    (eventName: string, properties?: Record<string, unknown>) => {
      fp.track(eventName, properties);
    },
    [fp],
  );
}
