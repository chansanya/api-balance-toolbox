import { fail } from '../../shared/suppliers.js';

// 鉴权中间件:保护 /api/* 接口(公开接口除外)
export async function onRequest({ request, env, next }) {
  // 公开接口:临时查询、公益站列表(GET),无需鉴权
  const url = new URL(request.url);
  if (url.pathname === '/api/check') return next();
  if (url.pathname === '/api/sites' && request.method === 'GET') return next();

  const expected = env.ACCESS_TOKEN;
  if (!expected) {
    return fail('服务端未配置 ACCESS_TOKEN,拒绝访问', 500);
  }
  const provided =
    request.headers.get('X-Access-Token') ||
    (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (provided !== expected) {
    return fail('鉴权失败:访问口令无效', 401);
  }
  return next();
}
