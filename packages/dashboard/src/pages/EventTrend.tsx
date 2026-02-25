import { useState } from 'react';
import { Card, Typography, Select, Radio, Space } from 'antd';
import { useQuery } from '@tanstack/react-query';
import ReactECharts from 'echarts-for-react';
import { getTrend } from '../api/analytics';
import { getEventNames } from '../api/events';
import { useCurrentProject } from '../hooks/useCurrentProject';
import { useTimeRange } from '../hooks/useTimeRange';
import { TimeRangeSelector } from '../components/TimeRangeSelector';

export default function EventTrendPage() {
  const { projectId } = useCurrentProject();
  const timeRange = useTimeRange('7d');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [granularity, setGranularity] = useState<'hour' | 'day'>('day');

  const { data: eventNames } = useQuery({
    queryKey: ['eventNames', projectId],
    queryFn: () => getEventNames(projectId!),
    enabled: !!projectId,
  });

  const { data: trendData, isLoading } = useQuery({
    queryKey: ['trend', projectId, selectedEvents, timeRange.startTime, timeRange.endTime, granularity],
    queryFn: () =>
      getTrend({
        projectId: projectId!,
        eventNames: selectedEvents,
        startDate: timeRange.startTime,
        endDate: timeRange.endTime,
        granularity,
      }),
    enabled: !!projectId && selectedEvents.length > 0,
  });

  const seriesMap = new Map<string, { time: string; count: number }[]>();
  trendData?.forEach((point) => {
    if (!seriesMap.has(point.eventName)) {
      seriesMap.set(point.eventName, []);
    }
    seriesMap.get(point.eventName)!.push({ time: point.time, count: point.count });
  });

  const times = [...new Set(trendData?.map((d) => d.time) ?? [])].sort();

  const chartOption = {
    tooltip: { trigger: 'axis' as const },
    legend: { data: selectedEvents },
    xAxis: { type: 'category' as const, data: times },
    yAxis: { type: 'value' as const },
    series: selectedEvents.map((name) => ({
      name,
      type: 'line',
      data: times.map((t) => seriesMap.get(name)?.find((d) => d.time === t)?.count ?? 0),
      smooth: true,
    })),
    grid: { left: 50, right: 20, top: 40, bottom: 30 },
    dataZoom: [{ type: 'inside' }],
  };

  return (
    <div>
      <Typography.Title level={3} style={{ marginBottom: 16 }}>
        事件趋势
      </Typography.Title>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <TimeRangeSelector
            preset={timeRange.preset}
            range={timeRange.range}
            onPresetChange={timeRange.setPresetRange}
            onCustomChange={timeRange.setCustomRange}
          />
          <Select
            mode="multiple"
            placeholder="选择事件"
            style={{ minWidth: 300 }}
            value={selectedEvents}
            onChange={setSelectedEvents}
            options={eventNames?.map((n) => ({ label: n, value: n }))}
            maxTagCount={3}
          />
          <Radio.Group value={granularity} onChange={(e) => setGranularity(e.target.value)} optionType="button" size="small">
            <Radio.Button value="hour">按小时</Radio.Button>
            <Radio.Button value="day">按天</Radio.Button>
          </Radio.Group>
        </Space>
      </Card>

      <Card loading={isLoading}>
        {selectedEvents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>请选择至少一个事件</div>
        ) : (
          <ReactECharts option={chartOption} style={{ height: 400 }} />
        )}
      </Card>
    </div>
  );
}
