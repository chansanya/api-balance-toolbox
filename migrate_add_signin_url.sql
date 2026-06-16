-- 数据库迁移：添加签到地址字段
-- 执行命令:
--   本地: wrangler d1 execute balance --local --file=migrate_add_signin_url.sql
--   远程: wrangler d1 execute balance --remote --file=migrate_add_signin_url.sql

ALTER TABLE sites ADD COLUMN signin_url TEXT NOT NULL DEFAULT '';
