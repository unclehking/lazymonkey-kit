<template>
    <div class="ascii-convert">
        <h2>ASCII编码/解码</h2>

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
                    :placeholder="mode === 'encode' ? '请输入要编码的文本' : '请输入要解码的ASCII码（用空格分隔）'"
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
                    :placeholder="mode === 'encode' ? 'ASCII编码结果将显示在这里' : '解码结果将显示在这里'"
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
    name: 'ASCII',
    data() {
        return {
            inputText: '',
            outputText: '',
            mode: 'encode'
        }
    },
    methods: {
        handleConvert() {
            if (this.mode === 'encode') {
                this.encodeToASCII()
            } else {
                this.decodeFromASCII()
            }
        },
        encodeToASCII() {
            try {
                const ascii = this.inputText
                    .split('')
                    .map(char => char.charCodeAt(0))
                    .join(' ')
                this.outputText = ascii
            } catch (err) {
                this.outputText = '编码失败，请检查输入'
            }
        },
        decodeFromASCII() {
            try {
                const text = this.inputText
                    .trim()
                    .split(/\s+/)
                    .map(num => String.fromCharCode(parseInt(num, 10)))
                    .join('')
                this.outputText = text
            } catch (err) {
                this.outputText = '解码失败，请确保输入的是有效的ASCII码（数字之间用空格分隔）'
            }
        },
        async copyToClipboard() {
            try {
                await navigator.clipboard.writeText(this.outputText)
                alert('已复制到剪贴板')
            } catch (err) {
                alert('复制失败，请手动复制')
            }
        },
        clearAll() {
            this.inputText = ''
            this.outputText = ''
        }
    },
    watch: {
        mode() {
            this.inputText = ''
            this.outputText = ''
        }
    }
}
</script>

<style scoped>
.ascii-convert {
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