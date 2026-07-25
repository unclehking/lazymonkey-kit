# 移动端禁止页面缩放设计

## 目标

移动端访问懒猴工具箱时，页面保持设备宽度和 1 倍初始缩放，用户不能通过双指或浏览器缩放手势改变页面比例。桌面端布局及各工具页交互保持不变。

## 实现方案

修改应用入口 `index.html` 中唯一的 viewport 元信息：

```html
<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
>
```

该设置由移动浏览器在页面加载时统一处理，无需在各 Vue 视图中增加触摸事件监听，也不会影响现有文件拖放、图片裁剪或其他工具逻辑。

## 不采用的方案

- 不使用 CSS `touch-action: none`，避免影响页面滚动、拖放和裁剪手势。
- 不使用 JavaScript 拦截 `touchmove` 或手势事件，避免引入全局事件副作用和浏览器兼容问题。

## 验证与发布

1. 在修改前确认 viewport 尚未包含禁止缩放参数。
2. 修改后检查入口文件仅存在一个 viewport 标签，且包含 `maximum-scale=1.0` 和 `user-scalable=no`。
3. 执行 `npm run build`，确认 Vite 生产构建成功。
4. 提交并推送代码，然后运行仓库的 `scripts/publish.js` 上传 `dist/`。
5. 请求线上首页并核对实际返回的 viewport 内容。

## 风险与边界

禁止页面缩放会降低依赖缩放查看内容的可访问性，但这是本次明确要求。改动只作用于浏览器页面缩放，不调整应用内部图片预览、裁剪或画布缩放能力。
