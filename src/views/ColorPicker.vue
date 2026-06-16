<template>
  <div class="color-picker">
    <h2>屏幕取色器</h2>

    <div class="picker-area">
      <button v-if="isSupported" class="pick-btn" @click="pickColor">
        <span>✏️</span>点击取色
      </button>
      <p v-else class="unsupported">当前浏览器不支持 EyeDropper API，请使用 Chrome 或 Edge</p>
    </div>

    <div class="preview" :style="{ backgroundColor: color }"></div>

    <div class="formats">
      <div class="format-row" v-for="item in colorFormats" :key="item.label">
        <span class="label">{{ item.label }}</span>
        <code class="value">{{ item.value }}</code>
        <button class="copy-btn" @click="copyText(item.value)">复制</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      color: '#3498db',
      isSupported: !!window.EyeDropper
    }
  },
  computed: {
    colorFormats() {
      const hex = this.color.toUpperCase()
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      const rgb = `RGB(${r}, ${g}, ${b})`
      const rgba = `RGBA(${r}, ${g}, ${b}, 1)`
      const hsl = this.rgbToHsl(r, g, b)
      return [
        { label: 'HEX', value: hex },
        { label: 'RGB', value: rgb },
        { label: 'RGBA', value: rgba },
        { label: 'HSL', value: hsl }
      ]
    }
  },
  methods: {
    async pickColor() {
      try {
        const dropper = new EyeDropper()
        const result = await dropper.open()
        this.color = result.sRGBHex
      } catch (e) {
        // 用户取消取色
      }
    },
    rgbToHsl(r, g, b) {
      r /= 255; g /= 255; b /= 255
      const max = Math.max(r, g, b), min = Math.min(r, g, b)
      let h = 0, s = 0, l = (max + min) / 2
      if (max !== min) {
        const d = max - min
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
        if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        else if (max === g) h = ((b - r) / d + 2) / 6
        else h = ((r - g) / d + 4) / 6
      }
      return `HSL(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`
    },
    copyText(text) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          this.$toast.success('已复制到剪贴板')
        })
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = text
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
        this.$toast.success('已复制到剪贴板')
      }
    }
  }
}
</script>

<style scoped>
.color-picker {
  max-width: 640px;
  margin: 0 auto;
  padding: 20px;
}

h2 {
  margin-bottom: 24px;
  color: #333;
}

.picker-area {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
  background: #fff;
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.pick-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 40px;
  font-size: 18px;
  background: #3498db;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.pick-btn:hover {
  background: #2980b9;
}
.pick-btn span {
  transform: scaleX(-1);
  display: inline-block;
}
.unsupported {
  color: #999;
  text-align: center;
}

.preview {
  width: 100%;
  height: 80px;
  border-radius: 8px;
  margin-bottom: 20px;
  transition: background-color 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.formats {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.format-row {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.format-row:last-child {
  border-bottom: none;
}

.label {
  font-weight: 500;
  color: #666;
  width: 50px;
  flex-shrink: 0;
}

.value {
  flex: 1;
  font-size: 14px;
  color: #333;
}

.copy-btn {
  padding: 6px 16px;
  background: #3498db;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.2s;
}

.copy-btn:hover {
  background: #2980b9;
}
</style>
