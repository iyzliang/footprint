import type { CSSProperties } from 'react';
import { useState } from 'react';
import { Form, Input, Button, Typography, message } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { login } from '../api/auth';
import { setAccessToken, setRefreshToken } from '../utils/token';
import loginHome from '../assets/images/footprint-home.jpg';

const { Title, Text } = Typography;

interface LoginFormValues {
  email: string;
  password: string;
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [messageApi, contextHolder] = message.useMessage();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const handleLogin = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      const data = await login(values);
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      messageApi.success('登录成功');
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response: { data: { message: string } } }).response?.data?.message
          : '登录失败，请重试';
      messageApi.error(msg || '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const features = ['实时事件流追踪', '异常监控与告警', '多维度数据分析'];

  return (
    <div style={styles.container}>
      {contextHolder}

      {/* Left - Illustration Panel */}
      <div style={styles.illustrationPanel}>
        <img src={loginHome} alt="Footprint 数据分析平台" style={styles.bgImage} />
        <div style={styles.overlay} />
        <div style={styles.illustrationContent}>
          <div style={styles.brandMark}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="10" fill="rgba(255,255,255,0.2)" />
              <path
                d="M12 28V18L20 12L28 18V28H22V22H18V28H12Z"
                fill="white"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <Title level={2} style={styles.heroTitle}>
            洞察每一次交互
          </Title>
          <Text style={styles.heroSubtitle}>
            从用户行为到业务决策，Footprint 为你提供全链路的数据追踪与可视化分析能力。
          </Text>
          <div style={styles.featureList}>
            {features.map((text) => (
              <div key={text} style={styles.featureItem}>
                <span style={styles.featureIcon}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M13.3 4.3L6.5 11.1L2.7 7.3"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right - Login Form Panel */}
      <div style={styles.formPanel}>
        <div style={styles.formWrapper}>
          <div style={styles.logoRow}>
            <img src="/logo.png" alt="Footprint Logo" style={styles.logo} />
          </div>

          <Title level={3} style={styles.formTitle}>
            欢迎回来
          </Title>
          <Text style={styles.formSubtitle}>登录你的 Footprint 账户，开始数据之旅</Text>

          <Form<LoginFormValues>
            onFinish={handleLogin}
            size="large"
            layout="vertical"
            style={styles.form}
            requiredMark={false}
          >
            <Form.Item
              name="email"
              label={<span style={styles.label}>邮箱地址</span>}
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' },
              ]}
            >
              <Input
                prefix={<MailOutlined style={styles.inputIcon} />}
                placeholder="name@example.com"
                style={styles.input}
                autoComplete="email"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={<span style={styles.label}>密码</span>}
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少 6 位' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={styles.inputIcon} />}
                placeholder="输入密码"
                style={styles.input}
                autoComplete="current-password"
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 16 }}>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                style={styles.submitBtn}
              >
                登录
              </Button>
            </Form.Item>
          </Form>

          <div style={styles.footer}>
            <Text style={styles.footerText}>Footprint &copy; {new Date().getFullYear()}</Text>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'row',
    background: '#F8FAFC',
  },

  illustrationPanel: {
    position: 'relative',
    flex: '1 1 55%',
    display: 'flex',
    alignItems: 'flex-end',
    overflow: 'hidden',
  },
  bgImage: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.55)',
  },
  illustrationContent: {
    position: 'relative',
    zIndex: 1,
    padding: '64px 56px',
    maxWidth: 520,
  },
  brandMark: {
    marginBottom: 24,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 700,
    lineHeight: 1.3,
    marginBottom: 12,
    letterSpacing: '-0.02em',
  },
  heroSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 15,
    lineHeight: 1.7,
    display: 'block',
    marginBottom: 32,
  },
  featureList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: 500,
  },
  featureIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.15)',
    flexShrink: 0,
  },

  formPanel: {
    flex: '1 1 45%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 40px',
    background: '#ffffff',
  },
  formWrapper: {
    width: '100%',
    maxWidth: 380,
  },
  logoRow: {
    marginBottom: 40,
  },
  logo: {
    height: 36,
    width: 'auto',
  },
  formTitle: {
    fontSize: 26,
    fontWeight: 700,
    color: '#0F172A',
    marginBottom: 8,
    letterSpacing: '-0.01em',
  },
  formSubtitle: {
    display: 'block',
    color: '#64748B',
    fontSize: 14,
    lineHeight: 1.6,
    marginBottom: 36,
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: '#334155',
  },
  inputIcon: {
    color: '#94A3B8',
    fontSize: 16,
  },
  input: {
    borderRadius: 8,
    height: 44,
  },
  submitBtn: {
    height: 46,
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 15,
    marginTop: 8,
    background: '#1E40AF',
    borderColor: '#1E40AF',
  },
  footer: {
    marginTop: 48,
    textAlign: 'center',
  },
  footerText: {
    color: '#94A3B8',
    fontSize: 12,
  },
};
