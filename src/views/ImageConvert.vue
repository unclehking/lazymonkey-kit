<template>
    <div class="image-convert">
        <h2>图片格式转换</h2>

        <div class="upload-area">
            <div class="drop-zone" @drop.prevent="handleDrop" @dragover.prevent @click="triggerFileInput">
                <i class="upload-icon">📁</i>
                <p>点击或拖拽图片到此处</p>
                <input type="file" ref="fileInput" @change="handleFileSelect" accept="image/*" style="display: none">
            </div>
        </div>

        <div v-if="selectedImage" class="image-preview">
            <img :src="imagePreview" alt="预览图">
            <div class="convert-options">
                <select v-model="targetFormat">
                    <option value="jpeg">JPEG</option>
                    <option value="png">PNG</option>
                    <option value="webp">WEBP</option>
                    <option value="gif">GIF</option>
                </select>
                <button @click="convertImage" class="convert-btn">开始转换</button>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'ImageConvert',
    data() {
        return {
            selectedImage: null,
            imagePreview: '',
            targetFormat: 'jpeg'
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
            } else {
                alert('请选择有效的图片文件')
            }
        },
        convertImage() {
            // TODO: 实现图片转换逻辑
            console.log(`Converting image to ${this.targetFormat}...`)
            // 创建canvas元素用于图片转换
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            
            // 创建新图片对象
            const img = new Image()
            img.src = this.imagePreview
            
            img.onload = () => {
                // 设置canvas尺寸与原图一致
                canvas.width = img.width
                canvas.height = img.height
                
                // 将图片绘制到canvas
                ctx.drawImage(img, 0, 0)
                
                // 根据目标格式获取转换后的图片数据
                let mimeType = 'image/jpeg'
                switch(this.targetFormat) {
                    case 'png':
                        mimeType = 'image/png'
                        break
                    case 'webp':
                        mimeType = 'image/webp'
                        break
                    case 'gif':
                        mimeType = 'image/gif'
                        break
                }
                
                // 转换图片
                const convertedImageData = canvas.toDataURL(mimeType)
                
                // 创建下载链接
                const link = document.createElement('a')
                link.download = `converted-image.${this.targetFormat}`
                link.href = convertedImageData
                
                // 触发下载
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
            }
        }
    }
}
</script>

<style scoped>
.image-convert {
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
    max-height: 400px;
    border-radius: 4px;
}

.convert-options {
    margin-top: 20px;
    display: flex;
    gap: 10px;
    justify-content: center;
}

select {
    padding: 8px 16px;
    border-radius: 4px;
    border: 1px solid #ccc;
}

.convert-btn {
    padding: 8px 20px;
    background-color: #2c3e50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;
}

.convert-btn:hover {
    background-color: #34495e;
}
</style>