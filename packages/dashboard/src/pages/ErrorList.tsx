import { useState } from 'react';
import { Card, Table, Typography, Select, Space, Tag } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { getErrors, type ErrorAggregate } from '../api/analytics';
import { useCurrentProject } from '../hooks/useCurrentProject';
import { useTimeRange } from '../hooks/useTimeRange';
import { TimeRangeSelector } from '../components/TimeRangeSelector';

const ERROR_TYPE_COLORS: Record<string, string> = {
  js_error: 'red',
  promise_error: 'orange',
  resource_error: 'blue',
};

export default function ErrorListPage() {
  const { projectId } = useCurrentProject();
  const timeRange = useTimeRange('7d');
  const navigate = useNavigate();
  const [errorType, setErrorType] = useState<string | undefined>();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['errors', projectId, timeRange.startTime, timeRange.endTime, errorType, page],
    queryFn: () =>
      getErrors({
        projectId: projectId!,
        startDate: timeRange.startTime,
        endDate: timeRange.endTime,
        type: errorType,
        page,
        pageSize: 20,
      }),
    enabled: !!projectId,
  });

  const columns = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 130,
      render: (type: string) => <Tag color={ERROR_TYPE_COLORS[type] ?? 'default'}>{type}</Tag>,
    },
    {
      title: '错误信息',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
      render: (msg: string) => (
        <a onClick={() => navigate(`/errors/detail?message=${encodeURIComponent(msg)}`)}>{msg}</a>
      ),
    },
    { title: '出现次数', dataIndex: 'count', key: 'count', width: 100, sorter: (a: ErrorAggregate, b: ErrorAggregate) => a.count - b.count },
    { title: '影响用户', dataIndex: 'userCount', key: 'userCount', width: 100 },
    {
      title: '首次出现',
      dataIndex: 'firstSeen',
      key: 'firstSeen',
      width: 160,
      render: (d: string) => dayjs(d).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '最近出现',
      dataIndex: 'lastSeen',
      key: 'lastSeen',
      width: 160,
      render: (d: string) => dayjs(d).format('YYYY-MM-DD HH:mm'),
    },
  ];

  return (
    <div>
      <Typography.Title level={3} style={{ marginBottom: 16 }}>
        错误列表
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
            placeholder="错误类型"
            allowClear
            style={{ width: 160 }}
            value={errorType}
            onChange={setErrorType}
            options={[
              { label: 'JS 错误', value: 'js_error' },
              { label: 'Promise 错误', value: 'promise_error' },
              { label: '资源错误', value: 'resource_error' },
            ]}
          />
        </Space>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={data?.items}
          rowKey="message"
          loading={isLoading}
          pagination={{
            current: page,
            total: data?.total,
            pageSize: 20,
            onChange: setPage,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Card>
    </div>
  );
}
