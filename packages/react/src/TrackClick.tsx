import { cloneElement, type ReactElement, type MouseEvent } from 'react';
import { useTrack } from './useTrack';

interface TrackClickProps {
  event: string;
  props?: Record<string, unknown>;
  children: ReactElement<{ onClick?: (e: MouseEvent) => void }>;
}

export function TrackClick({ event, props, children }: TrackClickProps) {
  const track = useTrack();

  const handleClick = (e: MouseEvent) => {
    track(event, props);
    children.props.onClick?.(e);
  };

  return cloneElement(children, { onClick: handleClick });
}
