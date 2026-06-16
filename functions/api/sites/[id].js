import { ok, fail } from '../../../shared/suppliers.js';

// PUT /api/sites/:id  编辑公益站点(需登录)
export async function onRequestPut({ params, request, env }) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) return fail('无效的 id');

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
    .prepare('UPDATE sites SET name = ?, url = ?, note = ?, tags = ?, signin_url = ? WHERE id = ?')
    .bind(name, url, note, JSON.stringify(tags), signin_url, id)
    .run();

  if (!res.meta?.changes) return fail('未找到该站点', 404);
  return ok({ id, name, url, note, tags, signin_url }, '更新成功');
}

// DELETE /api/sites/:id  删除公益站点(需登录)
export async function onRequestDelete({ params, env }) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) return fail('无效的 id');
  const res = await env.DB.prepare('DELETE FROM sites WHERE id = ?').bind(id).run();
  if (!res.meta?.changes) return fail('未找到该站点', 404);
  return ok({ id }, '删除成功');
}
