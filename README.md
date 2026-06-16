# 我的工具站 · Cloudflare Pages

基于 **Cloudflare Pages + Functions + D1** 的个人工具站:供应商余额查询、API Key 管理、公益站收录。
支持 deepseek / siliconflow / moonshot 等供应商余额查询。

- 💰 **按供应商查余额** —— 汇总 + 各供应商分 tab,余额升序、低于阈值标红
- 🔑 **Key 管理** —— key 存 D1 数据库,批量导入 / 删除,列表脱敏
- 🔍 **本地临时查询** —— 免登录,手动输 key 即查,不写入数据库
- 🏵 **公益站收录** —— 卡片展示(名称 / 链接 / 简介 / 标签),免登录浏览,登录后增删
- 🔒 **访问鉴权** —— 管理 / 远程接口校验口令;`/api/check` 与 `/api/sites`(GET)公开

---

## 一、前置准备

1. **安装 Cloudflare CLI**

```bash
npm install -g wrangler   # Cloudflare 官方 CLI,需 Node 18+
wrangler login            # 浏览器授权一次
```

2. **配置环境变量**

复制 `.env.example` 为 `.env`,填入你的 Cloudflare 凭据:

```bash
cp .env.example .env
```

编辑 `.env`,填入:
- `CLOUDFLARE_API_TOKEN`: 在 [Cloudflare Dashboard → API Tokens](https://dash.cloudflare.com/profile/api-tokens) 创建
- `CLOUDFLARE_ACCOUNT_ID`: 在 Cloudflare Dashboard 右侧栏可找到

同时编辑 `wrangler.toml`,替换:
- `account_id`: 填入你的 Cloudflare Account ID
- `database_id`: 创建 D1 数据库后填入(见下一步)

---

## 二、快速开始

**1. 创建 D1 数据库**

```bash
wrangler d1 create balance
```

把输出里的 `database_id` 填进 `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "balance"
database_id = "刚才复制的 database_id"
```

**2. 初始化数据库表结构(远程)**

```bash
wrangler d1 execute balance --remote --file=schema.sql
```

**3. 部署到 Cloudflare Pages**

```bash
wrangler pages deploy
```

首次会让你创建 Pages 项目、选项目名,跟着提示走,完成后给你一个 `https://xxx.pages.dev`。

**4. 设置访问口令(重要!)**

```bash
wrangler pages secret put ACCESS_TOKEN
```

输入一个**强随机字符串**(建议 20 位以上),这就是登录页面需要输入的口令。

⚠️ **不要使用弱密码**,这个口令保护你的所有 API Keys!

---

## 三、本地开发

**1. 创建本地开发环境变量**

复制 `.dev.vars.example` 为 `.dev.vars`(如果还没有),设置本地开发口令:

```bash
# .dev.vars
ACCESS_TOKEN=你的本地开发口令
```

**2. 初始化本地数据库**

```bash
wrangler d1 execute balance --local --file=schema.sql   # 建本地表
```

**3. 启动本地开发服务器**

```bash
wrangler pages dev                                       # 启动本地服务
```

浏览器打开 **http://localhost:8788**。

**本地数据查询**

```bash
wrangler d1 execute balance --local --command "SELECT * FROM sites"
```

**环境变量说明**

项目中有两个环境变量文件,用途不同:

| 文件 | 用途 | 何时使用 | 提交到 Git? |
|------|------|---------|-----------|
| `.env` | Cloudflare API 凭据 | wrangler 部署时 | ❌ 否 |
| `.dev.vars` | 本地开发口令 | `wrangler pages dev` 本地开发 | ❌ 否 |

生产环境的 `ACCESS_TOKEN` 通过 `wrangler pages secret put` 设置,不使用这两个文件。

---

## 四、网页怎么用

**未登录 = 本地测试模式**:右上角「登录」,主体是「🔍 本地临时查询」——选供应商、每行粘一个 key、设阈值、查询。结果**不入库**,谁都能用。

**登录加载远程 key**:点右上角「登录」,弹框输口令。登录后顶部出现 **`☁️ 远程 Key` / `🔍 本地查询`** 切换:

- **远程 Key**:`汇总` / 各供应商 tab / `Key 管理`(导入、删除)
- **本地查询**:同未登录的临时查询

列表按余额**升序**,低于阈值的整行标红 +「余额不足」徽章,查询失败的沉底。右上角「退出登录」清口令。

**🏵 公益站**:点右上角(登录左边)发光的「公益站」入口切换。卡片显示站点(名称 → 标签 → 简介 → 链接,整卡可点),**免登录浏览**。登录后顶部出现折叠的「＋ 添加」(名称 / 链接 / 简介 + 标签,内置 `签到 / linux.do / 量大管饱` 或自定义),每张卡可删。

---

## 五、API 接口

除 `/api/check` 与 `GET /api/sites` 外,其余需带 header `X-Access-Token: <口令>`。

| 接口 | 方法 | 鉴权 | 说明 |
|------|------|------|------|
| `/api/check` | POST | 否 | 临时查询 `{"supplier","keys":[...]}`,不入库 |
| `/api/balance?supplier=xxx` | GET | 是 | 查 D1 已存 key 余额,不传查全部 |
| `/api/keys?supplier=xxx` | GET | 是 | 列出 key(脱敏) |
| `/api/keys` | POST | 是 | 批量导入 `{"supplier","keys":[...]}` |
| `/api/keys/:id` | DELETE | 是 | 删除 key |
| `/api/sites` | GET | 否 | 列出公益站(公开) |
| `/api/sites` | POST | 是 | 新增 `{"name","url","note?","tags?":[]}` |
| `/api/sites/:id` | DELETE | 是 | 删除公益站 |

---

## 六、公益站数据同步(本地 → 远程)

本地 `pages dev` 里加的公益站,要发布到线上得同步到远程 D1。用同步脚本:

```bash
cd pages
bash sync.sh                                                  # 同步 sites 表(冲突键 url),生成 sites-sync.sql
wrangler d1 execute balance --remote --file=sites-sync.sql    # 推送到远程
wrangler d1 execute balance --remote --command "SELECT id,name,url FROM sites"   # 验证
```

- **增量 UPSERT**:同 url 的站更新、新 url 的插入,**不删除**远程已有数据,可反复跑。
- **不含建表**:远程表需已存在(第二步 `schema.sql` 已建)。
- **通用任意表**:`bash sync.sh <表名> <冲突键列>`,例如 `bash sync.sh api_keys api_key`(冲突键=判断"同一条记录"的列)。

> 原理:[`sync.sh`](sync.sh) 调 `wrangler d1 execute --local` 读本地表(由 wrangler 定位库,不会读错文件),交给 [`gen-sql.mjs`](gen-sql.mjs) 解析、转义、生成 UPSERT SQL。自动忽略 `id` / `created_at` 列。

---

## 七、常见问题

**Q:一操作就「鉴权失败」?** 口令没输对;生产确认执行过 `wrangler pages secret put ACCESS_TOKEN`。

**Q:接口返回「服务端未配置 ACCESS_TOKEN」?** 没设口令。本地查 `.dev.vars`,生产用 `wrangler pages secret put ACCESS_TOKEN`——故意的,没口令绝不裸奔。

**Q:部署 / 执行 SQL 报找不到数据库?** `database_id` 没填进 `wrangler.toml`。

**Q:余额全是 `✗`?** key 失效或过期,括号里数字是 HTTP 状态码,`(401)` 多半是 key 无效。

**Q:`--remote` 写不进 / `--local` 查不到?** 认准 `--remote`(打云端)和 `--local`(打本地)别搞混;`pages dev` 与 `d1 execute --local` 用同一个本地库。

**Q:本地 8788 端口被占?** `wrangler pages dev --port 8799`。

---

## 八、安全提醒

⚠️ **重要安全措施**:

1. **强口令**: `ACCESS_TOKEN` 必须使用强随机字符串(建议 20+ 字符),不要使用弱密码
2. **保护敏感文件**: 
   - ✅ `.env` 和 `.dev.vars` 已在 `.gitignore` 中,不会被提交
   - ✅ `.wrangler/` 目录包含本地数据库,已被忽略
   - ✅ `*-sync.sql` 可能包含真实数据,已被忽略
3. **定期轮换凭据**: 
   - 定期更换 `ACCESS_TOKEN`
   - 如果 Cloudflare API Token 泄露,立即在 Dashboard 中撤销并重新生成
4. **最小权限原则**: Cloudflare API Token 只授予必要的权限

---

## 九、开源协议

MIT License

如有问题或建议,欢迎提 Issue!
