import { useState } from 'react';
import { Card, Typography, Select, Space, Table } from 'antd';
import { useQuery } from '@tanstack/react-query';
import ReactECharts from 'echarts-for-react';
import { getTopEvents } from '../api/analytics';
import { useCurrentProject } from '../hooks/useCurrentProject';
import { useTimeRange } from '../hooks/useTimeRange';
import { TimeRangeSelector } from '../components/TimeRangeSelector';

export default function TopEventsPage() {
  const { projectId } = useCurrentProject();
  const timeRange = useTimeRange('7d');
  const [limit, setLimit] = useState(10);

  const { data, isLoading } = useQuery({
    queryKey: ['topEvents', projectId, timeRange.startTime, timeRange.endTime, limit],
    queryFn: () =>
      getTopEvents({
        projectId: projectId!,
        startDate: timeRange.startTime,
        endDate: timeRange.endTime,
        limit,
      }),
    enabled: !!projectId,
  });

  const chartData = [...(data ?? [])].reverse();

  const chartOption = {
    tooltip: { trigger: 'axis' as const },
    xAxis: { type: 'value' as const },
    yAxis: {
      type: 'category' as const,
      data: chartData.map((d) => d.eventName),
      axisLabel: { width: 120, overflow: 'truncate' as const },
    },
    series: [
      {
        type: 'bar',
        data: chartData.map((d) => d.count),
        itemStyle: { borderRadius: [0, 4, 4, 0] },
      },
    ],
    grid: { left: 140, right: 20, top: 10, bottom: 30 },
  };

  const columns = [
    { title: '排名', key: 'rank', render: (_: unknown, __: unknown, index: number) => index + 1 },
    { title: '事件名', dataIndex: 'eventName', key: 'eventName' },
    { title: '次数', dataIndex: 'count', key: 'count', sorter: (a: { count: number }, b: { count: number }) => a.count - b.count },
    { title: '用户数', dataIndex: 'userCount', key: 'userCount' },
  ];

  return (
    <div>
      <Typography.Title level={3} style={{ marginBottom: 16 }}>
        事件排行
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
            value={limit}
            onChange={setLimit}
            size="small"
            style={{ width: 100 }}
            options={[
              { label: 'Top 10', value: 10 },
              { label: 'Top 20', value: 20 },
              { label: 'Top 50', value: 50 },
            ]}
          />
        </Space>
      </Card>

      <Card loading={isLoading} style={{ marginBottom: 16 }}>
        <ReactECharts option={chartOption} style={{ height: Math.max(300, (data?.length ?? 0) * 30 + 60) }} />
      </Card>

      <Card>
        <Table columns={columns} dataSource={data} rowKey="eventName" loading={isLoading} pagination={false} />
      </Card>
    </div>
  );
}
