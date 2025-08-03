# 🧪 TempMailHub 测试指南

## 🚀 快速开始

### 方式1：Cloudflare Workers 本地测试（唯一推荐方式）

```bash
# 安装依赖
npm install

# 启动 Wrangler 开发服务器
npm run dev

# 访问测试地址
open http://localhost:8787
```

### 方式2：部署后测试

```bash
# 部署到 Cloudflare Workers
npm run deploy:cloudflare

# 或部署到 Vercel  
npm run deploy:vercel
```

## 📋 API 测试用例

### 1. 健康检查

```bash
curl http://localhost:8787/health
```

期望响应：
```json
{
  "success": true,
  "message": "TempMailHub is running",
  "data": {
    "version": "1.0.0",
    "status": "healthy"
  },
  "timestamp": "2025-08-02T10:22:28.052Z"
}
```

### 2. API 信息

```bash
curl http://localhost:8787/api/info
```

### 3. 创建临时邮箱

#### MinMail 渠道
```bash
curl -X POST http://localhost:8787/api/mail/create \
  -H "Content-Type: application/json" \
  -d '{"provider": "minmail"}'
```

#### TempMail Plus 渠道
```bash
curl -X POST http://localhost:8787/api/mail/create \
  -H "Content-Type: application/json" \
  -d '{"provider": "tempmailplus", "domain": "mailto.plus"}'
```
**优势：** TempMail Plus 支持9个域名，是唯一支持用户自定义域名选择的提供者！

#### Mail.tm 渠道
```bash
curl -X POST http://localhost:8787/api/mail/create \
  -H "Content-Type: application/json" \
  -d '{"provider": "mailtm"}'
```
**注意：** Mail.tm 只有一个固定域名，不支持自定义域名。

#### EtempMail 渠道
```bash
curl -X POST http://localhost:8787/api/mail/create \
  -H "Content-Type: application/json" \
  -d '{"provider": "etempmail"}'
```
**注意：** EtempMail 支持4个教育域名，可以通过 `domain` 参数指定：ohm.edu.pl, cross.edu.pl, usa.edu.pl, beta.edu.pl。

#### VanishPost 渠道
```bash
curl -X POST http://localhost:8787/api/mail/create \
  -H "Content-Type: application/json" \
  -d '{"provider": "vanishpost"}'
```
**注意：** VanishPost 域名由服务端分配，不支持用户自定义。

### 4. 获取邮件列表

```bash
# 使用上一步创建的邮箱地址
curl "http://localhost:8787/api/mail/your-email@domain.com/emails?limit=10"
```

### 5. 获取邮件详情

```bash
curl "http://localhost:8787/api/mail/your-email@domain.com/emails/email-id"
```

### 6. 验证邮箱

```bash
curl "http://localhost:8787/api/mail/your-email@domain.com/verify"
```

### 7. 提供者状态

```bash
# 健康状态
curl http://localhost:8787/api/mail/providers/health

# 统计信息
curl http://localhost:8787/api/mail/providers/stats
```

## 🔧 自动测试脚本

```bash
# 给测试脚本执行权限
chmod +x test-api.sh

# 运行自动测试
./test-api.sh
```

## 🐛 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   # 查找占用端口的进程
   lsof -i :8787
   
   # 终止进程
   kill -9 <PID>
   ```

2. **依赖安装失败**
   ```bash
   # 清理缓存重新安装
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **TypeScript 编译错误**
   ```bash
   # 检查类型错误
   npx tsc --noEmit
   ```

### 调试模式

```bash
# 启用详细日志
DEBUG=* npm run dev

# 或查看 Wrangler 日志
npx wrangler tail
```

## 📊 性能测试

### 并发测试

```bash
# 使用 ApacheBench 进行压力测试
ab -n 100 -c 10 http://localhost:8787/health

# 使用 curl 进行简单并发测试
for i in {1..10}; do
  curl -s http://localhost:8787/api/info &
done
wait
```

### 延迟测试

```bash
# 测试API响应时间
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:8787/health
```

创建 `curl-format.txt`：
```
     time_namelookup:  %{time_namelookup}\n
        time_connect:  %{time_connect}\n
     time_appconnect:  %{time_appconnect}\n
    time_pretransfer:  %{time_pretransfer}\n
       time_redirect:  %{time_redirect}\n
  time_starttransfer:  %{time_starttransfer}\n
                     ----------\n
          time_total:  %{time_total}\n
```

## 🌐 浏览器测试

### 手动测试

1. 打开浏览器访问 `http://localhost:8787`
2. 查看主页显示
3. 访问 `http://localhost:8787/api/info` 查看JSON响应
4. 使用浏览器开发者工具测试POST请求

### 使用 Postman

导入以下请求集合到 Postman：

```json
{
  "info": {
    "name": "TempMailHub API",
    "description": "临时邮件网关API测试集合"
  },
  "item": [
    {
      "name": "健康检查",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/health"
      }
    },
    {
      "name": "创建邮箱",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/api/mail/create",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "raw": "{\"provider\": \"minmail\"}"
        }
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:8787"
    }
  ]
}
```

## ✅ 测试检查清单

- [ ] 基础功能
  - [ ] 服务启动正常
  - [ ] 健康检查响应
  - [ ] API信息显示
  
- [ ] 邮箱创建
  - [ ] MinMail 渠道
  - [ ] TempMail Plus 渠道  
  - [ ] Mail.tm 渠道
  - [ ] EtempMail 渠道
  - [ ] VanishPost 渠道
  
- [ ] 邮件操作
  - [ ] 获取邮件列表
  - [ ] 获取邮件详情
  - [ ] 邮箱验证
  
- [ ] 系统监控
  - [ ] 提供者健康状态
  - [ ] 统计信息

- [ ] 错误处理
  - [ ] 无效请求处理
  - [ ] 网络错误处理  
  - [ ] 限流处理

## 🚀 部署测试

### Cloudflare Workers

```bash
# 部署
wrangler deploy

# 测试生产环境
curl https://your-worker.your-subdomain.workers.dev/health
```

### Vercel

```bash
# 部署
vercel --prod

# 测试
curl https://your-project.vercel.app/health
```

### Deno Deploy

```bash
# 部署
deno deploy --project=your-project src/index.ts

# 测试
curl https://your-project.deno.dev/health
``` 