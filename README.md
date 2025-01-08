# 懒猴工具箱

一个基于Vue3 + Vite构建的在线工具集合，提供多种实用的文本和图片处理工具。本项目完全使用AI生成，目标是不使用人工编写一行代码。 

## 功能特点

- 🔤 文字处理
  - 大小写转换
  - 去除空格
  - JSON格式化

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
1、按照设计图生成主界面，左侧是菜单，顶部是状态栏，点击菜单后页面内容显示在页面右下侧;
2、路由使用vue-router
3、状态管理使用pinia
4、生成package.json,并写入依赖
5、不使用typescript

后续添加功能：

- 继续生成/views/ImageConvert.vue
- 继续生成views/FAQ.vue
- 创建index.html
- 添加一个菜单：图片转base64，并且在views/Base64Convert.vue文件中实现图片转base64编码功能
- 给App.vue中的菜单点后添加active状态，设置背景色为#f5f5f5
- 把dist目录加入到gitignore
- 把Composer历史prompt写入到README.md中