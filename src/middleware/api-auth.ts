import { bearerAuth } from 'hono/bearer-auth';
import type { Context, Next } from 'hono';

// Deno 环境类型声明
declare global {
  var Deno: {
    env: {
      get(key: string): string | undefined;
    };
  } | undefined;
}

export interface AuthConfig {
  apiKey?: string;
  enabled: boolean;
}

// 从环境变量获取认证配置
export function getAuthConfig(env?: any): AuthConfig {
  // 尝试从不同平台环境获取API Key
  let apiKey: string | undefined;
  let platform = 'unknown';
  
  try {
    // 1. Cloudflare Workers环境 (通过env参数)
    if (env && typeof env === 'object' && env.TEMPMAILHUB_API_KEY) {
      apiKey = env.TEMPMAILHUB_API_KEY;
      platform = 'cloudflare-workers';
    }
    
    // 2. Deno 环境 (Deno Deploy)
    if (!apiKey && typeof globalThis.Deno !== 'undefined' && globalThis.Deno?.env) {
      try {
        apiKey = globalThis.Deno.env.get('TEMPMAILHUB_API_KEY');
        platform = 'deno';
      } catch (denoError) {
        console.warn('Deno env access error (需要 --allow-env 权限):', denoError);
      }
    }
    
    // 3. Node.js 环境 (Vercel, Netlify, 本地开发等)
    if (!apiKey && typeof process !== 'undefined' && process?.env) {
      apiKey = process.env.TEMPMAILHUB_API_KEY;
      
      // 检测具体的Node.js平台
      if (process.env.VERCEL) {
        platform = 'vercel';
      } else if (process.env.NETLIFY) {
        platform = 'netlify';
      } else if (process.env.NODE_ENV === 'development') {
        platform = 'local-development';
      } else {
        platform = 'nodejs';
      }
    }
    
    // 4. 其他环境 (兼容)
    if (!apiKey && typeof globalThis !== 'undefined') {
      apiKey = (globalThis as any).TEMPMAILHUB_API_KEY;
      platform = 'global';
    }
  } catch (error) {
    console.warn('获取环境变量时出错:', error);
  }
  
  // 调试输出 (生产环境可注释)
  console.log('🔍 平台环境检测:');
  console.log(`- 检测到平台: ${platform}`);
  console.log('- Cloudflare Workers env:', !!env);
  console.log('- Deno环境:', typeof globalThis.Deno !== 'undefined');
  console.log('- Node.js环境:', typeof process !== 'undefined');
  
  if (typeof process !== 'undefined' && process?.env) {
    console.log('- Vercel平台:', !!process.env.VERCEL);
    console.log('- Netlify平台:', !!process.env.NETLIFY);
    console.log('- 开发环境:', process.env.NODE_ENV === 'development');
  }
  
  console.log('- API Key状态:', Boolean(apiKey) ? '✅ 已设置' : '❌ 未设置');
  
  // 平台特定的提示
  if (!apiKey) {
    console.warn('⚠️  未找到 TEMPMAILHUB_API_KEY 环境变量');
    console.log('📝 设置方法:');
    
    switch (platform) {
      case 'cloudflare-workers':
        console.log('   Cloudflare: wrangler secret put TEMPMAILHUB_API_KEY');
        break;
      case 'vercel':
        console.log('   Vercel: vercel env add TEMPMAILHUB_API_KEY');
        break;
      case 'netlify':
        console.log('   Netlify: 在 Dashboard 的 Site settings > Environment variables 中设置');
        break;
      case 'deno':
        console.log('   Deno Deploy: 在 Dashboard 的 Settings > Environment Variables 中设置');
        break;
      case 'local-development':
        console.log('   本地开发: export TEMPMAILHUB_API_KEY="your-key" 或创建 .env 文件');
        break;
      default:
        console.log('   通用方法: export TEMPMAILHUB_API_KEY="your-key"');
    }
  }
  
  const enabled = Boolean(apiKey);
  
  return {
    apiKey: enabled ? apiKey : undefined,
    enabled
  };
}

/**
 * API Key 验证中间件（基于 Hono bearerAuth）
 * 使用标准的 Authorization: Bearer <api-key> 方式
 */
export function createApiKeyAuth() {
  const config = getAuthConfig();
  
  // 如果没有配置API Key，返回一个直接通过的中间件
  if (!config.enabled) {
    return async (c: Context, next: Next) => next();
  }
  
  // 使用 Hono 内置的 bearerAuth 中间件
  return bearerAuth({
    token: config.apiKey!,
    realm: 'TempMailHub API',
    // 自定义验证函数以支持动态token验证
    verifyToken: async (token: string) => {
      return token === config.apiKey;
    }
  });
}

/**
 * 创建带有自定义错误消息的API Key验证
 * 支持Cloudflare Workers的env参数
 */
export function createApiKeyAuthWithCustomError() {
  return async (c: Context, next: Next) => {
    // 在请求上下文中获取配置，支持Cloudflare Workers的env参数
    const config = getAuthConfig(c.env);
    
    if (!config.enabled) {
      return next();
    }
    
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({
        success: false,
        error: 'API Key required. Please provide API Key via Authorization header: "Bearer <your-api-key>"',
        timestamp: new Date().toISOString()
      }, 401);
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    if (token !== config.apiKey) {
      return c.json({
        success: false,
        error: 'Invalid API Key',
        timestamp: new Date().toISOString()
      }, 401);
    }
    
    return next();
  };
} 