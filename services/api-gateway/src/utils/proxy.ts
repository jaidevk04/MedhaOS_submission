import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { logger } from './logger';

export const createServiceProxy = (target: string, pathRewrite?: Record<string, string>): any => {
  const options: Options = {
    target,
    changeOrigin: true,
    pathRewrite: pathRewrite || {},
    onProxyReq: (proxyReq, req: any) => {
      // Forward authentication headers
      if (req.headers.authorization) {
        proxyReq.setHeader('Authorization', req.headers.authorization);
      }
      
      // Forward request ID for tracing
      if (req.requestId) {
        proxyReq.setHeader('X-Request-ID', req.requestId);
      }
      
      // Forward correlation ID for distributed tracing
      if (req.correlationId) {
        proxyReq.setHeader('X-Correlation-ID', req.correlationId);
      }
      
      // Forward user information
      if (req.user) {
        proxyReq.setHeader('X-User-ID', req.user.id);
        proxyReq.setHeader('X-User-Role', req.user.role);
      }
      
      logger.debug(`Proxying request to ${target}${req.path}`);
    },
    onProxyRes: (proxyRes, req, res) => {
      logger.debug(`Received response from ${target} with status ${proxyRes.statusCode}`);
    },
    onError: (err, req, res) => {
      logger.error(`Proxy error for ${target}:`, err);
      (res as any).status(502).json({
        success: false,
        error: 'Service temporarily unavailable',
        service: target,
      });
    },
    timeout: 30000, // 30 seconds
    proxyTimeout: 30000,
  };

  return createProxyMiddleware(options);
};
