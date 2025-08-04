# TempMailHub

一个基于 Hono 框架的多平台临时邮件网关服务，聚合多个临时邮箱服务商，提供统一的 API 接口。

## 🌟 功能特性

- 🔗 **多服务商聚合**: 集成 MinMail、TempMail Plus、Mail.tm、EtempMail、VanishPost 等多个临时邮箱服务
- 🌍 **多平台部署**: 支持 Cloudflare Workers、Deno、Vercel、Node.js 等多种部署平台
- 🔐 **双层认证**: TempMailHub API Key + Provider AccessToken 保障安全
- 🔄 **智能重试**: 内置重试机制和错误处理
- 📊 **健康监控**: 实时监控各渠道状态和统计信息
- 🛡️ **类型安全**: 完整的 TypeScript 类型定义

## 🚀 快速开始

### 环境要求

- Node.js 18+ 或 Deno 1.30+ 或 Bun 1.0+

### 安装与启动

```bash
# 安装依赖
npm install

# 启动开发服务器（推荐 Cloudflare Workers）
npm run dev

# 访问服务
open http://localhost:8787
```

### 🔐 安全配置（可选）

设置 API Key 以启用认证保护：

```bash
# 本地开发
export TEMPMAILHUB_API_KEY="your-secret-api-key"

# 或创建 .env 文件
echo "TEMPMAILHUB_API_KEY=your-secret-api-key" > .env
```

**认证效果**：
- 🔓 未设置：所有端点公开访问
- 🔒 已设置：核心邮件操作需要 Bearer Token 认证

## 📖 文档

| 文档 | 内容 |
|------|------|
| [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) | 📚 **完整API文档** - 接口说明、使用示例、测试方法 |
| [API_SECURITY.md](./API_SECURITY.md) | 🔐 **安全配置** - API Key 认证详细配置 |

## 🎯 支持的服务商

| 服务商 | 域名数量 | 需要 AccessToken | 域名自定义 | 特性 |
|-------|---------|----------------|-----------|------|
| **MinMail** | 1个 | ❌ | ❌ | 自动过期、高可用 |
| **TempMail Plus** | 9个 | ❌ | ✅ | 最多域名选择 |
| **Mail.tm** | 1个 | ✅ | ❌ | 创建时返回 accessToken |
| **EtempMail** | 4个 | ❌ | ✅ | 教育域名 |
| **VanishPost** | 动态 | ❌ | ❌ | 15分钟自动过期 |

## 📋 基本 API 使用

### 1. 创建邮箱

```bash
curl -X POST http://localhost:8787/api/mail/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{"provider": "mailtm"}'
```

### 2. 获取邮件

```bash
curl -X POST http://localhost:8787/api/mail/list \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "address": "user@somoj.com",
    "accessToken": "provider_token"
  }'
```

> 💡 **提示**: 详细的 API 使用说明、参数介绍、错误处理请查看 [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## 🚀 部署

### Cloudflare Workers

```bash
# 设置 API Key（可选）
wrangler secret put TEMPMAILHUB_API_KEY

# 部署
npm run deploy:cloudflare
```

### Vercel

```bash
# 设置环境变量（可选）
vercel env add TEMPMAILHUB_API_KEY

# 部署
npm run deploy:vercel
```

### Deno Deploy

```bash
deno deploy --project=your-project src/index.ts
```

## 🏗️ 项目架构

```
TempMailHub/
├── src/
│   ├── providers/         # 邮件服务商适配器
│   ├── services/          # 业务逻辑层
│   ├── middleware/        # 认证中间件
│   ├── types/             # TypeScript 类型定义
│   └── index.ts           # 应用入口
├── API_DOCUMENTATION.md   # 完整API文档
├── API_SECURITY.md        # 安全配置文档
└── README.md              # 项目说明
```

### 核心组件

- **Provider 适配器**: 统一不同服务商的 API 接口
- **双层认证**: TempMailHub API Key + Provider AccessToken
- **服务层**: 统一业务逻辑和错误处理
- **类型安全**: 完整的 TypeScript 支持

## 🔧 开发

### 添加新服务商

1. 在 `src/providers/` 创建适配器文件
2. 实现 `IMailProvider` 接口
3. 在 `src/providers/index.ts` 注册服务商

### 测试

```bash
# 运行测试
npm test

### 构建

```bash
npm run build
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目基于 MIT 许可证开源 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

### 技术框架
- [Hono](https://hono.dev/) - 轻量级 Web 框架

### 临时邮箱服务提供商
本项目感谢以下优秀的临时邮箱服务提供商：

- [MinMail](https://minmail.app/) - 自动过期、高可用的临时邮箱服务
- [TempMail Plus](https://tempmail.plus/) - 支持多域名选择的临时邮箱服务  
- [Mail.tm](https://mail.tm/) - 稳定可靠的临时邮箱API服务
- [EtempMail](https://etempmail.com/) - 提供教育域名的临时邮箱服务
- [VanishPost](https://vanishpost.com/) - 15分钟自动过期的临时邮箱服务

> **⚠️ 重要说明**: 
> 
> 本项目 **TempMailHub** 仅提供 **API 聚合服务**，不提供 Web UI 界面。
> 
> 如需**图形界面体验**，请直接访问上述各供应商的官方网站。

---

**注意**: 本项目仅供学习和测试使用，请遵守各服务商的使用条款和法律法规。 