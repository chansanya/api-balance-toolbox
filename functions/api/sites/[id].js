import { ok, fail } from '../../../shared/suppliers.js';

// DELETE /api/sites/:id  删除公益站点(需登录)
export async function onRequestDelete({ params, env }) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) return fail('无效的 id');
  const res = await env.DB.prepare('DELETE FROM sites WHERE id = ?').bind(id).run();
  if (!res.meta?.changes) return fail('未找到该站点', 404);
  return ok({ id }, '删除成功');
}
