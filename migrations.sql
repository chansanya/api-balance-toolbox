-- 数据库升级 SQL
-- 每次数据库结构变更都记录在这里，旧版本注释掉保留历史
-- 执行命令:
--   本地: wrangler d1 execute balance --local --file=migrations.sql
--   远程: wrangler d1 execute balance --remote --file=migrations.sql

-- ================================
-- 2026-06-16: v1.1 - 新增签到地址字段
-- ================================
ALTER TABLE sites ADD COLUMN signin_url TEXT NOT NULL DEFAULT '';

-- ================================
-- 未来的升级在这里添加，并注释掉上面的旧版本
-- 例如:
-- 2026-06-20: v1.2 - 新增某功能
-- ALTER TABLE xxx ADD COLUMN yyy;
-- ================================
