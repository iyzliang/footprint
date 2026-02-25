import { Card, Typography, Descriptions, Table, Tag } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';
import { getErrorDetail } from '../api/analytics';
import { useCurrentProject } from '../hooks/useCurrentProject';
import { useTimeRange } from '../hooks/useTimeRange';
import { TimeRangeSelector } from '../components/TimeRangeSelector';

export default function ErrorDetailPage() {
  const { projectId } = useCurrentProject();
  const timeRange = useTimeRange('7d');
  const [searchParams] = useSearchParams();
  const errorMessage = searchParams.get('message') ?? '';

  const { data, isLoading } = useQuery({
    queryKey: ['errorDetail', projectId, errorMessage, timeRange.startTime, timeRange.endTime],
    queryFn: () =>
      getErrorDetail({
        projectId: projectId!,
        message: errorMessage,
        startDate: timeRange.startTime,
        endDate: timeRange.endTime,
      }),
    enabled: !!projectId && !!errorMessage,
  });

  const eventColumns = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (v: number) => dayjs(v).format('YYYY-MM-DD HH:mm:ss'),
    },
    { title: '用户', dataIndex: 'userId', key: 'userId', render: (v: string) => v || '-' },
    { title: '页面', dataIndex: 'pageUrl', key: 'pageUrl', ellipsis: true },
    { title: '设备', dataIndex: 'userAgent', key: 'userAgent', ellipsis: true },
  ];

  const trendOption = {
    tooltip: { trigger: 'axis' as const },
    xAxis: { type: 'category' as const, data: [] as string[] },
    yAxis: { type: 'value' as const },
    series: [{ type: 'line', data: [] as number[], smooth: true, areaStyle: { opacity: 0.3 } }],
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          错误详情
        </Typography.Title>
        <TimeRangeSelector
          preset={timeRange.preset}
          range={timeRange.range}
          onPresetChange={timeRange.setPresetRange}
          onCustomChange={timeRange.setCustomRange}
        />
      </div>

      {data?.summary && (
        <Card style={{ marginBottom: 16 }} loading={isLoading}>
          <Descriptions column={2}>
            <Descriptions.Item label="错误信息" span={2}>
              {data.summary.message}
            </Descriptions.Item>
            <Descriptions.Item label="类型">
              <Tag color="red">{data.summary.type}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="出现次数">{data.summary.count}</Descriptions.Item>
            <Descriptions.Item label="影响用户数">{data.summary.userCount}</Descriptions.Item>
            <Descriptions.Item label="首次出现">
              {dayjs(data.summary.firstSeen).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            <Descriptions.Item label="最近出现">
              {dayjs(data.summary.lastSeen).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      <Card title="出现趋势" style={{ marginBottom: 16 }}>
        <ReactECharts option={trendOption} style={{ height: 250 }} />
      </Card>

      {data?.events?.[0]?.stack && (
        <Card title="堆栈信息" style={{ marginBottom: 16 }}>
          <pre
            style={{
              background: '#1e1e1e',
              color: '#d4d4d4',
              padding: 16,
              borderRadius: 8,
              overflow: 'auto',
              maxHeight: 300,
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            {data.events[0].stack}
          </pre>
        </Card>
      )}

      <Card title="最近事件">
        <Table
          columns={eventColumns}
          dataSource={data?.events}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}
