#!/usr/bin/env bash
# 通用数据同步:用 wrangler 读本地任意表,生成增量 UPSERT SQL(不含建表,远程表需已存在)。
#
# 用法(在 pages/ 目录):
#   bash sync.sh [表名] [冲突键列]        # 默认 sites / url
#   bash sync.sh sites url
#   bash sync.sh api_keys api_key
# 生成 <表名>-sync.sql 后推送:
#   wrangler d1 execute balance --remote --file=<表名>-sync.sql
cd "$(dirname "$0")" || exit 1

TABLE="${1:-sites}"
KEY="${2:-url}"
OUT="${TABLE}-sync.sql"

wrangler d1 execute balance --local --json \
  --command "SELECT * FROM ${TABLE}" 2>/dev/null \
  | node gen-sql.mjs "$TABLE" "$KEY" > "$OUT"

echo "✓ 已生成 ${OUT}（表 ${TABLE}，冲突键 ${KEY}，$(grep -c '^INSERT' "$OUT") 条）"
echo "  推送: wrangler d1 execute balance --remote --file=${OUT}"
