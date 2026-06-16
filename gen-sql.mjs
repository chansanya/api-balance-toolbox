// 从 stdin 读 `wrangler d1 execute --local --json` 的输出,生成指定表的全量替换 SQL。
// 先清空表，再插入本地所有数据。不含建表语句(远程表需已存在)。
// 忽略 id / created_at(自增主键、时间戳不跨库同步)。
// 用法: node gen-sql.mjs <表名>
import fs from 'fs';

const [, , table] = process.argv;
if (!table) {
  process.stderr.write('用法: node gen-sql.mjs <表名>\n');
  process.exit(1);
}
const SKIP = new Set(['id', 'created_at']); // 自增主键 / 时间戳,不跨库同步

const rows = JSON.parse(fs.readFileSync(0, 'utf8'))[0]?.results ?? [];
if (!rows.length) {
  process.stdout.write(`-- 表 ${table} 本地无数据\nDELETE FROM ${table};\n`);
  process.exit(0);
}
const cols = Object.keys(rows[0]).filter((c) => !SKIP.has(c));
const q = String.fromCharCode(39);
const esc = (s) => String(s).split(q).join(q + q);
const w = (v) => (v === null || v === undefined ? 'NULL' : q + esc(v) + q);

const out = [
  `-- 由 sync.sh 生成: 表=${table} (全量替换，先清空再插入)`,
  `DELETE FROM ${table};`,
  ''
];

for (const r of rows) {
  out.push(`INSERT INTO ${table} (${cols.join(', ')}) VALUES (${cols.map((c) => w(r[c])).join(', ')});`);
}

process.stdout.write(out.join('\n') + '\n');
