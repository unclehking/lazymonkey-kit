<template>
  <div class="image-compress">
    <div class="upload-area" 
         @drop.prevent="handleDrop" 
         @dragover.prevent
         @click="triggerFileInput">
      <input type="file" 
             ref="fileInput" 
             @change="handleFileChange" 
             accept="image/*" 
             style="display: none">
      <div class="upload-hint">
        <i class="fas fa-cloud-upload-alt"></i>
        <p>点击或拖拽图片到此处</p>
      </div>
    </div>

    <div v-if="originalImage" class="compress-options">
      <div class="quality-control">
        <span>压缩质量: {{ quality }}%</span>
        <input type="range" v-model="quality" min="1" max="100">
      </div>
      <button @click="compressImage" class="compress-btn">压缩图片</button>
    </div>

    <div v-if="compressedImage" class="result">
      <div class="image-compare">
        <div class="original">
          <h3>原图</h3>
          <img :src="originalImage" alt="原图">
          <p>大小: {{ formatFileSize(originalSize) }}</p>
        </div>
        <div class="compressed">
          <h3>压缩后</h3>
          <img :src="compressedImage" alt="压缩后">
          <p>大小: {{ formatFileSize(compressedSize) }}</p>
        </div>
      </div>
      <button @click="downloadImage" class="download-btn">下载压缩后的图片</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ImageCompress',
  data() {
    return {
      originalImage: null,
      compressedImage: null,
      quality: 80,
      originalSize: 0,
      compressedSize: 0
    }
  },
  methods: {
    triggerFileInput() {
      this.$refs.fileInput.click()
    },
    handleDrop(e) {
      const file = e.dataTransfer.files[0]
      if (file && file.type.startsWith('image/')) {
        this.processImage(file)
      }
    },
    handleFileChange(e) {
      const file = e.target.files[0]
      if (file) {
        this.processImage(file)
      }
    },
    processImage(file) {
      this.originalSize = file.size
      const reader = new FileReader()
      reader.onload = (e) => {
        this.originalImage = e.target.result
      }
      reader.readAsDataURL(file)
    },
    compressImage() {
      const img = new Image()
      img.src = this.originalImage
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        canvas.width = img.width
        canvas.height = img.height
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        this.compressedImage = canvas.toDataURL('image/jpeg', this.quality / 100)
        
        // 计算压缩后的大小
        this.compressedSize = Math.round(
          (this.compressedImage.length - 'data:image/jpeg;base64,'.length) * 3 / 4
        )
      }
    },
    downloadImage() {
      const link = document.createElement('a')
      link.download = 'compressed_image.jpg'
      link.href = this.compressedImage
      link.click()
    },
    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }
  }
}
</script>

<style scoped>
.image-compress {
  padding: 20px;
}

.upload-area {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  margin-bottom: 20px;
}

.upload-area:hover {
  border-color: #0065a0;
}

.upload-hint {
  color: #666;
}

.upload-hint i {
  font-size: 48px;
  margin-bottom: 10px;
}

.compress-options {
  margin: 20px 0;
}

.quality-control {
  margin-bottom: 15px;
}

.quality-control input {
  width: 200px;
  margin-left: 10px;
}

.compress-btn, .download-btn {
  background-color: #0065a0;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}

.compress-btn:hover, .download-btn:hover {
  background-color: #005286;
}

.image-compare {
  display: flex;
  gap: 20px;
  margin: 20px 0;
}

.original, .compressed {
  flex: 1;
  text-align: center;
}

.original img, .compressed img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}

h3 {
  margin-bottom: 10px;
  color: #333;
}
</style> 