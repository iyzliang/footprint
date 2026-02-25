import { useState } from 'react';
import { Layout, Menu, Dropdown, Avatar, Space, Typography } from 'antd';
import {
  DashboardOutlined,
  LineChartOutlined,
  ThunderboltOutlined,
  BugOutlined,
  ProjectOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BarChartOutlined,
  FunnelPlotOutlined,
  UnorderedListOutlined,
  FireOutlined,
  AlertOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { clearTokens } from '../utils/token';
import { ProjectSwitcher } from './ProjectSwitcher';
import type { MenuProps } from 'antd';

const { Header, Sider, Content } = Layout;

const siderMenuItems: MenuProps['items'] = [
  {
    key: '/',
    icon: <DashboardOutlined />,
    label: '全局概览',
  },
  {
    key: 'analytics',
    icon: <LineChartOutlined />,
    label: '数据分析',
    children: [
      { key: '/analytics/realtime', icon: <ThunderboltOutlined />, label: '实时概览' },
      { key: '/analytics/trend', icon: <LineChartOutlined />, label: '事件趋势' },
      { key: '/analytics/top-events', icon: <FireOutlined />, label: '事件排行' },
      { key: '/analytics/funnel', icon: <FunnelPlotOutlined />, label: '漏斗分析' },
      { key: '/analytics/events', icon: <UnorderedListOutlined />, label: '事件明细' },
    ],
  },
  {
    key: 'performance',
    icon: <BarChartOutlined />,
    label: '性能监控',
    children: [
      { key: '/performance/web-vitals', icon: <ThunderboltOutlined />, label: 'Web Vitals' },
    ],
  },
  {
    key: 'errors',
    icon: <BugOutlined />,
    label: '错误监控',
    children: [
      { key: '/errors/list', icon: <AlertOutlined />, label: '错误列表' },
    ],
  },
  {
    key: 'projects',
    icon: <ProjectOutlined />,
    label: '项目管理',
    children: [
      { key: '/projects', icon: <ProjectOutlined />, label: '项目列表' },
    ],
  },
  {
    key: '/settings',
    icon: <SettingOutlined />,
    label: '设置',
  },
];

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key);
  };

  const handleLogout = () => {
    clearTokens();
    navigate('/login');
  };

  const userMenuItems: MenuProps['items'] = [
    { key: 'profile', icon: <UserOutlined />, label: '个人设置', onClick: () => navigate('/settings') },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout },
  ];

  const selectedKeys = [location.pathname];
  const openKeys = siderMenuItems
    ?.filter((item): item is { key: string; children: unknown[] } =>
      !!(item && 'children' in item && item.children),
    )
    .filter((item) =>
      (item.children as { key: string }[]).some((child) => location.pathname.startsWith(child.key)),
    )
    .map((item) => item.key) ?? [];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        width={220}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <Typography.Title
            level={4}
            style={{ color: '#fff', margin: 0, whiteSpace: 'nowrap' }}
          >
            {collapsed ? 'FP' : 'Footprint'}
          </Typography.Title>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={selectedKeys}
          defaultOpenKeys={openKeys}
          items={siderMenuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 220, transition: 'margin-left 0.2s' }}>
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            position: 'sticky',
            top: 0,
            zIndex: 9,
          }}
        >
          <Space size="middle">
            {collapsed ? (
              <MenuUnfoldOutlined
                style={{ fontSize: 18, cursor: 'pointer' }}
                onClick={() => setCollapsed(false)}
              />
            ) : (
              <MenuFoldOutlined
                style={{ fontSize: 18, cursor: 'pointer' }}
                onClick={() => setCollapsed(true)}
              />
            )}
            <ProjectSwitcher />
          </Space>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} />
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ margin: 24, minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
