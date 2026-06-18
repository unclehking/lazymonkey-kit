<template>
    <div class="timestamp-convert">
        <h2>Unix时间戳转换</h2>

        <div class="current-time-section">
            <div class="current-time-card">
                <div class="current-row">
                    <span class="label">当前时间戳：</span>
                    <span class="value mono">{{ currentTimestamp }}</span>
                    <button @click="fillAndConvert(currentTimestamp, 'ts2time')" class="small-btn">转换</button>
                </div>
                <div class="current-row">
                    <span class="label">当前时间：</span>
                    <span class="value mono">{{ currentFormatted }}</span>
                    <button @click="fillAndConvert(currentFormatted, 'time2ts')" class="small-btn">转换</button>
                </div>
            </div>
        </div>

        <div class="convert-container">
            <div class="input-section">
                <div class="input-header">
                    <label>输入：</label>
                    <select v-model="mode" class="mode-select">
                        <option value="ts2time">时间戳 → 时间</option>
                        <option value="time2ts">时间 → 时间戳</option>
                    </select>
                </div>
                <textarea
                    v-model="inputText"
                    :placeholder="mode === 'ts2time' ? '请输入Unix时间戳（秒或毫秒）' : '请输入日期时间，如 2026-06-18 12:00:00'"
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
                    placeholder="转换结果将显示在这里"
                ></textarea>
                <div class="button-group">
                    <button @click="copyText(outputText)" class="action-btn">复制结果</button>
                    <button @click="clearAll" class="action-btn clear">清空</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'TimestampConvert',
    data() {
        return {
            inputText: '',
            outputText: '',
            mode: 'ts2time',
            currentTimestamp: '',
            currentFormatted: '',
            timer: null
        }
    },
    mounted() {
        this.updateCurrentTime()
        this.timer = setInterval(this.updateCurrentTime, 1000)
    },
    beforeUnmount() {
        if (this.timer) {
            clearInterval(this.timer)
        }
    },
    methods: {
        updateCurrentTime() {
            const now = Math.floor(Date.now() / 1000)
            this.currentTimestamp = String(now)
            this.currentFormatted = this.formatDate(new Date())
        },
        formatDate(date) {
            const pad = (n) => String(n).padStart(2, '0')
            const y = date.getFullYear()
            const m = pad(date.getMonth() + 1)
            const d = pad(date.getDate())
            const h = pad(date.getHours())
            const min = pad(date.getMinutes())
            const s = pad(date.getSeconds())
            return `${y}-${m}-${d} ${h}:${min}:${s}`
        },
        handleConvert() {
            if (!this.inputText.trim()) {
                this.outputText = ''
                return
            }
            if (this.mode === 'ts2time') {
                this.convertTs2Time()
            } else {
                this.convertTime2Ts()
            }
        },
        convertTs2Time() {
            const ts = this.inputText.trim()
            const num = Number(ts)
            if (isNaN(num)) {
                this.outputText = '请输入有效的数字时间戳'
                return
            }
            // 毫秒级时间戳 (13位) vs 秒级 (10位)
            const date = num > 1e12 ? new Date(num) : new Date(num * 1000)
            if (isNaN(date.getTime())) {
                this.outputText = '无效的时间戳'
                return
            }
            this.outputText = this.formatDate(date)
        },
        convertTime2Ts() {
            const str = this.inputText.trim()
            const date = new Date(str)
            if (isNaN(date.getTime())) {
                this.outputText = '无法解析日期时间，请使用如 2026-06-18 12:00:00 的格式'
                return
            }
            this.outputText = `秒级时间戳：${Math.floor(date.getTime() / 1000)}\n毫秒级时间戳：${date.getTime()}`
        },
        async copyText(text) {
            if (!text) {
                this.$toast.error('没有可复制的内容')
                return
            }
            try {
                await navigator.clipboard.writeText(text)
                this.$toast.success('已复制到剪贴板')
            } catch (err) {
                this.$toast.error('复制失败，请手动复制')
            }
        },
        fillAndConvert(value, mode) {
            this.mode = mode
            this.inputText = value
            this.handleConvert()
        },
        clearAll() {
            this.inputText = ''
            this.outputText = ''
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
.timestamp-convert {
    padding: 20px;
}

.current-time-section {
    margin-top: 20px;
    margin-bottom: 20px;
}

.current-time-card {
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    padding: 16px 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.current-row {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
}

.current-row .label {
    color: #666;
    white-space: nowrap;
}

.current-row .value {
    color: #2c3e50;
    font-weight: 600;
}

.mono {
    font-family: monospace;
    font-size: 15px;
}

.small-btn {
    padding: 3px 10px;
    font-size: 12px;
    background-color: #2c3e50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;
}

.small-btn:hover {
    background-color: #34495e;
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
    height: 200px;
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
        height: 150px;
    }
}
</style>
