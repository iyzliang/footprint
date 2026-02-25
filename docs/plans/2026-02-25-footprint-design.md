# Footprint — 全栈埋点平台设计文档

> 日期：2026-02-25

## 1. 项目总览

Footprint 是一个全栈 TypeScript 数据埋点平台，用于多个 Web 前端项目的数据采集、性能监控、错误监控与可视化分析。

### 核心模块

| 模块 | 说明 |
|------|------|
| **SDK** | 客户端采集，框架无关核心包 + 框架绑定包 |
| **Server** | NestJS 后端，数据接收、存储与查询 |
| **Dashboard** | React 后台看板，数据可视化与项目管理 |

### 技术栈

- 语言：TypeScript（全栈）
- SDK：纯 JS 核心 + React/Vue 绑定
- 后端：NestJS + PostgreSQL
- 前端看板：React + Vite + Ant Design + ECharts
- Monorepo：pnpm workspace + Turborepo

### 项目结构

```
footprint/
├── packages/
│   ├── core/          # @footprint/core SDK
│   ├── react/         # @footprint/react 绑定
│   ├── vue/           # @footprint/vue 绑定
│   ├── server/        # NestJS 后端服务
│   └── dashboard/     # React 后台看板
├── docs/              # 文档
└── package.json       # monorepo 根配置
```

---

## 2. SDK 核心设计（@footprint/core）

### 2.1 初始化与配置

```typescript
import { Footprint } from '@footprint/core'

const fp = Footprint.init({
  appId: 'my-app',
  serverUrl: 'https://fp.example.com/api/collect',
  debug: false,
  plugins: [autoTrack(), webVitals(), errorTrack()],
})
```

### 2.2 核心 API

- **手动埋点** — `fp.track('button_click', { buttonId: 'submit' })`
- **用户标识** — `fp.identify(userId)` 关联匿名 ID 与登录用户
- **全局属性** — `fp.setGlobalProps({ version: '1.2.0' })` 每条事件自动携带

### 2.3 数据上报策略

- **批量上报** — 事件先进内存队列，达到阈值（默认 10 条）或定时（默认 5 秒）批量发送
- **页面关闭兜底** — 使用 `navigator.sendBeacon` 确保离开页面时数据不丢
- **失败重试** — 上报失败的事件暂存 `localStorage`，下次访问时补发

### 2.4 事件数据结构

```typescript
interface TrackEvent {
  eventName: string
  properties: Record<string, any>
  timestamp: number
  sessionId: string          // 30 分钟无活动自动切换
  userId?: string
  anonymousId: string        // 设备级，持久化
  appId: string
  page: { url: string; title: string; referrer: string }
  device: { ua: string; screen: string; language: string }
}
```

### 2.5 插件体系

插件是标准接口，按需注册，独立发布：

| 插件 | 功能 |
|------|------|
| `autoTrack()` | 自动采集 PV/UV、元素点击、页面停留时长 |
| `webVitals()` | 采集 LCP、FID、CLS、TTFB 等 Web Vitals 指标 |
| `errorTrack()` | 捕获 JS 异常、Promise 未捕获、资源加载失败 |

---

## 3. 框架绑定包设计

### 3.1 @footprint/react

通过 `FootprintProvider` 在应用顶层注入实例：

```typescript
<FootprintProvider instance={fp}>
  <App />
</FootprintProvider>
```

提供 Hook 和组件两种方式：

```typescript
// Hook 方式
import { useTrack } from '@footprint/react'

function Button() {
  const track = useTrack()
  return <button onClick={() => track('buy_click', { sku: '123' })}>购买</button>
}

// 组件方式
import { TrackClick } from '@footprint/react'

<TrackClick event="buy_click" props={{ sku: '123' }}>
  <button>购买</button>
</TrackClick>
```

### 3.2 @footprint/vue

通过 Vue 插件注入：

```typescript
app.use(FootprintPlugin, { instance: fp })
```

提供指令和组合式 API 两种方式：

```typescript
// 指令方式
<button v-track:click="{ event: 'buy_click', props: { sku: '123' } }">
  购买
</button>

// 组合式 API
import { useTrack } from '@footprint/vue'

const track = useTrack()
track('buy_click', { sku: '123' })
```

### 3.3 类型安全（可选）

通过模块扩展实现事件名和属性的类型约束：

```typescript
declare module '@footprint/core' {
  interface EventMap {
    buy_click: { sku: string; price: number }
    page_view: { path: string }
  }
}

fp.track('buy_click', { sku: '123', price: 99 }) // ✅ 类型检查通过
fp.track('buy_click', { foo: 'bar' })             // ❌ 类型错误
```

### 3.4 设计原则

- **轻量封装** — 绑定包只做胶水层，核心逻辑全在 `@footprint/core`
- **Tree-shakable** — 未使用的导出不会打包
- **类型安全** — 事件名和属性可通过泛型约束，获得 IDE 提示

---

## 4. Server 端设计（NestJS）

### 4.1 模块划分

```
server/src/
├── collect/        # 数据接收模块
├── auth/           # 认证模块（JWT 登录、用户管理）
├── project/        # 项目模块（CRUD、AppId/AppSecret）
├── analytics/      # 分析模块（聚合查询、趋势、漏斗）
├── event/          # 事件模块（明细查询、筛选）
└── common/         # 公共模块（Guard、拦截器、DTO）
```

### 4.2 数据接收 API

```
POST /api/collect
Content-Type: application/json

{
  "appId": "my-app",
  "events": [ ... ]
}
```

关键设计：

