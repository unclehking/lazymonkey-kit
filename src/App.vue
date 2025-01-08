<template>
    <div class="app-container">
        <!-- 顶部状态栏 -->
        <header class="header">
            <div class="logo">懒猴工具箱</div>
            <div class="right-section">
                <a href="#" class="pdf-select">选择PDF</a>
            </div>
        </header>

        <div class="main-content">
            <!-- 左侧菜单 -->
            <nav class="sidebar">
                <router-link to="/image-convert" class="menu-item">
                    <i class="icon image-icon"></i>
                    图片格式转换
                </router-link>
                <router-link to="/base64-convert" class="menu-item">
                    <i class="icon base64-icon"></i>
                    图片转Base64
                </router-link>
                <router-link to="/faq" class="menu-item">
                    <i class="icon faq-icon"></i>
                    常见问题
                </router-link>
            </nav>

            <!-- 右侧内容区 -->
            <main class="content">
                <router-view></router-view>
            </main>
        </div>
    </div>
</template>

<style>
.app-container {
    height: 100vh;
    display: flex;
    flex-direction: column;
}

.header {
    background-color: #fff;
    height: 60px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 20px;
    border-bottom: 1px solid #eee;
}

.main-content {
    flex: 1;
    display: flex;
}

.sidebar {
    width: 200px;
    background-color: #2c3e50;
    padding: 20px 0;
}

.menu-item {
    display: flex;
    align-items: center;
    padding: 12px 20px;
    color: #fff;
    text-decoration: none;
}

.menu-item:hover {
    background-color: rgba(255, 255, 255, 0.1);
}

.menu-item.router-link-active {
    background-color: #f5f5f5;
    color: #2c3e50;
}

.content {
    flex: 1;
    padding: 20px;
    background-color: #f5f5f5;
}

.pdf-select {
    color: #333;
    text-decoration: none;
}
</style>