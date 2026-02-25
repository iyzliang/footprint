import { Card, Col, Row, Statistic, Typography, List } from 'antd';
import {
  ThunderboltOutlined,
  ProjectOutlined,
  BugOutlined,
  LineChartOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { getProjects } from '../api/project';

export default function HomePage() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
  });

  return (
    <div>
      <Typography.Title level={3} style={{ marginBottom: 24 }}>
        全局概览
      </Typography.Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="活跃项目数"
              value={projects?.length ?? 0}
              prefix={<ProjectOutlined />}
              loading={isLoading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="今日事件"
              value="-"
              prefix={<LineChartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="实时在线"
              value="-"
              prefix={<ThunderboltOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="今日错误"
              value="-"
              prefix={<BugOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="项目列表" style={{ marginTop: 24 }} loading={isLoading}>
        <List
          dataSource={projects ?? []}
          renderItem={(project) => (
            <List.Item>
              <List.Item.Meta
                title={project.name}
                description={`App ID: ${project.appId}`}
              />
            </List.Item>
          )}
          locale={{ emptyText: '暂无项目，请先创建项目' }}
        />
      </Card>
    </div>
  );
}
