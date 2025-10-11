# Binance Alpha Tool - Architecture Documentation

## 项目概述 / Project Overview

Binance Alpha Tool 是一个专为 Binance Alpha 项目设计的综合性数据分析和管理平台。

**核心价值 / Core Values:**
- 📊 数据可视化 / Data Visualization
- 🎮 游戏化用户界面 / Gamified User Interface
- 🔧 Web 管理界面 / Web Management Interface
- 🔒 类型安全 / Type Safety
- ⚡ 高性能优化 / Performance Optimization
- 📱 移动端优先 / Mobile-First Design

**技术栈 / Technology Stack:**
```
Framework:     Next.js 15 (App Router)
Database:      Prisma + SQLite (可迁移至 PostgreSQL)
UI:            TailwindCSS 4 + shadcn/ui
State:         Zustand (持久化)
Data Fetching: TanStack Query (React Query)
Tables:        TanStack Table v8
Animations:    Framer Motion
Validation:    Zod
Language:      TypeScript (Strict Mode)
```

---

## 架构设计 / Architecture Design

### 1. 分层架构 / Layered Architecture

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│  (Pages, Components, UI)                │
├─────────────────────────────────────────┤
│         API Layer                       │
│  (REST API, Route Handlers)             │
├─────────────────────────────────────────┤
│         Business Logic Layer            │
│  (Services, Hooks, Stores)              │
├─────────────────────────────────────────┤
│         Data Access Layer               │
│  (Prisma ORM, Database)                 │
└─────────────────────────────────────────┘
```

### 2. 文件结构 / File Structure

```
binance-alpha-tool/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── airdrops/            # Airdrop CRUD APIs
│   │   │   ├── route.ts         # List & Create
│   │   │   ├── [id]/route.ts    # Get, Update, Delete
│   │   │   ├── import/route.ts  # Batch Import
│   │   │   └── export/route.ts  # Export to JSON
│   │   └── binance/             # Binance Integration
│   │       └── alpha/
│   │           ├── projects/route.ts    # Live Projects Data
│   │           └── stability/route.ts   # Stability Analysis
│   ├── calculator/              # BNB Calculator Page
│   ├── stability/               # Stability Dashboard
│   ├── calendar/                # Income Calendar
│   ├── settings/                # Settings Page
│   ├── layout.tsx               # Root Layout
│   └── page.tsx                 # Home Page
├── components/
│   ├── features/                # Feature Components
│   │   ├── calculator/
│   │   │   └── unified-calculator.tsx
│   │   ├── stability/
│   │   │   └── enhanced-stability-table.tsx
│   │   ├── data-table/
│   │   │   └── advanced-data-table.tsx   # 通用数据表格
│   │   ├── airdrops/
│   │   └── calendar/
│   ├── layout/                  # Layout Components
│   │   ├── navigation.tsx
│   │   └── language-switcher.tsx
│   └── ui/                      # UI Primitives
│       ├── button.tsx
│       ├── card.tsx
│       └── ...
├── lib/
│   ├── api/                     # API Clients
│   │   └── binance-client.ts
│   ├── stores/                  # Zustand Stores
│   │   ├── settings-store.ts
│   │   ├── language-store.ts
│   │   └── user-store.ts
│   ├── hooks/                   # Custom Hooks
│   │   ├── use-toast.ts
│   │   └── use-query.ts
│   ├── providers/               # React Providers
│   │   ├── theme-provider.tsx
│   │   └── query-provider.tsx
│   ├── types/                   # TypeScript Types
│   └── utils/                   # Utility Functions
├── prisma/
│   └── schema.prisma            # Database Schema
├── scripts/
│   ├── db-import.ts             # 数据导入脚本
│   ├── db-export.ts             # 数据导出脚本
│   └── db-list-backups.ts       # 列出备份文件
├── data/
│   └── backups/                 # 数据备份目录
└── public/                      # 静态资源
```

---

## API 设计 / API Design

### 1. 统一响应格式 / Unified Response Format

```typescript
// 成功响应 / Success Response
interface SuccessResponse<T> {
  success: true;
  data: T;
  count?: number;
  timestamp?: string;
  message?: string;
}

