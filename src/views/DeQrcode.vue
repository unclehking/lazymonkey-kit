<template>
    <div class="qrcode-decoder">
        <h2>二维码解码</h2>

        <div class="decoder-container">
            <div class="upload-section">
                <div class="drop-zone" 
                     @drop.prevent="handleDrop"
                     @dragover.prevent
                     @click="triggerFileInput">
                    <i class="upload-icon">📁</i>
                    <p>点击或拖拽二维码图片到此处</p>
                    <input 
                        type="file"
                        ref="fileInput"
                        @change="handleFileSelect"
                        accept="image/*"
                        style="display: none"
                    >
                </div>
            </div>

            <div class="preview-section" v-if="imageUrl">
                <div class="image-preview">
                    <img :src="imageUrl" alt="二维码预览">
                </div>
                <div class="result-section" v-if="decodedText">
                    <h3>解码结果：</h3>
                    <div class="decoded-content">
                        <textarea 
                            v-model="decodedText"
                            readonly
                            class="result-text"
                        ></textarea>
                        <div class="button-group">
                            <button @click="copyToClipboard" class="action-btn">复制结果</button>
                            <button @click="clearAll" class="action-btn clear">清空</button>
                            <a 
                                v-if="isValidUrl(decodedText)" 
                                :href="decodedText" 
                                target="_blank" 
                                class="action-btn visit"
                            >访问链接</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import QrScanner from 'qr-scanner'

export default {
    name: 'DeQrcode',
    data() {
        return {
            imageUrl: '',
            decodedText: ''
        }
    },
    methods: {
        triggerFileInput() {
            this.$refs.fileInput.click()
        },
        handleFileSelect(event) {
            const file = event.target.files[0]
            this.processFile(file)
        },
        handleDrop(event) {
            const file = event.dataTransfer.files[0]
            this.processFile(file)
        },
        async processFile(file) {
            if (!file || !file.type.startsWith('image/')) {
                alert('请选择有效的图片文件')
                return
            }

            this.imageUrl = URL.createObjectURL(file)
            try {
                const result = await QrScanner.scanImage(file)
                this.decodedText = result
            } catch (error) {
                alert('无法识别二维码，请确保图片清晰且包含有效的二维码')
                this.decodedText = ''
            }
        },
        async copyToClipboard() {
            try {
                await navigator.clipboard.writeText(this.decodedText)
                alert('已复制到剪贴板')
            } catch (err) {
                alert('复制失败，请手动复制')
            }
        },
        clearAll() {
            this.imageUrl = ''
            this.decodedText = ''
            this.$refs.fileInput.value = ''
        },
        isValidUrl(str) {
            try {
                new URL(str)
                return true
            } catch {
                return false
            }
        }
    }
}
</script>

<style scoped>
.qrcode-decoder {
    padding: 20px;
}

.decoder-container {
    margin-top: 20px;
}

.drop-zone {
    border: 2px dashed #ccc;
    border-radius: 8px;
    padding: 40px;
    text-align: center;
    cursor: pointer;
    transition: border-color 0.3s;
}

.drop-zone:hover {
    border-color: #2c3e50;
}

.upload-icon {
    font-size: 48px;
    margin-bottom: 10px;
}

.image-preview {
    margin: 20px 0;
    text-align: center;
}

.image-preview img {
    max-width: 300px;
    max-height: 300px;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 10px;
    background: white;
}

.result-section {
    margin-top: 20px;
}

.decoded-content {
    margin-top: 10px;
}

.result-text {
    width: 100%;
    min-height: 100px;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    resize: vertical;
    font-family: monospace;
    line-height: 1.5;
    margin-bottom: 10px;
}

.button-group {
    display: flex;
    gap: 10px;
    margin-top: 10px;
}

.action-btn {
    padding: 8px 20px;
    background-color: #2c3e50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;
    text-decoration: none;
}

.action-btn:hover {
    background-color: #34495e;
}

.action-btn.clear {
    background-color: #95a5a6;
}

.action-btn.clear:hover {
    background-color: #7f8c8d;
}

.action-btn.visit {
    background-color: #27ae60;
}

.action-btn.visit:hover {
    background-color: #219a52;
}

@media (max-width: 768px) {
    .image-preview img {
        max-width: 100%;
    }
    
    .button-group {
        flex-wrap: wrap;
    }
    
    .action-btn {
        flex: 1;
        min-width: 120px;
        text-align: center;
    }
}
</style> 