<template>
    <div class="app-container">
        <!-- 添加微信提示弹窗 -->
        <div v-if="showWeixinTip" class="weixin-tip">
            <div class="tip-content">
                要完整使用此站点功能，请点击右上角"..."，选择"在浏览器中打开"
                <button class="close-btn" @click="showWeixinTip = false">知道了</button>
            </div>
        </div>
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
                <router-link to="/generate-qrcode" class="menu-item">
                    <i class="icon qrcode-icon"></i>
                    二维码生成
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

<script>
export default {
    data() {
        return {
            showWeixinTip: false
        }
    },
    mounted() {
        this.checkWeixinBrowser()
    },
    methods: {
        checkWeixinBrowser() {
            const ua = navigator.userAgent.toLowerCase()
            if (ua.match(/MicroMessenger/i) == "micromessenger") {
                this.showWeixinTip = true
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
    justify-content: space-between;
    align-items: center;
    padding: 0 20px;
    border-bottom: 1px solid #eee;
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

.weixin-tip {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
}

.tip-content {
    background: white;
    padding: 20px;
    border-radius: 8px;
    max-width: 80%;
    text-align: center;
}

.close-btn {
    margin-top: 15px;
    padding: 8px 20px;
    background: #2c3e50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.close-btn:hover {
    opacity: 0.9;
}
</style>