import { Card, Tabs, Form, Input, Button, Typography, Space, Tag, InputNumber, Switch, message, Popconfirm } from 'antd';
import { CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { getProject, updateProject, regenerateAppSecret } from '../api/project';

export default function ProjectSettingsPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [basicForm] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => getProject(id!),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (params: Record<string, unknown>) => updateProject(id!, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      messageApi.success('保存成功');
    },
    onError: () => messageApi.error('保存失败'),
  });

  const regenerateMutation = useMutation({
    mutationFn: () => regenerateAppSecret(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      messageApi.success('App Secret 已重新生成');
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    messageApi.success('已复制');
  };

  if (isLoading || !project) {
    return <Card loading />;
  }

  return (
    <div>
      {contextHolder}
      <Typography.Title level={3} style={{ marginBottom: 24 }}>
        项目设置 — {project.name}
      </Typography.Title>

      <Tabs
        items={[
          {
            key: 'basic',
            label: '基本信息',
            children: (
              <Card>
                <Form
                  form={basicForm}
                  layout="vertical"
                  initialValues={{ name: project.name }}
                  onFinish={(values) => updateMutation.mutate(values)}
                  style={{ maxWidth: 500 }}
                >
                  <Form.Item name="name" label="项目名称" rules={[{ required: true }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item label="App ID">
                    <Space>
                      <Tag>{project.appId}</Tag>
                      <CopyOutlined
                        style={{ cursor: 'pointer', color: '#1677ff' }}
                        onClick={() => copyToClipboard(project.appId)}
                      />
                    </Space>
                  </Form.Item>
                  <Form.Item label="App Secret">
                    <Space>
                      <Tag>{project.appSecret}</Tag>
                      <CopyOutlined
                        style={{ cursor: 'pointer', color: '#1677ff' }}
                        onClick={() => copyToClipboard(project.appSecret)}
                      />
                      <Popconfirm title="确认重新生成 App Secret？" onConfirm={() => regenerateMutation.mutate()}>
                        <Button size="small" icon={<ReloadOutlined />}>
                          重新生成
                        </Button>
                      </Popconfirm>
                    </Space>
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={updateMutation.isPending}>
                      保存
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            ),
          },
          {
            key: 'advanced',
            label: '高级设置',
            children: (
              <Card>
                <Form
                  layout="vertical"
                  initialValues={{
                    dataRetentionDays: project.dataRetentionDays,
                    enableIpResolve: project.settings?.enableIpResolve ?? true,
                    enableUaResolve: project.settings?.enableUaResolve ?? true,
                  }}
                  onFinish={(values) =>
                    updateMutation.mutate({
                      dataRetentionDays: values.dataRetentionDays,
                      settings: {
                        ...project.settings,
                        enableIpResolve: values.enableIpResolve,
                        enableUaResolve: values.enableUaResolve,
                      },
                    })
                  }
                  style={{ maxWidth: 500 }}
                >
                  <Form.Item name="dataRetentionDays" label="数据保留天数">
                    <InputNumber min={1} max={365} />
                  </Form.Item>
                  <Form.Item name="enableIpResolve" label="IP 地理位置解析" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                  <Form.Item name="enableUaResolve" label="UA 解析" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={updateMutation.isPending}>
                      保存
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}
