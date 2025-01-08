<template>
    <div class="base64-convert">
        <h2>图片转Base64</h2>

        <div class="upload-area">
            <div class="drop-zone" 
                 @drop.prevent="handleDrop"
                 @dragover.prevent
                 @click="triggerFileInput">
                <i class="upload-icon">📁</i>
                <p>点击或拖拽图片到此处</p>
                <input 
                    type="file"
                    ref="fileInput"
                    @change="handleFileSelect"
                    accept="image/*"
                    style="display: none"
                >
            </div>
        </div>

        <div v-if="selectedImage" class="image-preview">
            <img :src="imagePreview" alt="预览图">
            <div class="result-container">
                <textarea
                    v-model="base64Result"
                    readonly
                    placeholder="Base64编码将显示在这里"
                    class="base64-output"
                ></textarea>
                <div class="button-group">
                    <button @click="copyToClipboard" class="action-btn">复制Base64</button>
                    <button @click="downloadAsText" class="action-btn">下载为文本文件</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'Base64Convert',
    data() {
        return {
            selectedImage: null,
            imagePreview: '',
            base64Result: ''
        }
    },
    methods: {
        triggerFileInput() {
            this.$refs.fileInput.click()
        },
        handleFileSelect(event) {
            const file = event.target.files[0]
            this.processSelectedFile(file)
        },
        handleDrop(event) {
            const file = event.dataTransfer.files[0]
            this.processSelectedFile(file)
        },
        processSelectedFile(file) {
            if (file && file.type.startsWith('image/')) {
                this.selectedImage = file
                this.imagePreview = URL.createObjectURL(file)
                
                // 转换为Base64
                const reader = new FileReader()
                reader.onload = (e) => {
                    this.base64Result = e.target.result
                }
                reader.readAsDataURL(file)
            } else {
                alert('请选择有效的图片文件')
            }
        },
        async copyToClipboard() {
            try {
                await navigator.clipboard.writeText(this.base64Result)
                alert('Base64编码已复制到剪贴板')
            } catch (err) {
                alert('复制失败，请手动复制')
            }
        },
        downloadAsText() {
            const blob = new Blob([this.base64Result], { type: 'text/plain' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = 'image-base64.txt'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
        }
    }
}
</script>

<style scoped>
.base64-convert {
    padding: 20px;
}

.upload-area {
    margin: 20px 0;
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
    margin-top: 20px;
    text-align: center;
}

.image-preview img {
    max-width: 100%;
    max-height: 300px;
    border-radius: 4px;
    margin-bottom: 20px;
}

.result-container {
    margin-top: 20px;
}

.base64-output {
    width: 100%;
    height: 150px;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    resize: vertical;
    font-family: monospace;
    font-size: 14px;
    line-height: 1.5;
    margin-bottom: 10px;
}

.button-group {
    display: flex;
    gap: 10px;
    justify-content: center;
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
}

.action-btn:hover {
    background-color: #34495e;
}
</style> 