// 错误响应 / Error Response
interface ErrorResponse {
  success: false;
  error: string;
  message?: string;
  details?: any;
}
```

### 2. API 端点设计 / API Endpoints

#### Airdrop API
```typescript
// 公共端点 / Public Endpoints
GET    /api/airdrops              # 获取所有空投
GET    /api/airdrops/[id]         # 获取单个空投
GET    /api/airdrops/export       # 导出数据

// 管理员端点 / Admin Endpoints (需要 x-admin-key)
POST   /api/airdrops              # 创建空投
PUT    /api/airdrops/[id]         # 更新空投
DELETE /api/airdrops/[id]         # 删除空投
POST   /api/airdrops/import       # 批量导入
```

#### Binance Alpha API
```typescript
GET    /api/binance/alpha/projects   # 获取项目列表
GET    /api/binance/alpha/stability  # 获取稳定性分析
```

### 3. 认证机制 / Authentication

```typescript
// 管理员认证 / Admin Authentication
function checkAdminAuth(request: NextRequest): boolean {
  const adminKey = request.headers.get("x-admin-key");
  const envAdminKey = process.env.ADMIN_KEY;
  return adminKey === envAdminKey;
}
```

### 4. 数据验证 / Data Validation

使用 Zod 进行运行时类型验证：

```typescript
const AirdropSchema = z.object({
  token: z.string().min(1).max(20),
  name: z.string().min(1).max(100),
  chain: z.string().min(1),
  multiplier: z.number().int().min(1).max(10),
  status: z.enum(["UPCOMING", "SNAPSHOT", "CLAIMABLE", "ENDED", "CANCELLED"]),
  // ... 更多字段
});
```

---

## 数据库设计 / Database Design

### 1. 核心模型 / Core Models

#### Airdrop Model
```prisma
model Airdrop {
  id              String    @id @default(uuid())
  token           String    @unique        // 唯一标识符
  name            String
  chain           String
  multiplier      Int       @default(1)    // 倍数 (1x, 2x, 4x)
  isBaseline      Boolean   @default(false) // KOGE 基准线

  // 日期信息
  snapshotDate    DateTime?
  claimStartDate  DateTime?
  claimEndDate    DateTime?
  listingDate     DateTime?

  // 积分系统
  requiredPoints  Int?
  pointsPerDay    Int?

  // 状态管理
  status          AirdropStatus
  verified        Boolean
  isActive        Boolean

  // 元数据
  estimatedValue  Float?
  participantCount Int?

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // 索引优化
  @@index([token])
  @@index([status])
  @@index([isActive])
}
```

### 2. 数据完整性约束 / Data Integrity

- ✅ **唯一性约束**: `token` 字段确保不重复
- ✅ **级联删除**: 用户删除时自动删除关联数据
- ✅ **时间戳**: 自动管理 `createdAt` 和 `updatedAt`
- ✅ **索引优化**: 关键字段添加索引提升查询性能

---

## 状态管理 / State Management

### 1. Zustand Stores

```typescript
// Settings Store - 全局设置
interface SettingsStore {
  app: AppSettings;           // 主题、语言、动画
  notifications: NotificationSettings;
  api: APISettings;
  updateAppSettings: (settings: Partial<AppSettings>) => void;
  resetToDefaults: () => void;
}

// User Store - 用户管理
interface UserStore {
  users: User[];
  activeUserId: string | null;
  addUser: (user: User) => void;
  setActiveUser: (id: string) => void;
}

// Filter Store - 过滤器状态
interface FilterStore {
  airdropFilters: AirdropFilters;
  stabilityFilters: StabilityFilters;
  setFilters: (filters: Partial<Filters>) => void;
}
```

### 2. 持久化策略 / Persistence Strategy

```typescript
export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      // ... store implementation
    }),
    {
      name: 'binance-alpha-settings',  // LocalStorage key
    }
  )
);
```

### 3. React Query 配置 / React Query Configuration

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5分钟
      cacheTime: 10 * 60 * 1000,     // 10分钟
      refetchOnWindowFocus: true,
      retry: 3,
    },
  },
});
```

---

## 性能优化 / Performance Optimization

### 1. 代码分割 / Code Splitting

```typescript
// 动态导入重型组件
const ChartComponent = dynamic(() => import('./Chart'), {
  loading: () => <Skeleton />,
  ssr: false
});
```

