import { createContext } from 'react';
import type { Footprint } from '@footprint/core';

export const FootprintContext = createContext<Footprint | null>(null);
