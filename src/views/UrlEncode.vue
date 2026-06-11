<template>
    <div class="url-encode">
        <h2>URL编码/解码</h2>

        <div class="convert-container">
            <div class="input-section">
                <div class="input-header">
                    <label>输入文本：</label>
                    <select v-model="mode" class="mode-select">
                        <option value="encode">编码</option>
                        <option value="decode">解码</option>
                    </select>
                </div>
                <textarea
                    v-model="inputText"
                    :placeholder="mode === 'encode' ? '请输入要编码的文本' : '请输入要解码的URL编码字符串'"
                    @input="handleConvert"
                    class="text-area"
                ></textarea>
            </div>

            <div class="output-section">
                <label>转换结果：</label>
                <textarea
                    v-model="outputText"
                    readonly
                    class="text-area"
                    :placeholder="mode === 'encode' ? 'URL编码结果将显示在这里' : '解码结果将显示在这里'"
                ></textarea>
                <div class="button-group">
                    <button @click="copyToClipboard" class="action-btn">复制结果</button>
                    <button @click="clearAll" class="action-btn clear">清空</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'UrlEncode',
    data() {
        return {
            inputText: localStorage.getItem('url_encode_input') || '',
            outputText: '',
            mode: localStorage.getItem('url_encode_mode') || 'encode'
        }
    },
    mounted() {
        if (this.inputText) {
            this.handleConvert()
        }
    },
    methods: {
        handleConvert() {
            if (this.mode === 'encode') {
                try {
                    this.outputText = encodeURIComponent(this.inputText)
                    localStorage.setItem('url_encode_input', this.inputText)
                    localStorage.setItem('url_encode_mode', 'encode')
                } catch (e) {
                    this.outputText = '编码失败：' + e.message
                }
            } else {
                try {
                    this.outputText = decodeURIComponent(this.inputText)
                    localStorage.setItem('url_encode_input', this.inputText)
                    localStorage.setItem('url_encode_mode', 'decode')
                } catch (e) {
                    this.outputText = '解码失败，输入的不是有效的URL编码字符串'
                }
            }
        },
        async copyToClipboard() {
            if (!this.outputText) {
                this.$toast.error('没有可复制的内容')
                return
            }
            try {
                await navigator.clipboard.writeText(this.outputText)
                this.$toast.success('已复制到剪贴板')
            } catch (err) {
                this.$toast.error('复制失败，请手动复制')
            }
        },
        clearAll() {
            this.inputText = ''
            this.outputText = ''
            localStorage.removeItem('url_encode_input')
            localStorage.removeItem('url_encode_mode')
        }
    },
    watch: {
        mode() {
            this.outputText = ''
            if (this.inputText) {
                this.handleConvert()
            }
        }
    }
}
</script>

<style scoped>
.url-encode {
    padding: 20px;
}

.convert-container {
    margin-top: 20px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
}

.input-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.mode-select {
    padding: 4px 8px;
    border-radius: 4px;
    border: 1px solid #ddd;
}

.text-area {
    width: 100%;
    height: 300px;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    resize: vertical;
    font-family: monospace;
    font-size: 13px;
    line-height: 1.5;
}

.button-group {
    margin-top: 10px;
    display: flex;
    gap: 10px;
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

@media (max-width: 768px) {
    .convert-container {
        grid-template-columns: 1fr;
    }

    .text-area {
        height: 200px;
    }
}
</style>
