import { Space, Radio, DatePicker } from 'antd';
import type { Dayjs } from 'dayjs';
import type { TimeRangePreset } from '../hooks/useTimeRange';

const { RangePicker } = DatePicker;

interface TimeRangeSelectorProps {
  preset: TimeRangePreset;
  range: [Dayjs, Dayjs];
  onPresetChange: (preset: TimeRangePreset) => void;
  onCustomChange: (dates: [Dayjs, Dayjs]) => void;
}

export function TimeRangeSelector({
  preset,
  range,
  onPresetChange,
  onCustomChange,
}: TimeRangeSelectorProps) {
  return (
    <Space wrap>
      <Radio.Group
        value={preset}
        onChange={(e) => onPresetChange(e.target.value)}
        optionType="button"
        buttonStyle="solid"
        size="small"
      >
        <Radio.Button value="today">今天</Radio.Button>
        <Radio.Button value="7d">近 7 天</Radio.Button>
        <Radio.Button value="30d">近 30 天</Radio.Button>
        <Radio.Button value="custom">自定义</Radio.Button>
      </Radio.Group>
      {preset === 'custom' && (
        <RangePicker
          size="small"
          value={range}
          onChange={(dates) => {
            if (dates && dates[0] && dates[1]) {
              onCustomChange([dates[0], dates[1]]);
            }
          }}
        />
      )}
    </Space>
  );
}
