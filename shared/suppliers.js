// 供应商定义:info_url + 余额解析器(对应 src/supplier/balance.py 的 config.json 与 _PARSERS)
export const SUPPLIERS = {
  deepseek: {
    label: 'DeepSeek',
    info_url: 'https://api.deepseek.com/user/balance',
    parse: (d) => Number((d?.balance_infos || []).find((i) => i.currency === 'CNY')?.total_balance ?? 0),
  },
  siliconflow: {
    label: 'SiliconFlow',
    info_url: 'https://api.siliconflow.cn/v1/user/info',
    parse: (d) => Number(d?.data?.totalBalance ?? 0),
  },
  moonshot: {
    label: 'Moonshot',
    info_url: 'https://api.moonshot.cn/v1/users/me/balance',
    parse: (d) => Number(d?.data?.available_balance ?? 0),
  },
};

export const SUPPLIER_NAMES = Object.keys(SUPPLIERS);

// 校验供应商名(对应 balance.py 的 validate_suppliers);空值返回全部
export function validateSuppliers(input) {
  if (!input) return [...SUPPLIER_NAMES];
  const arr = Array.isArray(input) ? input : [input];
  const invalid = arr.filter((n) => !SUPPLIERS[n]);
  if (invalid.length) {
    throw new Error(`无效的供应商: ${invalid.join(', ')},有效值: ${SUPPLIER_NAMES.join(', ')}`);
  }
  return arr;
}

// 脱敏:sk-abcd...wxyz
export function maskKey(key) {
  if (!key || key.length <= 12) return key;
  return `${key.slice(0, 6)}...${key.slice(-4)}`;
}

// 查询单个 key 余额(对应 balance.py 的 _query_supplier 单次循环);balance.js 与 check.js 共用
export async function queryKey(supplier, apiKey) {
  const def = SUPPLIERS[supplier];
  try {
    const resp = await fetch(def.info_url, { headers: { Authorization: `Bearer ${apiKey}` }, signal: AbortSignal.timeout(10000) });
    if (!resp.ok) return { key_masked: maskKey(apiKey), balance: 0, status: `✗ (${resp.status})` };
    return { key_masked: maskKey(apiKey), balance: def.parse(await resp.json()), status: '✓' };
  } catch {
    return { key_masked: maskKey(apiKey), balance: 0, status: '✗ (error)' };
  }
}

// 统一响应格式(对应 web/response.py 的 ok)
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
export const ok = (data, message = 'ok') => json({ ok: true, message, data });
export const fail = (message, status = 400) => json({ ok: false, message }, status);
