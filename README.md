# Footprint

全栈 TypeScript 数据埋点分析平台，用于 Web 前端项目的数据采集、性能监控、错误监控与可视化分析。

## 项目架构

```
footprint/
├── packages/
│   ├── core/          # @footprint/core — 框架无关的客户端采集 SDK
│   ├── react/         # @footprint/react — React 框架绑定
│   ├── vue/           # @footprint/vue — Vue 3 框架绑定
│   ├── server/        # NestJS 后端服务（数据接收、存储、查询、分析）
│   └── dashboard/     # React 后台看板（数据可视化与项目管理）
├── Dockerfile         # 多阶段 Docker 构建
├── docker-compose.yml # 一键部署编排
└── package.json       # Monorepo 根配置
```

### 技术栈

| 层级       | 技术                                                    |
| ---------- | ------------------------------------------------------- |
| SDK 核心   | TypeScript、tsup（ESM/CJS/UMD）                         |
| React 绑定 | React Context + Hooks                                   |
| Vue 绑定   | Vue 3 Plugin + Composables + 自定义指令                 |
| 后端       | NestJS、TypeORM、PostgreSQL、Passport JWT               |
| 前端看板   | React 19、Vite、Ant Design 6、ECharts、TanStack Query   |
| 工具链     | pnpm workspace、Turborepo、ESLint、Prettier、Changesets |

---

## 功能概览

### SDK（@footprint/core）

- **手动埋点** — `fp.track('event_name', { key: 'value' })`
- **用户标识** — `fp.identify(userId)` 关联匿名 ID 与登录用户
- **全局属性** — `fp.setGlobalProps({ version: '1.0' })` 每条事件自动携带
- **批量上报** — 内存队列，达到阈值（10 条）或定时（5 秒）批量发送
- **页面关闭兜底** — `navigator.sendBeacon` 确保数据不丢
- **失败重试** — 上报失败暂存 localStorage，下次访问补发
- **插件体系**：
  - `autoTrack()` — 自动采集 PV/UV、元素点击、页面停留时长
  - `webVitals()` — 采集 LCP、FID、CLS、TTFB、INP
  - `errorTrack()` — 捕获 JS 异常、Promise 未捕获、资源加载失败

### Server

- **数据接收** — `POST /api/collect`，轻量校验 + 异步入库
- **认证** — JWT 登录注册、Token 刷新
- **项目管理** — CRUD、AppId/AppSecret 生成、成员管理
- **事件查询** — 分页列表、多条件筛选、CSV 导出
- **分析模块** — 事件趋势、实时概览、热门事件、漏斗分析
- **性能监控** — Web Vitals 趋势、页面加载排行
- **错误监控** — 错误聚合列表、错误详情与堆栈
- **数据保留** — 定时任务按项目配置清理过期数据
- **API 文档** — Swagger UI（`/api/docs`）

### Dashboard

- 登录 / 注册
- 全局概览、项目管理
- 实时概览（自动刷新）
- 事件趋势（多事件对比折线图）
- 事件排行（Top N 柱状图）
- 漏斗分析（自定义步骤）
- 事件明细（筛选、分页、CSV 导出）
- Web Vitals 性能监控
- 错误列表 / 错误详情
- 个人设置（修改昵称、密码）

---

## 环境要求

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0
- **PostgreSQL** >= 14

---

## 本地开发

### 1. 克隆项目并安装依赖

```bash
git clone <repo-url> footprint
cd footprint
pnpm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

根据实际情况修改 `.env` 中的数据库连接、JWT 密钥等配置：

```env
# 数据库
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=footprint
DB_PASSWORD=footprint_secret
DB_DATABASE=footprint

# JWT（生产环境务必修改）
JWT_SECRET=your-jwt-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production

# 服务端口
PORT=3001
```

### 3. 准备 PostgreSQL 数据库

确保 PostgreSQL 已运行，并创建数据库：

```bash
createdb footprint
```

或者使用 Docker 快速启动一个 PostgreSQL 实例：

```bash
docker run -d \
  --name footprint-postgres \
  -e POSTGRES_USER=footprint \
  -e POSTGRES_PASSWORD=footprint_secret \
  -e POSTGRES_DB=footprint \
  -p 5432:5432 \
  postgres:16-alpine
