import { Card, Col, Row, Typography, Table, Tag } from 'antd';
import { useQuery } from '@tanstack/react-query';
import ReactECharts from 'echarts-for-react';
import { getWebVitals, getPagePerformance } from '../api/analytics';
import { useCurrentProject } from '../hooks/useCurrentProject';
import { useTimeRange } from '../hooks/useTimeRange';
import { TimeRangeSelector } from '../components/TimeRangeSelector';

const METRIC_THRESHOLDS: Record<string, { good: number; poor: number; unit: string }> = {
  LCP: { good: 2500, poor: 4000, unit: 'ms' },
  FID: { good: 100, poor: 300, unit: 'ms' },
  CLS: { good: 0.1, poor: 0.25, unit: '' },
  TTFB: { good: 800, poor: 1800, unit: 'ms' },
  INP: { good: 200, poor: 500, unit: 'ms' },
};

function getRating(metric: string, value: number): { color: string; label: string } {
  const threshold = METRIC_THRESHOLDS[metric];
  if (!threshold) return { color: 'default', label: '未知' };
  if (value <= threshold.good) return { color: 'green', label: '良好' };
  if (value <= threshold.poor) return { color: 'orange', label: '一般' };
  return { color: 'red', label: '较差' };
}

export default function WebVitalsPage() {
  const { projectId } = useCurrentProject();
  const timeRange = useTimeRange('7d');

  const { data: vitalsData, isLoading } = useQuery({
    queryKey: ['webVitals', projectId, timeRange.startTime, timeRange.endTime],
    queryFn: () =>
      getWebVitals({
        projectId: projectId!,
        startDate: timeRange.startTime,
        endDate: timeRange.endTime,
      }),
    enabled: !!projectId,
  });

  const { data: perfData, isLoading: perfLoading } = useQuery({
    queryKey: ['pagePerformance', projectId, timeRange.startTime, timeRange.endTime],
    queryFn: () =>
      getPagePerformance({
        projectId: projectId!,
        startDate: timeRange.startTime,
        endDate: timeRange.endTime,
        limit: 20,
      }),
    enabled: !!projectId,
  });

  const latestMetrics = new Map<string, { avg: number; p75: number; p95: number }>();
  vitalsData?.forEach((d) => {
    if (!latestMetrics.has(d.metric)) {
      latestMetrics.set(d.metric, { avg: d.avg, p75: d.p75, p95: d.p95 });
    }
  });

  const metricCards = ['LCP', 'FID', 'CLS', 'TTFB', 'INP'].map((metric) => {
    const data = latestMetrics.get(metric);
    const value = data?.avg ?? 0;
    const rating = getRating(metric, value);
    const unit = METRIC_THRESHOLDS[metric]?.unit ?? '';
    return { metric, value, rating, unit, p75: data?.p75 ?? 0, p95: data?.p95 ?? 0 };
  });

  const perfColumns = [
    { title: '排名', key: 'rank', render: (_: unknown, __: unknown, i: number) => i + 1, width: 60 },
    { title: '页面 URL', dataIndex: 'pageUrl', key: 'pageUrl', ellipsis: true },
    { title: '平均加载时间', dataIndex: 'avgLoadTime', key: 'avgLoadTime', render: (v: number) => `${v.toFixed(0)} ms` },
    { title: '访问次数', dataIndex: 'visitCount', key: 'visitCount' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Web Vitals 性能监控
        </Typography.Title>
        <TimeRangeSelector
          preset={timeRange.preset}
          range={timeRange.range}
          onPresetChange={timeRange.setPresetRange}
          onCustomChange={timeRange.setCustomRange}
        />
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {metricCards.map(({ metric, value, rating, unit }) => (
          <Col xs={24} sm={12} lg={4} key={metric}>
            <Card loading={isLoading}>
              <Typography.Text type="secondary">{metric}</Typography.Text>
              <div style={{ fontSize: 24, fontWeight: 600, margin: '8px 0' }}>
                {value.toFixed(metric === 'CLS' ? 3 : 0)}
                {unit && <span style={{ fontSize: 14, marginLeft: 2 }}>{unit}</span>}
              </div>
              <Tag color={rating.color}>{rating.label}</Tag>
            </Card>
          </Col>
        ))}
      </Row>

      <Card title="页面加载排行" style={{ marginTop: 16 }}>
        <Table
          columns={perfColumns}
          dataSource={perfData}
          rowKey="pageUrl"
          loading={perfLoading}
          pagination={false}
        />
      </Card>
    </div>
  );
}