- **轻量校验** — 只验证 appId 合法性和基本字段，快速返回 204
- **异步处理** — 接收后先写入内存队列（Bull Queue），再批量写入 PostgreSQL
- **IP 解析** — 从请求头提取 IP，使用 geoip-lite 解析地理位置（可选）

### 4.3 数据库设计（PostgreSQL）

| 表名 | 说明 |
|------|------|
| `users` | 看板用户（email、密码哈希、昵称） |
| `projects` | 项目（名称、appId、appSecret） |
| `project_members` | 项目成员关联 |
| `events` | 事件主表 |

`events` 表设计要点：

- `properties` 字段使用 JSONB 类型，灵活存储各类事件属性
- 按 `timestamp` 建索引，支持时间范围查询
- 按 `project_id + event_name` 建复合索引，支持按项目按事件聚合
- 后期数据量增长可用 PostgreSQL 表分区（按月分区）

### 4.4 分析查询 API

| 接口 | 说明 |
|------|------|
| `GET /api/analytics/trend` | 事件趋势（按天/小时聚合） |
| `GET /api/analytics/funnel` | 漏斗分析 |
| `GET /api/analytics/top-events` | 热门事件排行 |
| `GET /api/analytics/realtime` | 实时概览（最近 30 分钟） |
| `GET /api/events` | 事件明细列表（分页、筛选） |

---

## 5. Dashboard 看板设计

### 5.1 技术选型

- React + TypeScript
- Vite 构建
- Ant Design UI 组件库
- ECharts 数据可视化
- React Router 路由
- TanStack Query 数据请求与缓存

### 5.2 页面结构

```
登录页
├── 首页（全局概览）
├── 项目管理
│   ├── 项目列表
│   └── 项目设置（AppId/AppSecret、成员管理）
├── 数据分析（按项目）
│   ├── 实时概览 — 当前在线、最近 30 分钟事件量
│   ├── 事件趋势 — 折线图，按天/小时切换，多事件对比
│   ├── 事件排行 — 热门事件 Top N
│   ├── 漏斗分析 — 自定义步骤，查看转化率
│   └── 事件明细 — 表格，按事件名/用户/时间筛选
├── 性能监控（按项目）
│   ├── Web Vitals 趋势 — LCP、FID、CLS 等指标趋势
│   └── 页面加载排行 — 最慢页面 Top N
├── 错误监控（按项目）
│   ├── 错误列表 — 按错误信息聚合，显示出现次数
│   └── 错误详情 — 堆栈信息、影响用户数、首次/最近出现时间
└── 设置
    └── 个人信息、修改密码
```

### 5.3 核心交互

- **时间范围选择器** — 全局组件，支持「今天 / 近 7 天 / 近 30 天 / 自定义」
- **项目切换器** — 顶部导航栏快速切换项目
- **自动刷新** — 实时概览页支持自动轮询（可配置间隔）
- **数据导出** — 事件明细支持导出 CSV

---

## 6. 安全设计

### 6.1 项目接入流程

1. 在 Dashboard 创建项目，系统生成 `appId` + `appSecret`
2. 前端 SDK 只需要 `appId`（公开，用于标识来源）
3. `appSecret` 用于 Server 端 API 调用（查询数据、管理项目）

### 6.2 数据上报鉴权

- **域名白名单** — 每个项目可配置允许上报的域名列表，Server 校验 Origin/Referer
- **频率限制** — 按 IP + appId 做 Rate Limit，防止恶意刷量
- **数据校验** — 事件名长度限制、属性层级深度限制、单次批量上报条数上限

### 6.3 Dashboard API 鉴权

- **JWT Token** — 登录后签发，有效期 7 天，支持刷新
- **接口权限** — NestJS Guard 校验用户是否属于该项目成员

### 6.4 隐私合规

- **匿名 ID** — 默认使用随机 UUID，不采集指纹信息
- **可选字段** — IP 地理位置解析、UA 解析均可在项目设置中关闭
- **数据保留期** — 可配置自动清理策略（如保留 90 天），定时任务清理过期数据

---

## 7. 部署方案

### 7.1 Docker Compose 一键部署

```yaml
services:
  postgres:    # PostgreSQL 数据库
  server:      # NestJS 后端 + 静态托管 Dashboard
```

- Dashboard 构建为静态文件，由 NestJS 直接托管
- 提供 `.env.example` 配置模板

### 7.2 SDK 发布

- `@footprint/core`、`@footprint/react`、`@footprint/vue` 发布到 npm
- 使用 `tsup` 打包，同时输出 ESM 和 CJS
- 提供 CDN 版本（UMD），支持 `<script>` 标签直接引入

---

## 8. 开发工具链

- **pnpm workspace** — 包管理
- **Turborepo** — 任务编排（build、test、lint 并行）
- **TypeScript Project References** — 包之间共享类型
- **Vitest** — 单元测试
- **ESLint + Prettier** — 代码规范
- **Changesets** — SDK 版本管理与发布
- **tsup** — SDK 打包

---

## 9. 开发优先级

| 阶段 | 内容 | 目标 |
|------|------|------|
| **P0** | `@footprint/core` + Server 数据接收 + 基础 Dashboard（事件列表、趋势图） | 跑通完整链路 |
| **P1** | 自动采集插件 + 性能监控 + 错误监控 + 漏斗分析 | 核心功能完整 |
| **P2** | `@footprint/react` + `@footprint/vue` + 项目成员管理 | 框架绑定与协作 |
| **P3** | Docker 部署 + CDN 版本 + 数据导出 + 数据保留策略 | 生产可用 |
