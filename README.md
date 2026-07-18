# 复利与财务自由 · 投资理财知识库

一个纯静态网站（无任何依赖、无需构建），由 12 篇系统文章 + 1 份巩固书单组成，
覆盖：红利股 / 泡沫征兆 / 美联储周期 / 复利引擎 / 估值安全边际 / 资产配置 /
税务与渠道 / 行为纪律 / 财务自由路径 / 宏观仪表盘 / 风险管理。

站点入口：`index.html`

## 目录结构

```
.
├─ index.html                      # 网站首页（系列地图 + 文章导航）
├─ CNAME                           # 自定义域名 wuheping.top
├─ .nojekyll                       # 禁用 GitHub Pages 的 Jekyll 处理
├─ assets/site.js                  # 文章页右下角「📑 目录」浮动按钮
├─ *.html                          # 13 篇内容（含互动计算器）
└─ README.md
```

## 本地预览

直接用浏览器打开 `index.html` 即可。或使用任意静态服务器：

```bash
# Python
python -m http.server 8000
# 然后访问 http://localhost:8000
```

## 部署到 GitHub Pages

1. 在 GitHub 新建仓库（如 `wuheping.top` 或 `invest`）。
2. 本地已 `git init` 并提交，只需添加远程并推送：
   ```bash
   git remote add github https://github.com/你的用户名/仓库名.git
   git branch -M main
   git push -u github main
   ```
3. 仓库 **Settings → Pages → Build and deployment → Source: Deploy from a branch**，
   选择 `main` 分支、`/ (root)` 目录，保存。
4. **自定义域名**：Settings → Pages → Custom domain 填 `wuheping.top` → Save；
   DNS 生效后开启 **Enforce HTTPS**。
5. DNS（在 wuheping.top 域名服务商处）添加 4 条 A 记录：
   ```
   185.199.108.153
   185.199.109.153
   185.199.110.153
   185.199.111.153
   ```
   或添加 CNAME 记录指向 `你的用户名.github.io.`（仓库内的 CNAME 文件已写入 wuheping.top）。

## 部署到 Gitee Pages

1. 在 Gitee 新建**公开**仓库。
2. 添加远程并推送：
   ```bash
   git remote add gitee https://gitee.com/你的用户名/仓库名.git
   git push -u gitee master
   ```
3. Gitee 仓库 → **服务 → Gitee Pages** → 部署目录选「根目录」→ 启动。
   - 公版仅支持 `你的用户名.gitee.io` 子域；
   - 自定义域名 `wuheping.top` + HTTPS 需 **Gitee Pages Pro**（会员）。

## 双端同步

```bash
git push github main && git push gitee master
```

## 免责声明

本站所有文章均为投资理财常识与公开资料整理，内置计算器为理论演示，
**不构成任何投资建议**。具体决策须结合实时数据与个人风险承受力，
必要时咨询持牌顾问。