### 2. 缓存策略 / Caching Strategy

```typescript
// API 缓存层级
Level 1: React Query Cache (内存) - 10分钟
Level 2: Next.js Cache (磁盘) - 自动
Level 3: Browser Cache (浏览器) - 24小时
```

### 3. 优化查询 / Optimized Queries

```typescript
// 智能预取 / Smart Prefetching
queryClient.prefetchQuery({
  queryKey: ['airdrops', 'next-month'],
  queryFn: fetchNextMonthAirdrops,
});

// 并行请求 / Parallel Requests
const results = await Promise.all([
  fetch('/api/airdrops'),
  fetch('/api/stability'),
  fetch('/api/binance/alpha/projects'),
]);
```

### 4. 图像优化 / Image Optimization

```typescript
// 使用 Next.js Image 组件
import Image from 'next/image';

<Image
  src={logoUrl}
  alt={name}
  width={64}
  height={64}
  loading="lazy"
  placeholder="blur"
/>
```

---

## 数据导入导出系统 / Import/Export System

### 1. 导出功能 / Export Function

```typescript
// 自动化导出脚本
pnpm db:export

// 生成文件
data/backups/airdrop-backup-YYYY-MM-DD.json

// 功能特性
- 日期版本控制
- JSON 格式化输出
- 包含所有关联数据
- 自动解析 JSON 字段
```

### 2. 导入功能 / Import Function

```typescript
// 智能导入脚本
pnpm db:import

// 特性
- 自动选择最新备份
- 智能重复检查 (基于 token)
- 详细进度报告
- 错误处理和恢复
```

### 3. 备份管理 / Backup Management

```bash
# 列出所有备份
pnpm db:list-backups

# 输出示例
1. airdrop-backup-2025-10-04.json
   📅 Date: 2025-10-04
   📦 Size: 24.56 KB
   🕒 Modified: 2025-10-04 15:30:25
```

---

## 专业数据表格系统 / Professional Data Table System

### 1. 核心功能 / Core Features

```typescript
<AdvancedDataTable
  data={airdrops}
  columns={columns}
  enableRowSelection={true}      // 行选择
  enableExport={true}            // CSV/JSON 导出
  enableColumnVisibility={true}  // 列显示/隐藏
  searchPlaceholder="搜索..."
  pageSizes={[10, 20, 50, 100]}
/>
```

### 2. 功能特性 / Features

- ✅ **全局搜索**: 跨所有列搜索
- ✅ **列排序**: 点击表头排序
- ✅ **列可见性**: 动态显示/隐藏列
- ✅ **分页**: 可自定义每页行数
- ✅ **行选择**: 多选功能
- ✅ **数据导出**: CSV 和 JSON 格式
- ✅ **响应式**: 移动端适配
- ✅ **动画**: Framer Motion 过渡

### 3. 性能优化 / Performance

```typescript
// 虚拟滚动 (未来实现)
// 懒加载图片
// 防抖搜索 (300ms)
// 优化渲染 (React.memo)
```

---

## UI/UX 设计系统 / UI/UX Design System

### 1. 设计灵感 / Design Inspiration

**Genshin Impact 游戏风格:**
- 🎨 深色主题 + 金色/青色点缀
- ✨ 玻璃态射效果 (Glassmorphism)
- 🌟 流畅的弹簧动画
- 💎 渐变色彩系统
- 🎯 专业级数据可视化

### 2. 主题系统 / Theme System

```typescript
// 深色主题 (默认)
Dark Theme: {
  background: #0a0e27,    // 深海军蓝
  primary: #ffd700,       // 金色
  secondary: #00ced1,     // 青色
  glass: rgba(255,255,255,0.1)
}

// 浅色主题
Light Theme: {
  background: #fafbfc,
  primary: #f97316,       // 橙色
  secondary: #06b6d4,     // 青色
}

// 自动主题
Auto Theme: 跟随系统设置
```

### 3. 动画系统 / Animation System

```typescript
// 动画速度配置
Fast:   150ms
Normal: 300ms (默认)
Slow:   500ms
None:   0ms (无障碍模式)

// Framer Motion 变体
const cardVariants = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 200 }
  },
  hover: { scale: 1.02, y: -5 },
};
```

