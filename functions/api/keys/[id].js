import { ok, fail } from '../../../shared/suppliers.js';

// DELETE /api/keys/:id  删除指定 key
export async function onRequestDelete({ params, env }) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) return fail('无效的 id');
  const res = await env.DB.prepare('DELETE FROM api_keys WHERE id = ?').bind(id).run();
  if (!res.meta?.changes) return fail('未找到该 key', 404);
  return ok({ id }, '删除成功');
}
