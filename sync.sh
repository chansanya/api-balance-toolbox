#!/usr/bin/env bash
# 通用数据同步:用 wrangler 读本地任意表,生成全量替换 SQL(先清空远程表再插入本地数据)。
#
# 用法(在项目目录):
#   bash sync.sh [表名]        # 默认 sites
#   bash sync.sh sites
#   bash sync.sh api_keys
# 生成 <表名>-sync.sql 后推送:
#   wrangler d1 execute balance --remote --file=<表名>-sync.sql
cd "$(dirname "$0")" || exit 1

TABLE="${1:-sites}"
OUT="${TABLE}-sync.sql"

wrangler d1 execute balance --local --json \
  --command "SELECT * FROM ${TABLE}" 2>/dev/null \
  | node gen-sql.mjs "$TABLE" > "$OUT"

echo "✓ 已生成 ${OUT}（表 ${TABLE}，全量替换，$(grep -c '^INSERT' "$OUT") 条）"
echo "  推送: wrangler d1 execute balance --remote --file=${OUT}"
