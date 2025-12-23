<template>
    <div class="base64-to-img">
        <h2>Base64转图片</h2>

        <div class="convert-container">
            <div class="input-section">
                <label>输入Base64编码：</label>
                <textarea 
                    v-model="base64Input"
                    placeholder="请输入图片的Base64编码（以data:image开头）"
                    class="base64-input"
                    @input="handleInput"
                ></textarea>
                <div class="button-group">
                    <button @click="addPngPrefix" class="action-btn secondary">添加png图片前缀</button>
                    <button @click="pasteFromClipboard" class="action-btn">从剪贴板粘贴</button>
                    <button @click="clearInput" class="action-btn clear">清空</button>
                </div>
            </div>

            <div class="preview-section" v-if="imageUrl">
                <label>预览图片：</label>
                <div class="image-preview">
                    <img :src="imageUrl" alt="预览图">
                </div>
                <div class="button-group">
                    <button @click="downloadImage" class="action-btn">下载图片</button>
                </div>
                <div class="image-info" v-if="imageInfo">
                    <p>图片信息：</p>
                    <ul>
                        <li>格式：{{ imageInfo.format }}</li>
                        <li>大小：{{ imageInfo.size }}</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'Base64ToImg',
    data() {
        return {
            base64Input: '',
            imageUrl: '',
            imageInfo: null
        }
    },
    mounted() {
        document.addEventListener('paste', this.handlePaste)
    },
    beforeUnmount() {
        document.removeEventListener('paste', this.handlePaste)
    },
    methods: {
        handleInput() {
            this.validateAndPreview()
        },
        validateAndPreview() {
            if (!this.base64Input.trim()) {
                this.imageUrl = ''
                this.imageInfo = null
                return
            }

            try {
                // 验证base64格式
                if (!this.base64Input.startsWith('data:image')) {
                    throw new Error('无效的图片Base64格式')
                }

                this.imageUrl = this.base64Input
                this.updateImageInfo()
            } catch (err) {
                this.$toast.error('无效的Base64编码：' + err.message)
                this.imageUrl = ''
                this.imageInfo = null
            }
        },
        updateImageInfo() {
            const match = this.base64Input.match(/^data:image\/(\w+);base64,/)
            if (match) {
                const format = match[1].toUpperCase()
                const size = this.calculateSize(this.base64Input)
                this.imageInfo = {
                    format,
                    size: this.formatSize(size)
                }
            }
        },
        calculateSize(base64String) {
            const padding = base64String.endsWith('==') ? 2 : base64String.endsWith('=') ? 1 : 0
            const base64Length = base64String.substring(base64String.indexOf(',') + 1).length - padding
            return Math.floor((base64Length * 3) / 4)
        },
        formatSize(bytes) {
            if (bytes < 1024) return bytes + ' B'
            if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
            return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
        },
        async pasteFromClipboard() {
            try {
                const text = await navigator.clipboard.readText()
                this.base64Input = text
                this.validateAndPreview()
            } catch (err) {
                this.$toast.error('从剪贴板读取失败')
            }
        },
        addPngPrefix() {
            const prefix = 'data:image/png;base64,'
            if (!this.base64Input.startsWith(prefix)) {
                this.base64Input = prefix + this.base64Input.trim()
            }
            this.validateAndPreview()
        },
        clearInput() {
            this.base64Input = ''
            this.imageUrl = ''
            this.imageInfo = null
        },
        downloadImage() {
            if (!this.imageUrl) return

            const link = document.createElement('a')
            link.href = this.imageUrl
            link.download = `image.${this.imageInfo?.format.toLowerCase() || 'png'}`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        },
        handlePaste(event) {
            const items = event.clipboardData.items
            for (let item of items) {
                if (item.type.indexOf('image') !== -1) {
                    const file = item.getAsFile()
                    const reader = new FileReader()
                    reader.onload = (e) => {
                        this.base64Input = e.target.result
                    }
                    reader.readAsDataURL(file)
                    break
                }
            }
        }
    }
}
</script>

<style scoped>
.base64-to-img {
    padding: 20px;
}

.convert-container {
    margin-top: 20px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
}

.base64-input {
    width: 100%;
    height: 300px;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    resize: vertical;
    font-family: monospace;
    font-size: 14px;
    line-height: 1.5;
    margin: 8px 0;
}

.image-preview {
    margin: 8px 0;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 10px;
    text-align: center;
    background: #fff;
}

.image-preview img {
    max-width: 100%;
    max-height: 300px;
    object-fit: contain;
}

.button-group {
    display: flex;
    gap: 10px;
    margin: 10px 0;
}

.action-btn {
    padding: 8px 20px;
    background-color: #2c3e50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;
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

.action-btn.secondary {
    background-color: #5a6b7a;
}

.action-btn.secondary:hover {
    background-color: #4d5b69;
}

.image-info {
    margin-top: 15px;
    padding: 10px;
    background: #f8f9fa;
    border-radius: 4px;
}

.image-info ul {
    list-style: none;
    padding: 0;
    margin: 5px 0 0;
}

.image-info li {
    margin: 5px 0;
    color: #666;
}

@media (max-width: 768px) {
    .convert-container {
        grid-template-columns: 1fr;
    }
    
    .base64-input {
        height: 200px;
    }
}
</style> 