```

> 开发模式下 TypeORM 会自动同步表结构（`synchronize: true`），无需手动执行迁移。

### 4. 启动开发服务

**方式一：使用 Turborepo 全量启动**

```bash
pnpm dev
```

这会同时启动所有包的开发模式。

**方式二：分别启动（推荐）**

终端 1 — 启动后端服务（端口 3001）：

```bash
cd packages/server
pnpm dev
```

终端 2 — 启动前端看板（端口 3000）：

```bash
cd packages/dashboard
pnpm dev
```

Dashboard 的 Vite 开发服务器已配置 API 代理，所有 `/api` 请求会自动转发到 `http://localhost:3001`。

### 5. 访问服务

| 服务           | 地址                             |
| -------------- | -------------------------------- |
| Dashboard 看板 | http://localhost:3007            |
| Server API     | http://localhost:3008            |
| Swagger 文档   | http://localhost:3008/api/docs   |
| 健康检查       | http://localhost:3008/api/health |

### 6. 首次使用

1. 打开 http://localhost:3007，在登录页切换到「注册」标签
2. 注册一个账号后自动登录
3. 进入「项目管理」创建一个项目，获取 `appId`
4. 在你的前端项目中接入 SDK（见下方 SDK 接入指南）

---

## SDK 接入指南

### 安装

```bash
# 核心包（必装）
npm install @footprint/core

# React 项目
npm install @footprint/react

# Vue 3 项目
npm install @footprint/vue
```

### 基础用法

```typescript
import { Footprint, autoTrack, webVitals, errorTrack } from '@footprint/core';

const fp = Footprint.init({
  appId: 'your-app-id',
  serverUrl: 'https://your-server.com/api/collect',
  debug: true,
  plugins: [autoTrack(), webVitals(), errorTrack()],
});

// 手动埋点
fp.track('button_click', { buttonId: 'submit', page: 'checkout' });

// 用户登录后关联身份
fp.identify('user-123');

// 设置全局属性
fp.setGlobalProps({ appVersion: '2.0.0' });
```

> 注意：采集请求默认采用“无凭据”模式。请勿在前端将上报请求配置为 `credentials: 'include'` 或 `withCredentials: true`，否则会触发跨域预检失败。

### React 接入

```tsx
import { Footprint } from '@footprint/core';
import { FootprintProvider, useTrack, TrackClick } from '@footprint/react';

const fp = Footprint.init({ appId: 'my-app', serverUrl: '/api/collect' });

function App() {
  return (
    <FootprintProvider instance={fp}>
      <MyPage />
    </FootprintProvider>
  );
}

function MyPage() {
  const track = useTrack();

  return (
    <>
      <button onClick={() => track('manual_click', { from: 'page' })}>手动埋点</button>

      <TrackClick event="buy_click" props={{ sku: '123' }}>
        <button>自动埋点</button>
      </TrackClick>
    </>
  );
}
```

### Vue 3 接入

```typescript
import { createApp } from 'vue';
import { Footprint } from '@footprint/core';
import { FootprintPlugin } from '@footprint/vue';

const fp = Footprint.init({ appId: 'my-app', serverUrl: '/api/collect' });
const app = createApp(App);

app.use(FootprintPlugin, { instance: fp });
app.mount('#app');
```

```vue
<script setup>
import { useTrack } from '@footprint/vue';
const track = useTrack();
</script>

<template>
  <!-- 组合式 API -->
  <button @click="track('buy_click', { sku: '123' })">购买</button>

  <!-- 指令方式 -->
  <button v-track:click="{ event: 'buy_click', props: { sku: '456' } }">购买</button>
</template>
```

---

## 本地引入

### 方式一：`<script>` 标签直接引入（最简单）

