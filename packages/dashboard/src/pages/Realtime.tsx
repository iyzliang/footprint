import { useState } from 'react';
import { Card, Col, Row, Statistic, Typography, Select, Space } from 'antd';
import { ThunderboltOutlined, UserOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import ReactECharts from 'echarts-for-react';
import { getRealtime } from '../api/analytics';
import { useCurrentProject } from '../hooks/useCurrentProject';

export default function RealtimePage() {
  const { projectId } = useCurrentProject();
  const [refreshInterval, setRefreshInterval] = useState(30000);

  const { data, isLoading } = useQuery({
    queryKey: ['realtime', projectId],
    queryFn: () => getRealtime(projectId!),
    enabled: !!projectId,
    refetchInterval: refreshInterval,
  });

  const chartOption = {
    tooltip: { trigger: 'axis' as const },
    xAxis: {
      type: 'category' as const,
      data: data?.minuteTrend.map((d) => d.minute) ?? [],
    },
    yAxis: { type: 'value' as const },
    series: [
      {
        name: '事件数',
        type: 'line',
        data: data?.minuteTrend.map((d) => d.count) ?? [],
        smooth: true,
        areaStyle: { opacity: 0.3 },
      },
    ],
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          实时概览
        </Typography.Title>
        <Space>
          <Typography.Text type="secondary">自动刷新：</Typography.Text>
          <Select
            value={refreshInterval}
            onChange={setRefreshInterval}
            size="small"
            style={{ width: 120 }}
            options={[
              { label: '10 秒', value: 10000 },
              { label: '30 秒', value: 30000 },
              { label: '60 秒', value: 60000 },
              { label: '暂停', value: 0 },
            ]}
          />
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="最近 30 分钟事件数"
              value={data?.totalEvents ?? 0}
              prefix={<ThunderboltOutlined />}
              loading={isLoading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="独立用户数"
              value={data?.uniqueUsers ?? 0}
              prefix={<UserOutlined />}
              loading={isLoading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="独立会话数"
              value={data?.uniqueSessions ?? 0}
              prefix={<ClockCircleOutlined />}
              loading={isLoading}
            />
          </Card>
        </Col>
      </Row>

      <Card title="最近 30 分钟事件量趋势">
        <ReactECharts option={chartOption} style={{ height: 350 }} />
      </Card>
    </div>
  );
}
