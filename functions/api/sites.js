import { ok, fail } from '../../shared/suppliers.js';

// tags 以 JSON 数组存 TEXT 字段,读取时解析
function parseTags(s) {
  try {
    const a = JSON.parse(s);
    return Array.isArray(a) ? a : [];
  } catch {
    return [];
  }
}

// GET /api/sites  列出公益站点(公开,中间件放行);不登录也能查看
export async function onRequestGet({ env }) {
  const { results } = await env.DB
    .prepare('SELECT id, name, url, note, tags, signin_url, created_at FROM sites ORDER BY id DESC')
    .all();
  return ok(results.map((r) => ({ ...r, tags: parseTags(r.tags) })));
}

// POST /api/sites  {name, url, note?, tags?:[], signin_url?}  新增公益站点(需登录,中间件已校验口令)
export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return fail('请求体不是合法 JSON');
  }
  const name = String(body?.name || '').trim();
  const url = String(body?.url || '').trim();
  const note = String(body?.note || '').trim();
  const signin_url = String(body?.signin_url || '').trim();
  if (!name) return fail('站点名称不能为空');
  if (!/^https?:\/\//i.test(url)) return fail('链接需以 http:// 或 https:// 开头');
  if (signin_url && !/^https?:\/\//i.test(signin_url)) return fail('签到地址需以 http:// 或 https:// 开头');

  let tags = Array.isArray(body?.tags) ? body.tags : [];
  tags = [...new Set(tags.map((t) => String(t).trim()).filter(Boolean))].slice(0, 10);

  const res = await env.DB
    .prepare('INSERT INTO sites (name, url, note, tags, signin_url) VALUES (?, ?, ?, ?, ?)')
    .bind(name, url, note, JSON.stringify(tags), signin_url)
    .run();
  return ok({ id: res.meta?.last_row_id, name, url, note, tags, signin_url }, '添加成功');
}
