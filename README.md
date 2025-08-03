# TempMailHub

一个基于 Hono 框架的多平台临时邮件网关服务，聚合多个临时邮箱服务商，提供统一的 API 接口。

## 🌟 功能特性

- 🔗 **多服务商聚合**: 集成 MinMail、TempMail Plus、Mail.tm、EtempMail、VanishPost 等多个临时邮箱服务
- 🌍 **多平台部署**: 支持 Cloudflare Workers、Deno、Vercel、Node.js 等多种部署平台
- ⚙️ **动态配置**: 支持渠道的动态启用/禁用和优先级调整
- 🔄 **智能重试**: 内置重试机制和错误处理
- 📊 **健康监控**: 实时监控各渠道状态和统计信息
- 🛡️ **类型安全**: 完整的 TypeScript 类型定义

## 🚀 快速开始

### 环境要求

- Node.js 18+ 或 Deno 1.30+ 或 Bun 1.0+

### 安装依赖

```bash
npm install
# 或
yarn install
# 或
pnpm install
```

### 本地开发

```bash
# Node.js
npm run dev:node

# Deno
npm run dev:deno

# Bun
npm run dev:bun

# Cloudflare Workers
npm run dev
```

### 部署

#### Cloudflare Workers

```bash
npm run deploy:cloudflare
```

#### Vercel

```bash
npm run deploy:vercel
```

#### Deno Deploy

```bash
deno deploy --project=your-project src/index.ts
```

## 📋 API 接口

### 创建临时邮箱

```http
POST /api/mail/create
Content-Type: application/json

{
  "provider": "minmail",           // 可选，指定服务商
  "domain": "atminmail.com",       // 可选，指定域名
  "prefix": "custom",              // 可选，自定义前缀
  "expirationMinutes": 60          // 可选，过期时间（分钟）
}
```

### 获取邮件列表

```http
GET /api/mail/:address/emails?limit=20&offset=0&unread=true&since=2024-01-01T00:00:00Z
```

### 获取邮件详情

```http
GET /api/mail/:address/emails/:emailId
```

### 验证邮箱

```http
GET /api/mail/:address/verify
```

### 健康检查

```http
GET /api/mail/providers/health
```

### 统计信息

```http
GET /api/mail/providers/stats
```

## 🎯 支持的服务商

| 服务商 | 域名示例 | 特性 |
|--------|----------|------|
| MinMail | atminmail.com | 自动过期、高可用 |
| TempMail Plus | mailto.plus, fexpost.com | 多域名支持 |
| Mail.tm | somoj.com | 需要注册、API 稳定 |
| EtempMail | ohm.edu.pl, cross.edu.pl, usa.edu.pl, beta.edu.pl | 教育域名，支持指定域名 |
| VanishPost | genmacos.com | 15分钟自动过期 |

## ⚙️ 配置

### 环境变量配置

```bash
# 服务器配置
PORT=8080
HOST=0.0.0.0

# 安全配置
API_KEY=your-api-key

# 渠道启用状态
CHANNEL_MINMAIL_ENABLED=true
CHANNEL_TEMPMAILPLUS_ENABLED=true
CHANNEL_MAILTM_ENABLED=true
CHANNEL_ETEMPMAIL_ENABLED=false
CHANNEL_VANISHPOST_ENABLED=true
```

### 渠道配置

项目支持动态配置各个渠道的优先级、超时时间、重试次数等参数。

```typescript
// src/config/index.ts
export const defaultConfig = {
  channels: {
    minmail: {
      enabled: true,
      priority: 1,           // 优先级（数字越小优先级越高）
      timeout: 10000,        // 请求超时时间（毫秒）
      retries: 2,            // 重试次数
      rateLimit: {
        requests: 30,        // 请求数量
        window: 60           // 时间窗口（秒）
      }
    }
    // ... 其他渠道配置
  }
};
```

## 🏗️ 项目架构

```
TempMailHub/
├── src/
│   ├── types/              # 类型定义
│   ├── interfaces/         # 接口定义
│   ├── config/            # 配置管理
│   ├── providers/         # 渠道适配器
│   ├── services/          # 业务逻辑
│   ├── routes/            # 路由处理
│   ├── utils/             # 工具函数
│   └── index.ts           # 应用入口
├── wrangler.toml          # Cloudflare Workers 配置
├── vercel.json            # Vercel 配置
└── README.md
```

### 核心组件

- **Provider 适配器**: 统一不同服务商的 API 接口
- **配置管理器**: 动态配置和渠道管理
- **服务层**: 业务逻辑和错误处理
- **路由层**: HTTP 请求处理

## 🔧 开发指南

### 添加新的服务商

1. 在 `src/providers/` 目录下创建新的适配器
2. 实现 `IMailProvider` 接口
3. 在 `src/providers/index.ts` 中注册新服务商
4. 更新配置文件添加相关配置

### 自定义中间件

项目基于 Hono 框架，支持添加自定义中间件：

```typescript
// 添加 CORS 中间件
app.use('*', cors());

// 添加日志中间件
app.use('*', logger());

// 添加认证中间件
app.use('/api/*', async (c, next) => {
  // 认证逻辑
  await next();
});
```

## 🧪 测试

```bash
# 运行测试
npm test

# 运行测试并生成覆盖率报告
npm run test:coverage

# 测试单个提供者
npm run test -- providers/minmail.test.ts
```

## 📦 构建

```bash
npm run build
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本项目
2. 创建新的功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目基于 MIT 许可证开源 - 查看 [LICENSE](LICENSE) 文件了解更多详情。

## 🙏 致谢

- [Hono](https://hono.dev/) - 轻量级 Web 框架
- 各临时邮箱服务提供商的 API

## 📞 联系方式

- 项目主页: https://github.com/your-username/tempmailhub
- 问题反馈: https://github.com/your-username/tempmailhub/issues

---

**注意**: 本项目仅供学习和测试使用，请遵守各服务商的使用条款和法律法规。 