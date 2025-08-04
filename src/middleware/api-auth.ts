import { bearerAuth } from 'hono/bearer-auth';
import type { Context, Next } from 'hono';

export interface AuthConfig {
  apiKey?: string;
  enabled: boolean;
}

// 从环境变量获取认证配置
export function getAuthConfig(): AuthConfig {
  const apiKey = (globalThis as any).TEMPMAILHUB_API_KEY || 
                (typeof process !== 'undefined' && process?.env?.TEMPMAILHUB_API_KEY);
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
 */
export function createApiKeyAuthWithCustomError() {
  const config = getAuthConfig();
  
  if (!config.enabled) {
    return async (c: Context, next: Next) => next();
  }
  
  return async (c: Context, next: Next) => {
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