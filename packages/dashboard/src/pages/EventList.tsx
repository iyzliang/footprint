import { useState } from 'react';
import { Card, Table, Typography, Select, Input, Space, Button, Tag, Modal } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { getEvents, getEventNames, getExportUrl, type EventItem } from '../api/events';
import { useCurrentProject } from '../hooks/useCurrentProject';
import { useTimeRange } from '../hooks/useTimeRange';
import { TimeRangeSelector } from '../components/TimeRangeSelector';
import { getAccessToken } from '../utils/token';

export default function EventListPage() {
  const { projectId } = useCurrentProject();
  const timeRange = useTimeRange('7d');
  const [eventName, setEventName] = useState<string | undefined>();
  const [userId, setUserId] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [detailEvent, setDetailEvent] = useState<EventItem | null>(null);

  const { data: eventNames } = useQuery({
    queryKey: ['eventNames', projectId],
    queryFn: () => getEventNames(projectId!),
    enabled: !!projectId,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['events', projectId, eventName, userId, timeRange.startTime, timeRange.endTime, page],
    queryFn: () =>
      getEvents({
        projectId: projectId!,
        eventName,
        userId,
        startTime: timeRange.startTime,
        endTime: timeRange.endTime,
        page,
        pageSize: 20,
      }),
    enabled: !!projectId,
  });

  const handleExport = () => {
    const url = getExportUrl({
      projectId: projectId!,
      eventName,
      userId,
      startTime: timeRange.startTime,
      endTime: timeRange.endTime,
    });
    const token = getAccessToken();
    const link = document.createElement('a');
    link.href = `${url}&token=${token}`;
    link.click();
  };

  const columns = [
    { title: '事件名', dataIndex: 'eventName', key: 'eventName', render: (v: string) => <Tag>{v}</Tag> },
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (v: number) => dayjs(v).format('YYYY-MM-DD HH:mm:ss'),
    },
    { title: '用户', dataIndex: 'userId', key: 'userId', render: (v: string) => v || '-' },
    { title: '页面', dataIndex: 'pageUrl', key: 'pageUrl', ellipsis: true },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: EventItem) => <a onClick={() => setDetailEvent(record)}>详情</a>,
    },
  ];

  return (
    <div>
      <Typography.Title level={3} style={{ marginBottom: 16 }}>
        事件明细
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
            placeholder="事件名"
            allowClear
            style={{ width: 200 }}
            value={eventName}
            onChange={setEventName}
            options={eventNames?.map((n) => ({ label: n, value: n }))}
          />
          <Input
            placeholder="用户 ID"
            allowClear
            style={{ width: 180 }}
            value={userId}
            onChange={(e) => setUserId(e.target.value || undefined)}
          />
          <Button icon={<DownloadOutlined />} onClick={handleExport} disabled={!projectId}>
            导出 CSV
          </Button>
        </Space>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={data?.items}
          rowKey="id"
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

      <Modal
        title="事件详情"
        open={!!detailEvent}
        onCancel={() => setDetailEvent(null)}
        footer={null}
        width={640}
      >
        {detailEvent && (
          <pre style={{ maxHeight: 500, overflow: 'auto', background: '#f5f5f5', padding: 16, borderRadius: 8 }}>
            {JSON.stringify(detailEvent, null, 2)}
          </pre>
        )}
      </Modal>
    </div>
  );
}
