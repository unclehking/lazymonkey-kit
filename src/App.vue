<template>
    <div class="app-container">
        <!-- 顶部状态栏 -->
        <header class="header">
            <div class="logo">
                <svg 
                    class="logo-icon" 
                    viewBox="0 0 24 24" 
                    width="24" 
                    height="24" 
                    fill="#0065a0"
                >
                    <path d="M20.5,11H19V7c0-1.1-0.9-2-2-2h-4V3.5C13,2.12,11.88,1,10.5,1S8,2.12,8,3.5V5H4
                        C2.9,5,2,5.9,2,7v4H3.5c1.38,0,2.5,1.12,2.5,2.5S4.88,16,3.5,16H2v4c0,1.1,0.9,2,2,2h4v-1.5
                        c0-1.38,1.12-2.5,2.5-2.5s2.5,1.12,2.5,2.5V22h4c1.1,0,2-0.9,2-2v-4h1.5c1.38,0,2.5-1.12,2.5-2.5
                        S21.88,11,20.5,11z M16,17H8c-0.55,0-1-0.45-1-1V8c0-0.55,0.45-1,1-1h8c0.55,0,1,0.45,1,1v8
                        C17,16.55,16.55,17,16,17z"/>
                </svg>
                懒猴工具箱
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
                <router-link to="/base64-to-img" class="menu-item">
                    <i class="icon image-icon"></i>
                    Base64转图片
                </router-link>
                <router-link to="/image-cut" class="menu-item">
                    <i class="fas fa-crop-alt"></i>
                    图片截取
                </router-link>
                <router-link to="/image-compress" class="menu-item">
                    <i class="fas fa-compress"></i>
                    图片压缩
                </router-link>
                <router-link to="/ascii" class="menu-item">
                    <i class="icon code-icon"></i>
                    ASCII编码/解码
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

.logo {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;
}

.logo-icon {
    display: inline-block;
    vertical-align: middle;
}
</style>