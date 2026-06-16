import { SUPPLIERS, validateSuppliers, queryKey, ok, fail } from '../../shared/suppliers.js';

// POST /api/check  {supplier, keys:[...]}  临时查询余额,不入库,无需鉴权(中间件放行)
export async function onRequestPost({ request }) {
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

  const items = await Promise.all(keys.map((k) => queryKey(supplier, k)));
  const total = items.filter((i) => i.status === '✓').reduce((s, i) => s + i.balance, 0);
  return ok([{ supplier, name: SUPPLIERS[supplier].label, total, items }]);
}
