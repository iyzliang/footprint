import { useFootprint } from './useFootprint';

export function useTrack() {
  const fp = useFootprint();

  return (eventName: string, properties?: Record<string, unknown>) => {
    fp.track(eventName, properties);
  };
}
