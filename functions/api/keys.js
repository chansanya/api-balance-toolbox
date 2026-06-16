import { validateSuppliers, maskKey, ok, fail } from '../../shared/suppliers.js';

// GET /api/keys?supplier=xxx  列出 key(脱敏);不传 supplier 列全部
export async function onRequestGet({ request, env }) {
  const supplier = new URL(request.url).searchParams.get('supplier');
  let sql = 'SELECT id, supplier, api_key, created_at FROM api_keys';
  const binds = [];
  if (supplier) {
    try {
      validateSuppliers(supplier);
    } catch (e) {
      return fail(e.message);
    }
    sql += ' WHERE supplier = ?';
    binds.push(supplier);
  }
  sql += ' ORDER BY supplier, id';
  const { results } = await env.DB.prepare(sql).bind(...binds).all();
  return ok(
    results.map((r) => ({ id: r.id, supplier: r.supplier, key_masked: maskKey(r.api_key), created_at: r.created_at }))
  );
}

// POST /api/keys  {supplier, keys:["sk-...", ...]}  批量导入(UNIQUE 冲突自动跳过)
export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return fail('请求体不是合法 JSON');
  }
  const supplier = body?.supplier;
  if (!supplier) return fail('必须指定供应商 supplier');
  try {
    validateSuppliers(supplier);
  } catch (e) {
    return fail(e.message);
  }

  let keys = body.keys ?? body.api_key;
  if (typeof keys === 'string') keys = [keys];
  keys = [...new Set((keys || []).map((k) => String(k).trim()).filter(Boolean))];
  if (!keys.length) return fail('未提供任何 key');

  const stmt = env.DB.prepare('INSERT OR IGNORE INTO api_keys (supplier, api_key) VALUES (?, ?)');
  const res = await env.DB.batch(keys.map((k) => stmt.bind(supplier, k)));
  const inserted = res.reduce((s, r) => s + (r.meta?.changes || 0), 0);
  const skipped = keys.length - inserted;
  return ok({ requested: keys.length, inserted, skipped }, `导入完成:新增 ${inserted} 个,跳过重复 ${skipped} 个`);
}
