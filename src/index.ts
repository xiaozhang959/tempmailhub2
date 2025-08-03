/**
 * TempMailHub - 临时邮件网关服务
 * 基于 Hono 框架的多平台临时邮箱聚合服务
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { initializeProviders } from './providers/index.js';
import { mailService } from './services/mail-service.js';

// 基础类型定义
interface AppResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
  timestamp: string;
}

// 创建 Hono 应用实例
const app = new Hono();

// 全局中间件
app.use('*', cors());
app.use('*', logger());
app.use('/api/*', prettyJSON());

// 应用初始化状态
let initialized = false;
let initializationPromise: Promise<void> | null = null;

// 初始化函数 - 确保只执行一次，在请求上下文中执行
async function ensureInitialized(): Promise<void> {
  if (initialized) {
    return;
  }
  
  if (initializationPromise) {
    return initializationPromise;
  }
  
  initializationPromise = (async () => {
    try {
      console.log('🚀 Starting TempMailHub initialization...');
      await initializeProviders();
      initialized = true;
      console.log('✅ TempMailHub initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize TempMailHub:', error);
      // 重置状态，允许下次请求重试
      initializationPromise = null;
      throw error;
    }
  })();
  
  return initializationPromise;
}

// 初始化中间件 - 在请求上下文中执行初始化
app.use('/api/*', async (c, next) => {
  if (!initialized) {
    try {
      await ensureInitialized();
    } catch (error) {
      return c.json({
        success: false,
        error: 'Service initialization failed, please try again',
        timestamp: new Date().toISOString()
      }, 503);
    }
  }
  await next();
});

// 主页路由
app.get('/', (c) => {
  return c.text(`
TempMailHub - 临时邮件网关服务

功能特性：
✅ 聚合多个临时邮箱服务
✅ 统一的 API 接口
✅ 多平台部署支持 (Cloudflare Workers, Deno, Vercel, Node.js)
✅ 渠道动态配置和健康检查
✅ 完整的错误处理和重试机制

支持的邮箱服务商：
- MinMail (minmail.app)
- TempMail Plus (tempmail.plus)
- Mail.tm
- EtempMail (etempmail.com)
- VanishPost (vanishpost.com)

API 端点：
- GET /health - 健康检查
- GET /api/info - API 信息
- POST /api/mail/create - 创建临时邮箱
    - POST /api/mail/list - 获取邮件列表
  - POST /api/mail/content - 获取邮件详情
- GET /api/mail/:address/verify - 验证邮箱
- GET /api/mail/providers/health - 提供者健康状态
- POST /api/mail/providers/test-connections - 测试所有提供者连接
- GET /api/mail/providers/stats - 提供者统计信息

项目地址: https://github.com/your-username/tempmailhub
  `);
});

// 健康检查路由
app.get('/health', (c) => {
  const response: AppResponse = {
    success: true,
    message: 'TempMailHub is running',
    data: {
      version: '1.0.0',
      status: initialized ? 'healthy' : 'initializing',
      initialized,
      uptime: typeof globalThis !== 'undefined' && (globalThis as any).process?.uptime ? (globalThis as any).process.uptime() : 0
    },
    timestamp: new Date().toISOString()
  };

  return c.json(response);
});

// API 信息路由
app.get('/api/info', (c) => {
  const response: AppResponse = {
    success: true,
    data: {
      name: 'TempMailHub',
      version: '1.0.0',
      description: 'Temporary email gateway service',
      features: [
        'Multiple provider aggregation',
        'Unified API interface',
        'Multi-platform deployment',
        'Dynamic channel configuration',
        'Health monitoring',
        'Error handling and retry mechanisms'
      ],
      providers: [
        { name: 'MinMail', domains: ['atminmail.com'], customizable: false },
        { name: 'TempMail Plus', domains: ['mailto.plus', 'fexpost.com', 'fexbox.org', 'mailbox.in.ua', 'rover.info', 'chitthi.in', 'fextemp.com', 'any.pink', 'merepost.com'], customizable: true },
        { name: 'Mail.tm', domains: ['somoj.com'], customizable: false },
        { name: 'EtempMail', domains: ['cross.edu.pl', 'ohm.edu.pl', 'usa.edu.pl', 'beta.edu.pl'], customizable: false },
        { name: 'VanishPost', domains: ['服务端分配'], customizable: false }
      ],
              endpoints: [
          'POST /api/mail/create - 创建临时邮箱',
          'POST /api/mail/list - 获取邮件列表',
          'POST /api/mail/content - 获取邮件详情',
        'GET /api/mail/:address/verify - 验证邮箱',
        'GET /api/mail/providers/health - 提供者健康状态',
        'POST /api/mail/providers/test-connections - 测试所有提供者连接',
        'GET /api/mail/providers/stats - 提供者统计信息'
      ]
    },
    timestamp: new Date().toISOString()
  };

  return c.json(response);
});

// 创建邮箱路由
app.post('/api/mail/create', async (c) => {
  try {
    let body = {};
    
    try {
      body = await c.req.json();
    } catch (error) {
      // 如果没有body或解析失败，使用默认空对象
    }

    const result = await mailService.createEmail(body);
    
    return c.json(result, result.success ? 200 : 400);
  } catch (error) {
    const response: AppResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    };

    return c.json(response, 500);
  }
});

// 获取邮件列表路由 (POST)
app.post('/api/mail/list', async (c) => {
  try {
    const body = await c.req.json();
    
    if (!body.address) {
      return c.json({
        success: false,
        error: 'Email address is required',
        timestamp: new Date().toISOString()
      }, 400);
    }

    // 获取Authorization header中的token
    const authHeader = c.req.header('Authorization');
    const accessToken = body.accessToken || (authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : undefined);

    const query = {
      address: body.address,
      provider: body.provider,
      accessToken,
      limit: body.limit || 20,
      offset: body.offset || 0,
      unreadOnly: body.unreadOnly === true,
      since: body.since ? new Date(body.since) : undefined
    };

    const result = await mailService.getEmails(query);
    
    return c.json(result, result.success ? 200 : 400);
  } catch (error) {
    const response: AppResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid request body or internal server error',
      timestamp: new Date().toISOString()
    };

    return c.json(response, 500);
  }
});

// 获取邮件详情路由 (POST)
app.post('/api/mail/content', async (c) => {
  try {
    const body = await c.req.json();
    
    if (!body.address || !body.id) {
      return c.json({
        success: false,
        error: 'Email address and email ID are required',
        timestamp: new Date().toISOString()
      }, 400);
    }

    // 获取Authorization header中的token
    const authHeader = c.req.header('Authorization');
    const accessToken = body.accessToken || (authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : undefined);

    const result = await mailService.getEmailContent(body.address, body.id, body.provider, accessToken);
    
    return c.json(result, result.success ? 200 : 404);
  } catch (error) {
    const response: AppResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid request body or internal server error',
      timestamp: new Date().toISOString()
    };

    return c.json(response, 500);
  }
});

// 验证邮箱路由
app.get('/api/mail/:address/verify', async (c) => {
  try {
    const address = c.req.param('address');
    const provider = c.req.query('provider');
    
    if (!address) {
      return c.json({
        success: false,
        error: 'Email address is required',
        timestamp: new Date().toISOString()
      }, 400);
    }

    const result = await mailService.verifyEmail(address, provider);
    
    return c.json(result, result.success ? 200 : 404);
  } catch (error) {
    const response: AppResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    };

    return c.json(response, 500);
  }
});

// 提供者健康状态路由
app.get('/api/mail/providers/health', async (c) => {
  try {
    const result = await mailService.getProvidersHealth();
    return c.json(result, result.success ? 200 : 500);
  } catch (error) {
    const response: AppResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    };

    return c.json(response, 500);
  }
});

// 强制测试所有provider连接状态
app.post('/api/mail/providers/test-connections', async (c) => {
  try {
    // 强制重新测试所有provider的连接
    const result = await mailService.getProvidersHealth();
    
    return c.json({
      success: true,
      message: 'All providers tested',
      data: result.data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to test provider connections',
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// 提供者统计信息路由
app.get('/api/mail/providers/stats', (c) => {
  try {
    const result = mailService.getProvidersStats();
    return c.json(result, result.success ? 200 : 500);
  } catch (error) {
    const response: AppResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    };

    return c.json(response, 500);
  }
});

// 兼容旧的GET接口（保留向后兼容性）
app.get('/api/mail/:address/emails', async (c) => {
  const address = c.req.param('address');
  const provider = c.req.query('provider');
  const accessToken = c.req.query('accessToken') || c.req.header('Authorization')?.replace('Bearer ', '');
  
  const query = {
    address,
    provider,
    accessToken,
    limit: Number(c.req.query('limit')) || 20,
    offset: Number(c.req.query('offset')) || 0,
    unreadOnly: c.req.query('unread') === 'true',
    since: c.req.query('since') ? new Date(c.req.query('since')!) : undefined
  };

  try {
    const result = await mailService.getEmails(query);
    return c.json(result, result.success ? 200 : 400);
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    }, 500);
  }
});

app.get('/api/mail/:address/emails/:emailId', async (c) => {
  const address = c.req.param('address');
  const emailId = c.req.param('emailId');
  const provider = c.req.query('provider');
  const accessToken = c.req.query('accessToken') || c.req.header('Authorization')?.replace('Bearer ', '');

  try {
    const result = await mailService.getEmailContent(address, emailId, provider, accessToken);
    return c.json(result, result.success ? 200 : 404);
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// 404 处理
app.notFound((c) => {
  return c.json({
    success: false,
    error: 'Endpoint not found',
    timestamp: new Date().toISOString()
  }, 404);
});

// 错误处理
app.onError((err, c) => {
  console.error('Application error:', err);
  return c.json({
    success: false,
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  }, 500);
});

// 导出应用实例
export default app; 