<template>
  <div class="color-img">
    <div class="control-panel">
      <div class="input-group">
        <label>选择颜色：</label>
        <input type="color" v-model="color" class="color-picker">
        <span class="color-value">{{ color }}</span>
        <button @click="setRandomColor" class="random-btn" :style="{ backgroundColor: color }">
          随机颜色
        </button>
      </div>
      
      <div class="input-group">
        <label>图片宽度：</label>
        <input type="number" v-model="width" min="1" max="3000" class="size-input" @input="validateDimensions">
        <span>px</span>
      </div>
      
      <div class="input-group">
        <label>图片高度：</label>
        <input type="number" v-model="height" min="1" max="3000" class="size-input" @input="validateDimensions">
        <span>px</span>
      </div>
      
      <div class="input-group">
        <label>图片格式：</label>
        <select v-model="format" class="format-select">
          <option value="png">PNG</option>
          <option value="jpg">JPG</option>
          <option value="webp">WEBP</option>
          <option value="gif">GIF</option>
        </select>
      </div>
    </div>

    <div v-if="imageUrl" class="preview-panel">
      <h3>预览</h3>
      <div class="preview-container">
        <img :src="imageUrl" :alt="'纯色图片-'+color" class="preview-image">
      </div>
      <div class="image-info">
        <p>尺寸：{{ width }} x {{ height }} px</p>
        <p>格式：{{ format.toUpperCase() }}</p>
        <button @click="downloadImage" class="download-btn">
          <i class="fas fa-download"></i> 下载图片
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ColorImg',
  data() {
    return {
      color: this.generateRandomColor(),
      width: 300,
      height: 200,
      format: 'png',
      imageUrl: '',
      colorFormats: ['png', 'jpg', 'webp', 'gif']
    }
  },
  mounted() {
    this.generateImage()
  },
  watch: {
    color: {
      handler: 'generateImage',
      immediate: true
    },
    width: {
      handler(newVal) {
        this.width = parseInt(newVal) || 1;
        this.generateImage();
      }
    },
    height: {
      handler(newVal) {
        this.height = parseInt(newVal) || 1;
        this.generateImage();
      }
    },
    format: 'generateImage'
  },
  methods: {
    validateDimensions() {
      this.width = parseInt(this.width) || 1;
      this.height = parseInt(this.height) || 1;
      
      if (this.width < 1) this.width = 1;
      if (this.height < 1) this.height = 1;
    },
    generateImage() {
      this.validateDimensions()
      
      const canvas = document.createElement('canvas')
      canvas.width = this.width
      canvas.height = this.height
      
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = this.color
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      const mimeType = `image/${this.format === 'jpg' ? 'jpeg' : this.format}`
      this.imageUrl = canvas.toDataURL(mimeType, 1.0)
    },
    downloadImage() {
      if (!this.imageUrl) return
      
      const link = document.createElement('a')
      link.download = `color-${this.color.substring(1)}.${this.format}`
      link.href = this.imageUrl
      link.click()
    },
    generateRandomColor() {
      const letters = '0123456789ABCDEF'
      let color = '#'
      for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)]
      }
      return color
    },
    setRandomColor() {
      this.color = this.generateRandomColor()
    }
  }
}
</script>

<style scoped>
.color-img {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.control-panel {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.input-group {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  gap: 10px;
}

.input-group label {
  min-width: 80px;
}

.color-picker {
  width: 60px;
  height: 40px;
  padding: 0;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.color-value {
  font-family: monospace;
  color: #666;
}

.size-input {
  width: 100px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.format-select {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 100px;
}

.generate-btn {
  background: #0065a0;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  width: 100%;
  margin-top: 10px;
}

.generate-btn:hover {
  background: #005286;
}

.preview-panel {
  margin-top: 20px;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.preview-container {
  margin: 15px 0;
  border: 1px solid #eee;
  padding: 10px;
  border-radius: 4px;
  text-align: center;
}

.preview-image {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}

.image-info {
  color: #666;
  text-align: center;
}

.image-info p {
  margin: 5px 0;
}

.download-btn {
  background: #0065a0;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
}

.download-btn:hover {
  background: #005286;
}

h3 {
  margin: 0;
  color: #333;
}

.random-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
  transition: transform 0.2s ease;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}

.random-btn:hover {
  transform: scale(1.05);
}

/* 确保颜色文本在深色背景下可见 */
.random-btn {
  position: relative;
}

.random-btn::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(rgba(255,255,255,0.1), rgba(0,0,0,0.1));
  border-radius: 4px;
  pointer-events: none;
}
</style> 