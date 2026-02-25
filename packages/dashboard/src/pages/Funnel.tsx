import { useState } from 'react';
import { Card, Typography, Select, Button, Space, Table } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import ReactECharts from 'echarts-for-react';
import { getFunnel } from '../api/analytics';
import { getEventNames } from '../api/events';
import { useCurrentProject } from '../hooks/useCurrentProject';
import { useTimeRange } from '../hooks/useTimeRange';
import { TimeRangeSelector } from '../components/TimeRangeSelector';

export default function FunnelPage() {
  const { projectId } = useCurrentProject();
  const timeRange = useTimeRange('7d');
  const [steps, setSteps] = useState<string[]>([]);

  const { data: eventNames } = useQuery({
    queryKey: ['eventNames', projectId],
    queryFn: () => getEventNames(projectId!),
    enabled: !!projectId,
  });

  const { data: funnelData, isLoading } = useQuery({
    queryKey: ['funnel', projectId, steps, timeRange.startTime, timeRange.endTime],
    queryFn: () =>
      getFunnel({
        projectId: projectId!,
        steps,
        startDate: timeRange.startTime,
        endDate: timeRange.endTime,
      }),
    enabled: !!projectId && steps.length >= 2,
  });

  const addStep = () => setSteps([...steps, '']);
  const removeStep = (index: number) => setSteps(steps.filter((_, i) => i !== index));
  const updateStep = (index: number, value: string) => {
    const newSteps = [...steps];
    newSteps[index] = value;
    setSteps(newSteps);
  };

  const chartOption = funnelData
    ? {
        tooltip: { trigger: 'item' as const, formatter: '{b}: {c} ({d}%)' },
        series: [
          {
            type: 'funnel',
            left: '10%',
            top: 20,
            bottom: 20,
            width: '80%',
            min: 0,
            max: funnelData[0]?.count ?? 100,
            sort: 'descending' as const,
            gap: 2,
            label: { show: true, position: 'inside' as const },
            data: funnelData.map((step) => ({
              name: step.eventName,
              value: step.count,
            })),
          },
        ],
      }
    : {};

  const columns = [
    { title: '步骤', key: 'step', render: (_: unknown, __: unknown, index: number) => `步骤 ${index + 1}` },
    { title: '事件名', dataIndex: 'eventName', key: 'eventName' },
    { title: '人数', dataIndex: 'count', key: 'count' },
    {
      title: '转化率',
      dataIndex: 'rate',
      key: 'rate',
      render: (rate: number) => `${(rate * 100).toFixed(1)}%`,
    },
  ];

  return (
    <div>
      <Typography.Title level={3} style={{ marginBottom: 16 }}>
        漏斗分析
      </Typography.Title>

      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <TimeRangeSelector
            preset={timeRange.preset}
            range={timeRange.range}
            onPresetChange={timeRange.setPresetRange}
            onCustomChange={timeRange.setCustomRange}
          />
          <Typography.Text strong>漏斗步骤：</Typography.Text>
          {steps.map((step, index) => (
            <Space key={index}>
              <Typography.Text type="secondary">步骤 {index + 1}：</Typography.Text>
              <Select
                placeholder="选择事件"
                style={{ width: 300 }}
                value={step || undefined}
                onChange={(value) => updateStep(index, value)}
                options={eventNames?.map((n) => ({ label: n, value: n }))}
              />
              <Button icon={<DeleteOutlined />} danger size="small" onClick={() => removeStep(index)} />
            </Space>
          ))}
          <Button icon={<PlusOutlined />} onClick={addStep} type="dashed" style={{ width: 200 }}>
            添加步骤
          </Button>
        </Space>
      </Card>

      {steps.length >= 2 && steps.every(Boolean) && (
        <>
          <Card loading={isLoading} style={{ marginBottom: 16 }}>
            <ReactECharts option={chartOption} style={{ height: 350 }} />
          </Card>
          <Card>
            <Table columns={columns} dataSource={funnelData} rowKey="eventName" loading={isLoading} pagination={false} />
          </Card>
        </>
      )}
    </div>
  );
}
