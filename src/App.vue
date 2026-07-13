<template>
    <div class="app-container" :class="{ 'mp3-route': $route.path === '/mp3-search' }">
        <!-- 顶部状态栏 -->
        <header class="header">
            <router-link to="/" class="logo">
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
            </router-link>
            <span> --&nbsp;&nbsp;完全使用AI生成的工具站</span>
            <button
                class="mobile-menu-btn"
                type="button"
                :aria-expanded="mobileMenuOpen ? 'true' : 'false'"
                aria-label="打开菜单"
                @click="mobileMenuOpen = !mobileMenuOpen"
            >
                <i></i>
                <i></i>
                <i></i>
            </button>
        </header>

        <div class="main-content">
            <!-- 左侧菜单 -->
            <nav class="sidebar" :class="{ open: mobileMenuOpen }" @click="closeMobileMenu">
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
                <router-link to="/image-compress" class="menu-item">
                    <i class="fas fa-compress"></i>
                    图片压缩
                </router-link>
                <view class="divider"></view>
                <router-link to="/generate-qrcode" class="menu-item">
                    <i class="icon qrcode-icon"></i>
                    二维码生成
                </router-link>
                <router-link to="/de-qrcode" class="menu-item">
                    <i class="icon qrcode-icon"></i>
                    二维码解码
                </router-link>
                <view class="divider"></view>
                <router-link to="/json-format" class="menu-item">
                    <i class="icon base64-icon"></i>
                    JSON格式化
                </router-link>
                <router-link to="/url-encode" class="menu-item">
                    <i class="icon base64-icon"></i>
                    URL编码/解码
                </router-link>
                <router-link to="/password-generator" class="menu-item">
                    <i class="fas fa-key"></i>
                    密码生成器
                </router-link>
                <view class="divider"></view>
                <router-link to="/timestamp-convert" class="menu-item">
                    <i class="fas fa-clock"></i>
                    时间戳转换
                </router-link>
                <view class="divider"></view>
                <router-link to="/color-picker" class="menu-item">
                    <i class="fas fa-eye-dropper"></i>
                    屏幕取色器
                </router-link>
                <view class="divider"></view>
                <router-link to="/doodle-board" class="menu-item">
                    <i class="fas fa-paint-brush"></i>
                    涂鸦画板
                </router-link>
                <view class="divider"></view>
                <router-link to="/mp3-search" class="menu-item">
                    <i class="fas fa-music"></i>
                    懒猴听歌
                </router-link>
            </nav>

            <!-- 右侧内容区 -->
            <main class="content">
                <router-view></router-view>
            </main>
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            mobileMenuOpen: false
        }
    },
    methods: {
        closeMobileMenu(event) {
            if (event.target.closest('.menu-item')) {
                this.mobileMenuOpen = false
            }
        }
    }
}
</script>

<style>
.app-container {
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.header {
    background-color: #fff;
    height: 60px;
    display: flex;
    align-items: center;
    padding: 0 20px;
    border-bottom: 1px solid #eee;
    position: relative;
    z-index: 20;
}
.header span{
  font-size: 12px;
  color: #676767;
  margin-left: 10px;
}
.main-content {
    flex: 1;
    display: flex;
    overflow: hidden;
}

.sidebar {
    width: 150px;
    background-color: #2c3e50;
    padding: 20px 0;
}

.mobile-menu-btn {
    display: none;
    width: 38px;
    height: 38px;
    margin-left: auto;
    border: none;
    border-radius: 6px;
    background: #2c3e50;
    cursor: pointer;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 4px;
}

.mobile-menu-btn i {
    display: block;
    width: 18px;
    height: 2px;
    border-radius: 2px;
    background: #fff;
}

.divider {
  display: block;
  height: 1px;
  background-color: #f0eeee37;
  margin: 10px;
}

.menu-item {
    display: flex;
    align-items: center;
    padding: 10px 20px;
    color: #fff;
    text-decoration: none;
    transition: all 0.3s ease;
    position: relative;
    border-radius: 0;
}

.menu-item:hover {
    background-color: rgba(255, 255, 255, 0.1);
}

.menu-item.router-link-active {
    background-color: #f5f5f5;
    color: #2c3e50;
    transform: translateX(10px);
    border-top-left-radius: 6px;
    border-bottom-left-radius: 6px;
}

.content {
    flex: 1;
    padding: 20px;
    background-color: #f5f5f5;
    overflow-y: auto;
    height: 100%;
}

.logo {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;
    text-decoration: none;
    color: inherit;
}

.logo:hover {
    opacity: 0.8;
}

.logo-icon {
    display: inline-block;
    vertical-align: middle;
}

@media (max-width: 768px) {
    .header {
        padding: 0 12px;
    }

    .app-container.mp3-route .header {
        display: none;
    }

    .header span {
        display: none;
    }

    .mobile-menu-btn {
        display: flex;
    }

    .main-content {
        position: relative;
    }

    .sidebar {
        display: none;
        position: fixed;
        top: 60px;
        right: 12px;
        width: min(260px, calc(100vw - 24px));
        max-height: calc(100vh - 72px);
        padding: 8px 0;
        border-radius: 8px;
        box-shadow: 0 12px 28px rgba(31, 45, 61, 0.24);
        overflow-y: auto;
        z-index: 30;
    }

    .app-container.mp3-route .sidebar {
        top: 12px;
        max-height: calc(100vh - 24px);
    }

    .sidebar.open {
        display: block;
    }

    .menu-item {
        padding: 12px 16px;
        transform: none;
    }

    .menu-item.router-link-active {
        transform: none;
        border-radius: 0;
    }

    .content {
        padding: 14px;
    }
}
</style>