构建后将 packages/core/dist/index.global.js 复制到你的项目中，通过 script 标签加载：

  <script src="/path/to/index.global.js"></script>
  <script>
    const fp = Footprint.Footprint.init({
      appId: 'your-app-id',
      serverUrl: 'http://localhost:3008',
      debug: true,
      plugins: [
        Footprint.autoTrack(),
        Footprint.errorTrack(),
        Footprint.webVitals(),
      ],
    });
  </script>

全局变量 Footprint 下包含所有导出：Footprint.Footprint（类）、Footprint.autoTrack、Footprint.errorTrack、Footprint.webVitals 等。

### 方式二：ES Module 引入

如果你的项目支持 ES Module，可以直接引用构建产物：

  <script type="module">
    import { Footprint, autoTrack, errorTrack, webVitals } from '/path/to/index.mjs';
    const fp = Footprint.init({
      appId: 'your-app-id',
      serverUrl: 'http://localhost:3008',
      plugins: [autoTrack(), errorTrack(), webVitals()],
    });
  </script>

### 方式三：在其他本地项目中通过相对路径引用

在目标项目的 package.json 中直接指向本地路径：

{
"dependencies": {
"@footprint/core": "file:../footprint/packages/core"
}
}

然后正常 import { Footprint } from '@footprint/core' 即可。

## 构建

```bash
# 构建所有包
pnpm build

# 单独构建
cd packages/core && pnpm build
cd packages/server && pnpm build
cd packages/dashboard && pnpm build
```

---

## 代码质量

```bash
# 全量 lint
pnpm lint

# 全量测试
pnpm test

# 代码格式化
pnpm format

# 格式检查
pnpm format:check
```

---

## 生产部署

### 方式一：Docker Compose 一键部署（推荐）

```bash
# 1. 配置环境变量
cp .env.example .env
# 编辑 .env，务必修改 JWT_SECRET 和数据库密码

# 2. 构建并启动
docker compose up -d

# 3. 查看日志
docker compose logs -f server

# 4. 停止服务
docker compose down
```

服务启动后访问 `http://your-server:3001` 即可使用 Dashboard。

### 方式二：手动部署

#### 1. 构建产物

```bash
pnpm install
pnpm build
```

#### 2. 准备数据库

确保 PostgreSQL 已运行并创建数据库。

#### 3. 部署后端

```bash
cd packages/server

# 设置环境变量
export NODE_ENV=production
export DB_HOST=your-db-host
export DB_PORT=5432
export DB_USERNAME=footprint
export DB_PASSWORD=your-secure-password
export DB_DATABASE=footprint
export JWT_SECRET=your-secure-jwt-secret
export PORT=3001

# 启动
node dist/main.js
```

#### 4. 部署前端

Dashboard 构建产物位于 `packages/dashboard/dist/`，有两种托管方式：

**方式 A** — 由 NestJS 直接托管（已内置配置，无需额外操作）：

将 `packages/dashboard/dist/` 目录放到 Server 可访问的路径即可，Server 的 `ServeStaticModule` 会自动托管。

**方式 B** — 使用 Nginx 反向代理：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /path/to/packages/dashboard/dist;
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

## 环境变量说明

| 变量                             | 说明                       | 默认值             |
| -------------------------------- | -------------------------- | ------------------ |
| `DB_HOST`                        | PostgreSQL 主机            | `localhost`        |
| `DB_PORT`                        | PostgreSQL 端口            | `5432`             |
| `DB_USERNAME`                    | 数据库用户名               | `footprint`        |
| `DB_PASSWORD`                    | 数据库密码                 | `footprint_secret` |
| `DB_DATABASE`                    | 数据库名                   | `footprint`        |
| `JWT_SECRET`                     | JWT 签名密钥               | —                  |
| `JWT_REFRESH_SECRET`             | Refresh Token 签名密钥     | —                  |
| `JWT_EXPIRES_IN_SECONDS`         | Access Token 有效期（秒）  | `86400`            |
| `JWT_REFRESH_EXPIRES_IN_SECONDS` | Refresh Token 有效期（秒） | `604800`           |
| `PORT`                           | Server 监听端口            | `3001`             |
| `NODE_ENV`                       | 运行环境                   | `development`      |
| `CORS_ORIGIN`                    | 允许的跨域来源             | `*`                |
| `THROTTLE_TTL`                   | 限流窗口（秒）             | `60`               |
| `THROTTLE_LIMIT`                 | 限流窗口内最大请求数       | `100`              |

