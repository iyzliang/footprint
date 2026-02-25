import type { ReactNode } from 'react';
import type { Footprint } from '@footprint/core';
import { FootprintContext } from './context';

interface FootprintProviderProps {
  instance: Footprint;
  children: ReactNode;
}

export function FootprintProvider({ instance, children }: FootprintProviderProps) {
  return (
    <FootprintContext.Provider value={instance}>
      {children}
    </FootprintContext.Provider>
  );
}
