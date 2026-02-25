import { useContext } from 'react';
import { FootprintContext } from './context';
import type { Footprint } from '@footprint/core';

export function useFootprint(): Footprint {
  const instance = useContext(FootprintContext);
  if (!instance) {
    throw new Error('useFootprint must be used within a FootprintProvider');
  }
  return instance;
}