### 4. 响应式设计 / Responsive Design

```typescript
// 断点系统
Mobile:  < 640px
Tablet:  640px - 1024px
Desktop: > 1024px

// 移动端优化
- 底部导航栏
- 触摸友好按钮 (最小 44px)
- 滑动手势
- 自适应表格布局
```

---

## 安全性 / Security

### 1. 认证和授权 / Authentication & Authorization

```typescript
// 管理员认证
x-admin-key: "your-secure-admin-key"

// 环境变量
ADMIN_KEY="change-in-production"
```

### 2. 输入验证 / Input Validation

```typescript
// Zod 运行时验证
const AirdropSchema = z.object({
  token: z.string().min(1).max(20),
  // ... 严格类型约束
});

// SQL 注入防护 (Prisma ORM)
// XSS 防护 (React 自动转义)
```

### 3. 环境变量管理 / Environment Variables

```env
# .env.local (不要提交到 Git!)
DATABASE_URL="file:./dev.db"
ADMIN_KEY="super-secret-key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 部署架构 / Deployment Architecture

### 1. Vercel 部署 (推荐) / Vercel Deployment

```bash
# 自动部署
git push origin main → Vercel 自动构建

# 环境变量
Dashboard → Settings → Environment Variables

# 数据库迁移
pnpm db:migrate
```

### 2. 性能优化 / Performance Tuning

```typescript
// Next.js 配置
export default {
  images: {
    domains: ['binance.com'],
    formats: ['image/avif', 'image/webp'],
  },
  compress: true,
  poweredByHeader: false,
}
```

### 3. 监控和日志 / Monitoring & Logging

```typescript
// Vercel Analytics
// Error Tracking: Sentry (可选)
// Performance Monitoring: Web Vitals
```

---

## 开发工作流 / Development Workflow

### 1. 本地开发 / Local Development

```bash
# 安装依赖
pnpm install

# 数据库设置
pnpm db:generate
pnpm db:push

# 启动开发服务器
pnpm dev
```

### 2. 数据库操作 / Database Operations

```bash
# Prisma Studio (可视化管理)
pnpm db:studio

# 导入/导出
pnpm db:export
pnpm db:import
pnpm db:list-backups

# 迁移
pnpm db:migrate
```

### 3. 代码质量 / Code Quality

```bash
# 类型检查
tsc --noEmit

# Linting
pnpm lint

# 测试
pnpm test
```

---

## 未来规划 / Future Roadmap

### Phase 1 - 核心功能完善
- [ ] 真实 Binance Alpha API 集成
- [ ] Web Scraping 实现
- [ ] Admin Panel UI 界面
- [ ] 用户认证系统

### Phase 2 - 高级功能
- [ ] WebSocket 实时更新
- [ ] 高级图表分析
- [ ] AI 智能推荐
- [ ] 移动端 App (React Native)

### Phase 3 - 企业级特性
- [ ] PostgreSQL 迁移
- [ ] Redis 缓存层
- [ ] 微服务架构
- [ ] Kubernetes 部署

---

## 技术债务管理 / Technical Debt

### 当前已知问题 / Known Issues
1. Mock data for Binance Alpha API (需要真实 API)
2. SQLite 限制 (生产环境建议 PostgreSQL)
3. 缺少单元测试覆盖
4. 需要更多错误边界

### 优化计划 / Optimization Plan
- 实现 E2E 测试
- 添加性能监控
- 优化 bundle size
- 改进 SEO

---

## 参考资源 / References

### 文档 / Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TanStack Table](https://tanstack.com/table)
- [Framer Motion](https://www.framer.com/motion)

### 社区项目 / Community Projects
- https://bn-alpha-tool.com
- https://new.alphabot.cm/
- https://www.bn-alpha.site
- https://alpha-nu-self.vercel.app/

---

## 贡献指南 / Contributing

欢迎提交 Pull Request 和 Issue！

**开发规范:**
- TypeScript strict mode
- ESLint + Prettier
- Conventional Commits
- 代码审查必须

---

**Built with ❤️ for the Binance Alpha Community**

---

*Last Updated: 2025-10-04*
*Version: 1.0.0*