---

## API 接口概览

### 认证

| 方法 | 路径                 | 说明       |
| ---- | -------------------- | ---------- |
| POST | `/api/auth/register` | 用户注册   |
| POST | `/api/auth/login`    | 用户登录   |
| POST | `/api/auth/refresh`  | 刷新 Token |

### 用户

| 方法 | 路径                 | 说明         |
| ---- | -------------------- | ------------ |
| GET  | `/api/user/profile`  | 获取个人信息 |
| PUT  | `/api/user/profile`  | 更新个人信息 |
| PUT  | `/api/user/password` | 修改密码     |

### 项目管理

| 方法   | 路径                | 说明     |
| ------ | ------------------- | -------- |
| GET    | `/api/projects`     | 项目列表 |
| POST   | `/api/projects`     | 创建项目 |
| GET    | `/api/projects/:id` | 项目详情 |
| PUT    | `/api/projects/:id` | 更新项目 |
| DELETE | `/api/projects/:id` | 删除项目 |

### 数据采集

| 方法 | 路径           | 说明         |
| ---- | -------------- | ------------ |
| POST | `/api/collect` | SDK 事件上报 |

### 事件查询

| 方法 | 路径                 | 说明                   |
| ---- | -------------------- | ---------------------- |
| GET  | `/api/events`        | 事件列表（分页、筛选） |
| GET  | `/api/events/names`  | 事件名列表             |
| GET  | `/api/events/export` | 导出 CSV               |
| GET  | `/api/events/:id`    | 事件详情               |

### 数据分析

| 方法 | 路径                              | 说明            |
| ---- | --------------------------------- | --------------- |
| GET  | `/api/analytics/trend`            | 事件趋势        |
| GET  | `/api/analytics/realtime`         | 实时概览        |
| GET  | `/api/analytics/top-events`       | 热门事件排行    |
| POST | `/api/analytics/funnel`           | 漏斗分析        |
| GET  | `/api/analytics/web-vitals`       | Web Vitals 趋势 |
| GET  | `/api/analytics/page-performance` | 页面加载排行    |
| GET  | `/api/analytics/errors`           | 错误聚合列表    |
| GET  | `/api/analytics/errors/:message`  | 错误详情        |

完整的接口文档请访问 Swagger UI：`http://localhost:3001/api/docs`

---

## 项目脚本

| 命令           | 说明                            |
| -------------- | ------------------------------- |
| `pnpm install` | 安装所有依赖                    |
| `pnpm dev`     | 启动所有包的开发模式            |
| `pnpm build`   | 构建所有包                      |
| `pnpm lint`    | 运行所有包的 lint 检查          |
| `pnpm test`    | 运行所有包的测试                |
| `pnpm format`  | 格式化代码                      |
| `pnpm clean`   | 清理所有构建产物和 node_modules |

---

## 数据库

### 表结构

| 表名              | 说明                                                             |
| ----------------- | ---------------------------------------------------------------- |
| `users`           | 看板用户（email、密码哈希、昵称）                                |
| `projects`        | 项目（名称、appId、appSecret、域名白名单、数据保留天数）         |
| `project_members` | 项目成员关联（用户、项目、角色）                                 |
| `events`          | 事件主表（事件名、属性 JSONB、时间戳、会话、用户、页面、设备等） |

### 索引

- `events.timestamp` — 时间范围查询
- `events.project_id + event_name` — 按项目按事件聚合
- `events.project_id + timestamp` — 按项目时间范围查询

### 数据保留

每个项目可配置 `dataRetentionDays`（默认 90 天），系统每天凌晨 2:00 自动清理过期数据，采用分批删除（每批 1000 条）避免锁表。

---

## License

MIT
