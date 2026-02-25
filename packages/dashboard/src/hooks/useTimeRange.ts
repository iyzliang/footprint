import { useState, useCallback } from 'react';
import dayjs, { type Dayjs } from 'dayjs';

export type TimeRangePreset = 'today' | '7d' | '30d' | 'custom';

export interface TimeRange {
  startTime: string;
  endTime: string;
  preset: TimeRangePreset;
}

function getPresetRange(preset: TimeRangePreset): [Dayjs, Dayjs] {
  const now = dayjs();
  switch (preset) {
    case 'today':
      return [now.startOf('day'), now];
    case '7d':
      return [now.subtract(7, 'day').startOf('day'), now];
    case '30d':
      return [now.subtract(30, 'day').startOf('day'), now];
    default:
      return [now.subtract(7, 'day').startOf('day'), now];
  }
}

export function useTimeRange(defaultPreset: TimeRangePreset = '7d') {
  const [range, setRange] = useState<[Dayjs, Dayjs]>(getPresetRange(defaultPreset));
  const [preset, setPreset] = useState<TimeRangePreset>(defaultPreset);

  const setPresetRange = useCallback((p: TimeRangePreset) => {
    setPreset(p);
    if (p !== 'custom') {
      setRange(getPresetRange(p));
    }
  }, []);

  const setCustomRange = useCallback((dates: [Dayjs, Dayjs]) => {
    setPreset('custom');
    setRange(dates);
  }, []);

  return {
    range,
    preset,
    startTime: range[0].toISOString(),
    endTime: range[1].toISOString(),
    setPresetRange,
    setCustomRange,
  };
}
