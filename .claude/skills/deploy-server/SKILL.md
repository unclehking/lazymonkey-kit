---
name: deploy-server
description: 打包前端代码并通过SCP发布到远程服务器
triggers:
  - "打包发布"
  - "发布到服务器"
  - "部署服务器"
  - "deploy"
  - "publish"
---

# 打包发布到服务器

将前端代码打包并通过 SCP 发布到远程服务器。

## 执行步骤

请按以下步骤执行：

1. 首先执行 `git add -A && git commit -m "发布"` 和 `git push` 提交代码
2. 运行 `node scripts/publish.js`，该脚本会：
   - 执行 `npm run build` 构建生产环境代码到 `dist/` 目录
   - 通过 scp2 将 `dist/` 目录上传到服务器 `root@8.137.85.1:/opt/kit`

## 服务器配置

服务器信息定义在 `scripts/publish.js` 中：
- 地址：`8.137.85.1:22`
- 用户：`root`
- 远程路径：`/opt/kit`

## 注意事项

- 确保代码已提交并测试通过
- 如果打包失败，检查代码是否有语法错误
- 如果发布失败，检查服务器网络连接和 SSH 认证
