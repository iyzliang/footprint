import { Card, Form, Input, Button, Typography, Divider, message } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProfile, updateProfile, updatePassword } from '../api/user';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  });

  const profileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      messageApi.success('个人信息已更新');
    },
    onError: () => messageApi.error('更新失败'),
  });

  const passwordMutation = useMutation({
    mutationFn: updatePassword,
    onSuccess: () => {
      passwordForm.resetFields();
      messageApi.success('密码已修改');
    },
    onError: () => messageApi.error('密码修改失败，请检查旧密码是否正确'),
  });

  if (isLoading || !profile) {
    return <Card loading />;
  }

  return (
    <div>
      {contextHolder}
      <Typography.Title level={3} style={{ marginBottom: 24 }}>
        个人设置
      </Typography.Title>

      <Card title="个人信息" style={{ maxWidth: 500, marginBottom: 24 }}>
        <Form
          form={profileForm}
          layout="vertical"
          initialValues={{ nickname: profile.nickname }}
          onFinish={(values) => profileMutation.mutate(values)}
        >
          <Form.Item label="邮箱">
            <Input value={profile.email} disabled />
          </Form.Item>
          <Form.Item name="nickname" label="昵称" rules={[{ required: true, message: '请输入昵称' }]}>
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={profileMutation.isPending}>
              保存
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="修改密码" style={{ maxWidth: 500 }}>
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={(values) => passwordMutation.mutate(values)}
        >
          <Form.Item
            name="oldPassword"
            label="旧密码"
            rules={[{ required: true, message: '请输入旧密码' }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少 6 位' },
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Divider />
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={passwordMutation.isPending}>
              修改密码
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
