// 从 stdin 读 `wrangler d1 execute --local --json` 的输出,生成指定表的增量 UPSERT SQL。
// 不含建表语句(远程表需已存在);自动按表的列生成,忽略 id / created_at(自增主键、时间戳不跨库同步)。
// 用法: node gen-sql.mjs <表名> <冲突键列>
import fs from 'fs';

const [, , table, keyCol] = process.argv;
if (!table || !keyCol) {
  process.stderr.write('用法: node gen-sql.mjs <表名> <冲突键列>\n');
  process.exit(1);
}
const SKIP = new Set(['id', 'created_at']); // 自增主键 / 时间戳,不跨库同步

const rows = JSON.parse(fs.readFileSync(0, 'utf8'))[0]?.results ?? [];
if (!rows.length) {
  process.stdout.write(`-- 表 ${table} 本地无数据,无需同步\n`);
  process.exit(0);
}
const cols = Object.keys(rows[0]).filter((c) => !SKIP.has(c));
const setCols = cols.filter((c) => c !== keyCol);
const q = String.fromCharCode(39);
const esc = (s) => String(s).split(q).join(q + q);
const w = (v) => (v === null || v === undefined ? 'NULL' : q + esc(v) + q);

const out = [`-- 由 sync.sh 生成:表=${table} 冲突键=${keyCol}(增量 UPSERT,不删数据、不含建表)`];
for (const r of rows) {
  if (setCols.length) {
    out.push(`UPDATE ${table} SET ${setCols.map((c) => `${c}=${w(r[c])}`).join(', ')} WHERE ${keyCol}=${w(r[keyCol])};`);
  }
  out.push(`INSERT INTO ${table} (${cols.join(', ')}) SELECT ${cols.map((c) => w(r[c])).join(', ')} WHERE NOT EXISTS (SELECT 1 FROM ${table} WHERE ${keyCol}=${w(r[keyCol])});`);
}
process.stdout.write(out.join('\n') + '\n');
