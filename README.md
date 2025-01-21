# 懒猴工具箱

一个基于Vue3 + Vite构建的在线工具集合，提供多种实用的文本和图片处理工具。本项目完全使用AI生成，目标是不使用人工编写一行代码。 

## 功能特点

- 🖼️ 图片工具
  - 图片格式转换（支持JPEG、PNG、WEBP、GIF）
  - 图片转Base64编码

- 📚 其他特性
  - 简洁直观的界面设计
  - 支持拖拽上传
  - 响应式布局，支持移动端
  - 纯前端处理，保护隐私

## 技术栈

- Vue 3
- Vue Router
- Pinia
- Vite

## 快速开始
npm install
npm run dev


### 构建生产版本
npm run build



## Cursor Composer 历史 Prompt

这是一个全新的项目，使用vue3和vite搭建，有以下要求：
- 1、按照设计图生成主界面，左侧是菜单，顶部是状态栏，点击菜单后页面内容显示在页面右下侧;
- 2、路由使用vue-router
- 3、状态管理使用pinia
- 4、生成package.json,并写入依赖
- 5、不使用typescript

后续添加功能：

- 继续生成/views/ImageConvert.vue
- 继续生成views/FAQ.vue
- 创建index.html
- 添加一个菜单：图片转base64，并且在views/Base64Convert.vue文件中实现图片转base64编码功能
- 给App.vue中的菜单点后添加active状态，设置背景色为#f5f5f5
- 把dist目录加入到gitignore
- 把Composer历史prompt写入到README.md中
- 删除App.vue中菜单项：文字处理，并且删除相关代码
- 添加一个菜单：ASCII编码/解码，并且在views/ASCII.vue文件中实现ASCII编码、解码功能
- 删除App.vue文件中的“选择PDF”
- 生成一个与“工具箱”相关的svg图标logo，填充颜色为#0065a0，并插入到App.vue文件中，位于文本“懒猴工具箱”之前
- 添加一个菜单：base64转图片，并且在views/base64ToImg.vue文件中实现base64转图片功能
- 添加默认路由，访问时显示views/index.vue，views/index.vue页面内容为“欢迎使用懒猴工具站！（换行显示）本工具站完全使用AI生成，未使用人工编写一行代码。”，上下左右居中显示。
- 添加一个菜单：图片压缩，并且在views/imageCompress.vue文件中实现图片压缩功能
- 调整菜单位置，把图片压缩菜单放到常见问题菜单之前
- 在“Base64转图片”菜单后添加一个菜单：图片截取，并且在views/imageCut.vue文件中实现图片截取功能
- 调整菜单位置，把”图片压缩“菜单放到“ASCII编码/解码”菜单之前
- 修改title内容为：懒猴工具站-免费便捷在线工具站
- 添加meta标签，name为keywords， 懒猴工具,在线工具,图片压缩,图片格式转换,图片截取,base64转图片,图片base64
- 添加meta标签，name为description， 内容为：懒猴工具站-免费便捷在线工具站，提供图片压缩,图片格式转换,图片截取,base64转图片等在线工具
- 修改.sidebar的width为150px
- 点击左上角logo，跳转到views/index.vue
- 页面不允许滚动，main标签允许y轴滚动
- 当main标签内容较多时，内容还是不可滚动，请修复此bug
- 判断如果使用微信内置浏览器，弹出提示：要完整使用此站点功能，请点击右上角”...“，选择“在浏览器中打开”
- 添加一个菜单：二维码生成，并且在views/generateQrcode.vue文件中实现字符串生成二维码功能
- 删除菜单： ASCII编码/解码， 并删除相关逻辑代码
- 添加一个菜单：二维码解码，并且在views/deQrcode.vue文件中实现二维码图片解码功能
- 添加repository为https://github.com/unclehking/lazymonkey-kit
- 把repository地址写到首页下侧，左右居中
- 封装一个Toast组件，并替换alert
- 当访问不存在的路由时，默认展示首页
