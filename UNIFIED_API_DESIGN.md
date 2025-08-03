# 统一邮件获取接口设计

## 设计理念

为了简化用户对接，设计统一的邮件获取接口，用户只需要传递：
- `address`: 邮箱地址  
- `provider`: 提供商名称（可选，系统可自动推断）
- `accessToken`: 访问令牌（可选，有些提供商需要）

各提供商内部自行处理认证逻辑，用户无需关心具体的认证机制差异。

## API 接口

### 1. 创建邮箱

**POST** `/mail/create`

```json
{
  "provider": "mailtm",  // 可选
  "prefix": "test123",   // 可选
  "expirationMinutes": 1440  // 可选
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "address": "test123@somoj.com",
    "domain": "somoj.com", 
    "username": "test123",
    "provider": "mailtm",
    "accessToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9...",  // 重要：保存此token
    "expiresAt": "2025-08-10T07:19:38.098Z"
  },
  "timestamp": "2025-08-03T07:19:38.098Z",
  "provider": "mailtm"
}
```

### 2. 获取邮件列表

**POST** `/mail/list`

**Request Body**:
```json
{
  "address": "test123@somoj.com",
  "provider": "mailtm",  // 可选，系统可自动推断
  "accessToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9...",  // 可选
  "limit": 20,           // 可选，默认20
  "offset": 0,           // 可选，默认0  
  "unreadOnly": false,   // 可选，默认false
  "since": "2025-08-03T00:00:00.000Z"  // 可选，ISO日期格式
}
```

**两种认证方式**:

**方式1: Request Body**
```json
{
  "address": "test123@somoj.com",
  "accessToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9...",
  "provider": "mailtm"
}
```

**方式2: Authorization Header**
```json
// Headers: Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9...
{
  "address": "test123@somoj.com", 
  "provider": "mailtm"
}
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "msg123",
      "from": {
        "email": "sender@example.com",
        "name": "Sender Name"
      },
      "to": [
        {
          "email": "test123@somoj.com"
        }
      ],
      "subject": "Welcome Email",
      "textContent": "Welcome to our service...",  // ⚠️ 注意：这是邮件摘要，不是完整内容
      "receivedAt": "2025-08-03T07:25:00.000Z",
      "isRead": false,
      "provider": "mailtm"
    }
  ],
  "timestamp": "2025-08-03T07:30:00.000Z",
  "provider": "mailtm"
}
```

> **📝 重要说明**：
> - **邮件列表接口**返回的 `textContent` 是邮件摘要/预览
> - **要获取完整邮件内容**，请使用邮件详情接口
> - 这样设计是为了提升列表加载性能

### 3. 获取邮件详情

**POST** `/mail/content`

> **📧 获取完整邮件内容**：包含完整的文本和HTML内容

**Request Body**:
```json
{
  "address": "test123@somoj.com",
  "id": "msg123",  // 邮件ID
  "provider": "mailtm",  // 可选
  "accessToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9..."  // 可选
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "msg123",
    "from": {
      "email": "sender@example.com",
      "name": "Sender Name"
    },
    "to": [
      {
        "email": "test123@somoj.com"
      }
    ],
    "subject": "Welcome Email",
    "textContent": "完整的邮件文本内容...",  // ✅ 完整内容
    "htmlContent": "<html><body>完整的HTML内容...</body></html>",  // ✅ 完整HTML
    "receivedAt": "2025-08-03T07:25:00.000Z",
    "isRead": false,
    "provider": "mailtm"
  },
  "timestamp": "2025-08-03T07:30:00.000Z",
  "provider": "mailtm"
}
```

**示例**:
```json
POST /mail/content
{
  "address": "kjy6x9z0oy@somoj.com",
  "id": "688f18ed4d546e573420bf6c", 
  "accessToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9...",
  "provider": "mailtm"
}
```

## 提供商认证机制对比

