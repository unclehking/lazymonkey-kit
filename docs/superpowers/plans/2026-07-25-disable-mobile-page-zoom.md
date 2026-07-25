# Disable Mobile Page Zoom Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 禁止移动浏览器缩放懒猴工具箱页面，并把验证后的生产构建发布到现有服务器。

**Architecture:** 仅修改 HTML 应用入口的 viewport 元信息，让移动浏览器在 Vue 启动前应用统一缩放策略。保持所有 Vue 视图、触摸交互和图片处理逻辑不变，通过静态断言、Vite 构建及线上响应核验完成验证。

**Tech Stack:** HTML、Vue 3、Vite、Node.js、SCP

## Global Constraints

- 页面保持设备宽度和 1 倍初始缩放。
- 用户不能通过双指或浏览器缩放手势改变页面比例。
- 桌面端布局及各工具页交互保持不变。
- 不增加 CSS 或 JavaScript 触摸事件拦截。
- 发布目标沿用 `scripts/publish.js` 中配置的服务器和 `/opt/kit` 路径。

---

### Task 1: 修改 viewport 并验证生产构建

**Files:**
- Modify: `index.html:6`

**Interfaces:**
- Consumes: 浏览器对标准 viewport meta 标签的解析。
- Produces: 同时包含 `width=device-width`、`initial-scale=1.0`、`maximum-scale=1.0` 和 `user-scalable=no` 的唯一 viewport 标签。

- [ ] **Step 1: 运行修改前断言并确认失败**

```bash
node -e "const fs=require('fs');const s=fs.readFileSync('index.html','utf8');const tags=s.match(/<meta[^>]+name=[\"']viewport[\"'][^>]*>/gi)||[];if(tags.length!==1||!tags[0].includes('maximum-scale=1.0')||!tags[0].includes('user-scalable=no'))process.exit(1)"
```

Expected: exit code `1`，因为当前 viewport 尚未包含禁止缩放参数。

- [ ] **Step 2: 写入最小配置修改**

将 `index.html` 中的 viewport 标签改为：

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
```

- [ ] **Step 3: 运行修改后断言并确认通过**

```bash
node -e "const fs=require('fs');const s=fs.readFileSync('index.html','utf8');const tags=s.match(/<meta[^>]+name=[\"']viewport[\"'][^>]*>/gi)||[];if(tags.length!==1||!tags[0].includes('maximum-scale=1.0')||!tags[0].includes('user-scalable=no'))process.exit(1)"
```

Expected: exit code `0`。

- [ ] **Step 4: 执行生产构建**

```bash
npm run build
```

Expected: Vite 构建成功，命令退出码为 `0`。

- [ ] **Step 5: 提交并推送修改**

```bash
git add -A
git commit -m "发布"
git push
```

Expected: 当前分支的新提交成功推送到远程仓库。

### Task 2: 发布并核验线上结果

**Files:**
- Execute: `scripts/publish.js`
- Verify: production homepage returned by `8.137.85.1`

**Interfaces:**
- Consumes: Task 1 产生的生产代码和成功的 Vite 构建。
- Produces: 服务器 `/opt/kit` 下包含禁止缩放 viewport 配置的线上版本。

- [ ] **Step 1: 执行仓库发布脚本**

```bash
sudo node scripts/publish.js
```

Expected: 脚本重新构建 `dist/`，通过 SCP 上传完成并输出“发布成功!”。

- [ ] **Step 2: 请求线上首页并核对 viewport**

```bash
curl -fsSL --max-time 20 http://8.137.85.1/ | rg 'name="viewport"'
```

Expected: 返回唯一的 viewport 标签，包含 `maximum-scale=1.0` 和 `user-scalable=no`。

- [ ] **Step 3: 确认工作区状态**

```bash
git status --short
```

Expected: 没有未提交的源代码变更；构建产物若被 `.gitignore` 忽略，也不应出现在输出中。
