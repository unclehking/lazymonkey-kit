<template>
  <div class="image-cut">
    <div class="upload-area" 
         @drop.prevent="handleDrop" 
         @dragover.prevent
         @click="triggerFileInput">
      <input type="file" 
             ref="fileInput" 
             @change="handleFileChange" 
             accept="image/*" 
             style="display: none">
      <div class="upload-hint" v-if="!imageUrl">
        <i class="fas fa-crop-alt"></i>
        <p>点击或拖拽图片到此处</p>
      </div>
    </div>

    <div v-if="imageUrl" class="editor-container">
      <div class="image-editor" ref="editorContainer">
        <img :src="imageUrl" 
             ref="sourceImage" 
             @load="initCropper"
             style="max-width: 100%;">
      </div>
      
      <div class="controls">
        <button @click="rotate(-90)" class="control-btn">
          <i class="fas fa-undo"></i> 向左旋转
        </button>
        <button @click="rotate(90)" class="control-btn">
          <i class="fas fa-redo"></i> 向右旋转
        </button>
        <button @click="resetCrop" class="control-btn">
          <i class="fas fa-sync"></i> 重置
        </button>
        <button @click="getCroppedImage" class="control-btn primary">
          <i class="fas fa-crop"></i> 截取图片
        </button>
      </div>
    </div>

    <div v-if="croppedImageUrl" class="result">
      <h3>截取结果</h3>
      <img :src="croppedImageUrl" alt="截取结果" class="cropped-image">
      <button @click="downloadImage" class="download-btn">
        <i class="fas fa-download"></i> 下载图片
      </button>
    </div>
  </div>
</template>

<script>
import Cropper from 'cropperjs'
import 'cropperjs/dist/cropper.css'

export default {
  name: 'ImageCut',
  data() {
    return {
      imageUrl: null,
      croppedImageUrl: null,
      cropper: null
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
      const reader = new FileReader()
      reader.onload = (e) => {
        this.imageUrl = e.target.result
        this.croppedImageUrl = null
      }
      reader.readAsDataURL(file)
    },
    initCropper() {
      if (this.cropper) {
        this.cropper.destroy()
      }
      
      this.cropper = new Cropper(this.$refs.sourceImage, {
        aspectRatio: NaN,
        viewMode: 2,
        dragMode: 'move',
        background: true,
        movable: true,
        rotatable: true,
        scalable: true,
        zoomable: true,
        zoomOnTouch: true,
        zoomOnWheel: true,
        cropBoxMovable: true,
        cropBoxResizable: true,
        guides: true,
        center: true,
        highlight: true,
        autoCrop: true
      })
    },
    rotate(degree) {
      if (this.cropper) {
        this.cropper.rotate(degree)
      }
    },
    resetCrop() {
      if (this.cropper) {
        this.cropper.reset()
      }
    },
    getCroppedImage() {
      if (this.cropper) {
        this.croppedImageUrl = this.cropper.getCroppedCanvas().toDataURL()
      }
    },
    downloadImage() {
      if (this.croppedImageUrl) {
        const link = document.createElement('a')
        link.download = 'cropped-image.png'
        link.href = this.croppedImageUrl
        link.click()
      }
    }
  },
  beforeUnmount() {
    if (this.cropper) {
      this.cropper.destroy()
    }
  }
}
</script>

<style scoped>
.image-cut {
  padding: 20px;
}

.upload-area {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  margin-bottom: 20px;
  min-height: 200px;
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

.editor-container {
  margin: 20px 0;
}

.image-editor {
  max-width: 100%;
  margin-bottom: 20px;
}

.controls {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.control-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
}

.control-btn:hover {
  background: #f5f5f5;
}

.control-btn.primary {
  background: #0065a0;
  color: white;
  border: none;
}

.control-btn.primary:hover {
  background: #005286;
}

.result {
  margin-top: 20px;
  text-align: center;
}

.cropped-image {
  max-width: 100%;
  margin: 20px 0;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.download-btn {
  background: #0065a0;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.download-btn:hover {
  background: #005286;
}

h3 {
  color: #333;
  margin-bottom: 15px;
}
</style> 