| 提供商 | 认证类型 | 说明 |
|-------|---------|------|
| **mailtm** | Bearer Token | 需要accessToken，在创建邮箱时返回 |
| **minmail** | Visitor ID | 无需accessToken，内部使用visitor-id header |
| **tempmailplus** | 无认证 | 完全无需认证 |
| **etempmail** | 无认证 | 完全无需认证 |
| **vanishpost** | Session | 使用cookies管理会话 |

## 设计优势

### 1. **用户友好**
- 统一接口，无需关心具体provider差异
- accessToken参数可选，按需使用
- 支持两种认证方式（query参数和header）

### 2. **扩展性强**  
- 新增provider只需实现标准接口
- provider内部自主处理认证逻辑
- 认证机制变更不影响统一接口

### 3. **向后兼容**
- 现有provider实现无需大幅修改
- 支持自动provider推断
- 保持原有功能完整性

## 使用示例

### JavaScript/Node.js

```javascript
// 1. 创建邮箱
const createResponse = await fetch('/mail/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ provider: 'mailtm' })
});
const { data } = await createResponse.json();
const { address, accessToken } = data;

// 2. 获取邮件列表
const emailsResponse = await fetch('/mail/list', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    address,
    accessToken,
    limit: 20
  })
});
const emails = await emailsResponse.json();

// 3. 获取邮件详情（完整内容）
const emailDetailResponse = await fetch('/mail/content', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    address,
    id: emails.data[0].id,  // 从列表中获取邮件ID
    accessToken,
    provider: 'mailtm'
  })
});
const emailDetail = await emailDetailResponse.json();

console.log('邮件摘要:', emails.data[0].textContent);      // 来自列表接口的摘要
console.log('完整内容:', emailDetail.data.textContent);   // 来自详情接口的完整内容
```

### Python

```python
import requests

# 1. 创建邮箱
response = requests.post('/mail/create', json={'provider': 'mailtm'})
data = response.json()['data']
address, access_token = data['address'], data['accessToken']

# 2. 获取邮件列表  
emails_response = requests.post('/mail/list', json={
    'address': address,
    'accessToken': access_token,
    'limit': 20
})
emails = emails_response.json()

# 3. 获取邮件详情（完整内容）
email_detail = requests.post('/mail/content', json={
    'address': address,
    'id': emails['data'][0]['id'],  # 从列表中获取邮件ID
    'accessToken': access_token,
    'provider': 'mailtm'
})

print('邮件摘要:', emails['data'][0]['textContent'])      # 来自列表接口的摘要
print('完整内容:', email_detail.json()['data']['textContent'])  # 来自详情接口的完整内容
```

## 错误处理

### 认证相关错误

```json
{
  "success": false,
  "error": "No authentication token provided. Please provide accessToken parameter or ensure email was created through this service.",
  "timestamp": "2025-08-03T07:30:00.000Z",
  "provider": "mailtm"
}
```

### Provider不支持错误

```json
{
  "success": false,
  "error": "No available email provider found",
  "timestamp": "2025-08-03T07:30:00.000Z"
}
```

## 实现细节

### Provider接口更新

```typescript
interface IMailProvider {
  // 获取邮件列表 - accessToken通过query对象传递
  getEmails(query: EmailListQuery): Promise<ChannelResponse<EmailMessage[]>>;
  
  // 获取邮件详情 - accessToken作为可选参数
  getEmailContent(
    emailAddress: string, 
    emailId: string, 
    accessToken?: string
  ): Promise<ChannelResponse<EmailMessage>>;
}
```

### EmailListQuery更新

```typescript
interface EmailListQuery {
  address: string;
  provider?: string;
  accessToken?: string;  // 新增：可选的访问令牌
  limit?: number;
  offset?: number;
  since?: Date;
  unreadOnly?: boolean;
}
```

这种设计既保持了接口的简洁性，又给了各provider足够的灵活性来处理自己的认证逻辑。 