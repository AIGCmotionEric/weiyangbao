# 喂养宝 - 应用研发规范

## 应用概览

喂养宝是一款帮助家长记录宝宝喂养情况和生长发育的 Web 应用，支持 H5 手机端和桌面端自适应。

## 技术栈

- 前端：React 19 + TypeScript + Tailwind CSS
- 后端：NestJS 10 + Drizzle ORM + PostgreSQL
- 图表：ReactECharts

## 页面模块

| 页面 | 路由 | 说明 |
|------|------|------|
| 首页概览 | `/` | 今日喂养统计、最近记录、快速入口 |
| 喂养记录 | `/feeding` | 喂养记录列表、筛选、新增 |
| 生长记录 | `/growth` | 身高体重列表、趋势图、新增 |
| 宝宝档案 | `/baby` | 宝宝信息管理 |

## 数据模型

### baby（宝宝表）
- id (uuid)
- name (varchar) - 宝宝姓名
- gender (varchar) - 性别：boy/girl
- birthday (date) - 出生日期
- avatar (varchar) - 头像 URL（可选）

### feeding_record（喂养记录表）
- id (uuid)
- babyId (uuid) - 关联宝宝
- type (varchar) - 类型：breast_milk/formula/solid_food
- amount (numeric) - 量（ml 或 g）
- feedingTime (timestamptz) - 喂养时间
- note (text) - 备注（可选）

### growth_record（生长记录表）
- id (uuid)
- babyId (uuid) - 关联宝宝
- height (numeric) - 身高（cm）
- weight (numeric) - 体重（kg）
- measureDate (date) - 测量日期
- note (text) - 备注（可选）

## 设计规范

### 色彩系统

- 主色：温暖柔和的粉色/桃色系，适合母婴应用
  - primary: `hsl(340, 75%, 65%)` - 主粉色
  - primary-foreground: `hsl(0, 0%, 100%)`
- 辅助色：
  - secondary: `hsl(200, 70%, 85%)` - 淡蓝色
  - accent: `hsl(45, 90%, 65%)` - 暖黄色
- 中性色：
  - background: `hsl(30, 40%, 98%)` - 米白背景
  - card: `hsl(0, 0%, 100%)`
  - muted: `hsl(30, 15%, 95%)`
  - muted-foreground: `hsl(30, 10%, 45%)`
  - border: `hsl(30, 15%, 90%)`
  - foreground: `hsl(30, 20%, 20%)`

### 排版

- 字体大小层级：
  - text-xs (12px)
  - text-sm (14px)
  - text-base (16px)
  - text-lg (18px)
  - text-xl (20px)
  - text-2xl (24px)
  - text-3xl (30px)
- 行高：leading-tight / leading-normal / leading-relaxed
- 字重：font-normal / font-medium / font-semibold / font-bold

### 间距与布局

- 基础间距单位：4px（1 单位）
- 常用间距：space-2(8px) / space-3(12px) / space-4(16px) / space-6(24px) / space-8(32px)
- 内容最大宽度：max-w-md（移动端优先，桌面端居中）
- 页面内边距：px-4 py-6
- 卡片圆角：rounded-xl
- 卡片内边距：p-4

### 设计风格

- 温馨、柔和、圆润
- 卡片式布局，大量留白
- 移动端优先，底部导航栏
- 桌面端：侧边导航 + 居中内容区（max-w-2xl）
- 按钮使用圆角 pill 风格（rounded-full）
- 图标使用 lucide-react

### 底部导航（移动端）

- 首页（首页图标）
- 喂养（奶瓶图标）
- 生长（图表图标）
- 我的（宝宝头像图标）

## MonetGate 商业化 SDK

### 后台配置

- appId: `cp_gfohtjofl3680pfme9ohojx3`
- apiBase: `https://treated-home-wires-precipitation.trycloudflare.com`

### 商品配置

| 字段 | 值 |
|------|----|
| 商品名称 | 终身会员 |
| 商品类型 | 永久型（一次性） |
| 价格 | 0.01 元 |
| 货币 | CNY 人民币 |
| 权益 feature key | `1234567890` |
| 状态 | 上架 |

### 集成方式

- SDK 动态加载：`client/src/utils/monetgate.ts`
- SDK 初始化在 `app.tsx`，通过 `protectedRoutes` 配置受保护路由（`/feeding`、`/growth`）
- **路由守卫由 SDK 内置**：init 时传入 protectedRoutes，SDK 自动监听路由变化，拦截时触发 `monetgate:paywall:show` 自定义事件
- 应用侧监听 `monetgate:paywall:show` 事件，调用 `openPaywall()` 展示 SDK 原生付费墙弹窗
- **权益校验**：使用 `mg.check({ feature: '1234567890' })`，feature 参数即后台配置的权益 key
- **付费墙弹窗**：SDK 原生渲染，产品信息通过 `paywall({ products })` 传入
- 禁止自行实现路由守卫逻辑或自定义付费墙 UI
