<template>
  <div class="text-processing">
    <h2>文字处理</h2>
    
    <div class="tools-container">
      <!-- 工具栏 -->
      <div class="toolbar">
        <button 
          v-for="tool in tools" 
          :key="tool.name"
          @click="selectTool(tool)"
          :class="{ active: currentTool === tool.name }"
          class="tool-btn">
          {{ tool.label }}
        </button>
      </div>

      <!-- 文本输入输出区域 -->
      <div class="text-area-container">
        <div class="input-section">
          <label>输入文本：</label>
          <textarea 
            v-model="inputText"
            placeholder="请输入要处理的文本"
            @input="processText"
          ></textarea>
          <div class="char-count">字符数：{{ inputText.length }}</div>
        </div>

        <div class="output-section">
          <label>处理结果：</label>
          <textarea 
            v-model="outputText"
            readonly
            placeholder="处理后的文本将显示在这里"
          ></textarea>
          <button @click="copyToClipboard" class="copy-btn">复制结果</button>
        </div>
      </div>

      <!-- 当前工具的选项设置 -->
      <div v-if="currentTool && tools.find(t => t.name === currentTool).options" class="tool-options">
        <div class="options-title">选项设置：</div>
        <div class="options-content">
          <component 
            :is="tools.find(t => t.name === currentTool).options"
            v-model="toolOptions"
            @change="processText"
          ></component>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TextProcessing',
  data() {
    return {
      inputText: '',
      outputText: '',
      currentTool: 'case',
      toolOptions: {},
      tools: [
        {
          name: 'case',
          label: '大小写转换',
          process: (text, options) => {
            switch(options.caseType) {
              case 'upper': return text.toUpperCase();
              case 'lower': return text.toLowerCase();
              case 'capitalize': return text.replace(/\b\w/g, c => c.toUpperCase());
              default: return text;
            }
          },
          options: {
            template: `
              <select v-model="options.caseType">
                <option value="upper">转大写</option>
                <option value="lower">转小写</option>
                <option value="capitalize">首字母大写</option>
              </select>
            `,
            data() {
              return {
                options: {
                  caseType: 'upper'
                }
              }
            }
          }
        },
        {
          name: 'trim',
          label: '去除空格',
          process: (text, options) => {
            if (options.trimType === 'all') {
              return text.replace(/\s+/g, '');
            }
            return text.trim();
          },
          options: {
            template: `
              <select v-model="options.trimType">
                <option value="ends">去除首尾空格</option>
                <option value="all">去除所有空格</option>
              </select>
            `,
            data() {
              return {
                options: {
                  trimType: 'ends'
                }
              }
            }
          }
        },
        {
          name: 'format',
          label: '格式化',
          process: (text) => {
            try {
              return JSON.stringify(JSON.parse(text), null, 2);
            } catch {
              return text;
            }
          }
        }
      ]
    }
  },
  methods: {
    selectTool(tool) {
      this.currentTool = tool.name;
      this.toolOptions = {};
      this.processText();
    },
    processText() {
      const tool = this.tools.find(t => t.name === this.currentTool);
      if (tool) {
        this.outputText = tool.process(this.inputText, this.toolOptions);
      }
    },
    async copyToClipboard() {
      try {
        await navigator.clipboard.writeText(this.outputText);
        alert('已复制到剪贴板');
      } catch (err) {
        alert('复制失败，请手动复制');
      }
    }
  }
}
</script>

<style scoped>
.text-processing {
  padding: 20px;
}

.tools-container {
  margin-top: 20px;
}

.toolbar {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}

.tool-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  transition: all 0.3s;
}

.tool-btn.active {
  background: #2c3e50;
  color: white;
  border-color: #2c3e50;
}

.text-area-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.input-section, .output-section {
  display: flex;
  flex-direction: column;
}

label {
  margin-bottom: 8px;
  font-weight: 500;
}

textarea {
  height: 300px;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
  font-family: monospace;
  line-height: 1.5;
}

.char-count {
  margin-top: 8px;
  color: #666;
  font-size: 0.9em;
}

.copy-btn {
  margin-top: 8px;
  padding: 8px;
  background: #2c3e50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.copy-btn:hover {
  background: #34495e;
}

.tool-options {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
  margin-top: 20px;
}

.options-title {
  font-weight: 500;
  margin-bottom: 10px;
}

@media (max-width: 768px) {
  .text-area-container {
    grid-template-columns: 1fr;
  }
  
  .toolbar {
    flex-wrap: wrap;
  }
  
  textarea {
    height: 200px;
  }
}
</style> 