import { SUPPLIERS, validateSuppliers, queryKey, ok, fail } from '../../shared/suppliers.js';

// GET /api/balance?supplier=deepseek  (不传 supplier 查全部)
export async function onRequestGet({ request, env }) {
  const param = new URL(request.url).searchParams.get('supplier');
  let targets;
  try {
    targets = validateSuppliers(param);
  } catch (e) {
    return fail(e.message);
  }

  const results = [];
  for (const name of targets) {
    const { results: rows } = await env.DB
      .prepare('SELECT api_key FROM api_keys WHERE supplier = ?')
      .bind(name)
      .all();
    const items = await Promise.all(rows.map((r) => queryKey(name, r.api_key)));
    const total = items.reduce((s, it) => s + it.balance, 0);
    results.push({ supplier: name, name: SUPPLIERS[name].label, total, items });
  }
  return ok(results);
}
