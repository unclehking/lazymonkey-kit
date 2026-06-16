<template>
  <div class="password-generator">
    <h2>密码生成器</h2>

    <div class="settings">
      <div class="setting-row">
        <label>密码位数</label>
        <div class="slider-group">
          <input type="range" v-model.number="length" min="4" max="64" />
          <input type="number" v-model.number="length" min="4" max="64" class="length-input" />
        </div>
      </div>

      <div class="setting-row">
        <label>复杂度</label>
        <select v-model="complexity" @change="onComplexityChange">
          <option value="low">低 - 仅数字</option>
          <option value="medium">中 - 数字 + 小写字母</option>
          <option value="high">高 - 数字 + 大小写字母</option>
          <option value="extreme">极高 - 数字 + 大小写字母 + 特殊字符</option>
        </select>
      </div>

      <div class="setting-row checkbox-group">
        <label>
          <input type="checkbox" v-model="options.uppercase" /> 大写字母 (A-Z)
        </label>
        <label>
          <input type="checkbox" v-model="options.lowercase" /> 小写字母 (a-z)
        </label>
        <label>
          <input type="checkbox" v-model="options.numbers" /> 数字 (0-9)
        </label>
        <label>
          <input type="checkbox" v-model="options.symbols" /> 特殊字符 (!@#$%...)</label>
      </div>

      <div class="setting-row">
        <label>
          <input type="checkbox" v-model="excludeAmbiguous" /> 排除容易混淆的字符 (0OoIl1)
        </label>
      </div>

    </div>

    <div v-if="passwords.length" class="result">
      <div class="result-header">
        <h3>生成结果</h3>
        <span class="hint">点击密码即可复制</span>
      </div>
      <div
        v-for="(pwd, index) in passwords"
        :key="index"
        class="password-item"
        @click="copyPassword(pwd)"
      >
        <code>{{ pwd }}</code>
        <span class="copy-icon">
          <i class="fas fa-copy"></i>
        </span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      length: 16,
      complexity: 'high',
      excludeAmbiguous: false,
      passwords: [],
      options: {
        uppercase: true,
        lowercase: true,
        numbers: true,
        symbols: false
      }
    }
  },
  watch: {
    length() { this.generate() },
    complexity() {
      this.onComplexityChange()
      this.generate()
    },
    excludeAmbiguous() { this.generate() },
    'options.uppercase'() { this.generate() },
    'options.lowercase'() { this.generate() },
    'options.numbers'() { this.generate() },
    'options.symbols'() { this.generate() }
  },
  methods: {
    onComplexityChange() {
      const presets = {
        low: { uppercase: false, lowercase: false, numbers: true, symbols: false },
        medium: { uppercase: false, lowercase: true, numbers: true, symbols: false },
        high: { uppercase: true, lowercase: true, numbers: true, symbols: false },
        extreme: { uppercase: true, lowercase: true, numbers: true, symbols: true }
      }
      this.options = { ...presets[this.complexity] }
    },
    generate() {
      const CHARS = {
        uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        lowercase: 'abcdefghijklmnopqrstuvwxyz',
        numbers: '0123456789',
        symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
      }
      const AMBIGUOUS = '0OoIl1'

      let pool = ''
      if (this.options.uppercase) pool += CHARS.uppercase
      if (this.options.lowercase) pool += CHARS.lowercase
      if (this.options.numbers) pool += CHARS.numbers
      if (this.options.symbols) pool += CHARS.symbols

      if (!pool) {
        this.$toast.error('请至少选择一种字符类型')
        return
      }

      if (this.excludeAmbiguous) {
        pool = pool.split('').filter(c => !AMBIGUOUS.includes(c)).join('')
      }

      if (!pool) {
        this.$toast.error('排除混淆字符后无可选字符')
        return
      }

      const count = 5
      this.passwords = []
      for (let i = 0; i < count; i++) {
        let pwd = ''
        const arr = new Uint32Array(this.length)
        crypto.getRandomValues(arr)
        for (let j = 0; j < this.length; j++) {
          pwd += pool[arr[j] % pool.length]
        }
        this.passwords.push(pwd)
      }
    },
    copyPassword(pwd) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(pwd).then(() => {
          this.$toast.success('已复制到剪贴板')
        })
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = pwd
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
        this.$toast.success('已复制到剪贴板')
      }
    }
  },
  mounted() {
    this.onComplexityChange()
    this.generate()
  }
}
</script>

<style scoped>
.password-generator {
  max-width: 640px;
  margin: 0 auto;
  padding: 20px;
}

h2 {
  margin-bottom: 24px;
  color: #333;
}

.settings {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.setting-row {
  margin-bottom: 18px;
}

.setting-row:last-child {
  margin-bottom: 0;
}

.setting-row > label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #444;
}

.slider-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.slider-group input[type="range"] {
  flex: 1;
  height: 6px;
}

.length-input {
  width: 60px;
  padding: 6px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  text-align: center;
  font-size: 14px;
}

select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  background: #fff;
}

.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 400;
  cursor: pointer;
}

.result {
  margin-top: 24px;
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.result-header h3 {
  margin: 0;
  color: #333;
}

.hint {
  font-size: 12px;
  color: #999;
}

.password-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  margin-bottom: 8px;
  background: #f8f9fa;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
  word-break: break-all;
}

.password-item:hover {
  background: #e8f4fd;
}

.password-item code {
  font-size: 15px;
  color: #333;
}

.copy-icon {
  flex-shrink: 0;
  margin-left: 12px;
  color: #999;
}

.password-item:hover .copy-icon {
  color: #3498db;
}

@media (max-width: 600px) {
  .checkbox-group {
    flex-direction: column;
    gap: 10px;
  }
}
</style>
