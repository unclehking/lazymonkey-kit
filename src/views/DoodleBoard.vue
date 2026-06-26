<template>
    <div class="doodle-board">
        <h2 class="page-title">涂鸦画板</h2>
        <div class="toolbar">
            <div class="tool-group">
                <label class="tool-label">工具</label>
                <div class="tool-tabs">
                    <button
                        v-for="tool in tools"
                        :key="tool.value"
                        @click="selectTool(tool.value)"
                        class="tool-tab"
                        :class="{ active: currentTool === tool.value }"
                    >
                        {{ tool.label }}
                    </button>
                </div>
            </div>
            <div class="tool-group">
                <label class="tool-label">颜色</label>
                <input type="color" v-model="penColor" class="color-input" />
            </div>
            <div class="tool-group">
                <label class="tool-label">{{ currentTool === 'text' ? '字号' : '粗细' }}</label>
                <input
                    v-if="currentTool === 'text'"
                    type="range"
                    v-model.number="textSize"
                    min="12"
                    max="72"
                    class="size-slider"
                />
                <input
                    v-else
                    type="range"
                    v-model.number="penSize"
                    min="1"
                    max="50"
                    class="size-slider"
                />
                <span class="size-value">{{ currentSize }}px</span>
            </div>
            <div class="tool-group" v-if="currentTool === 'text'">
                <label class="tool-label">文字</label>
                <input
                    v-model="textValue"
                    class="text-input"
                    placeholder="输入文字后点击画布"
                    @keyup.enter="focusCanvasText"
                />
            </div>
            <div class="tool-group">
                <button @click="undo" class="tool-btn" :disabled="historyStack.length === 0">撤销</button>
                <button @click="clearCanvas" class="tool-btn danger">清空</button>
                <button @click="saveImage" class="tool-btn primary">保存图片</button>
            </div>
        </div>
        <div class="canvas-wrapper" ref="canvasWrapper">
            <canvas
                ref="canvas"
                @mousedown="startDraw"
                @mousemove="drawing"
                @mouseup="endDraw"
                @mouseleave="endDraw"
                @touchstart.prevent="touchStart"
                @touchmove.prevent="touchMove"
                @touchend.prevent="endDraw"
            ></canvas>
            <textarea
                v-if="textEditor.visible"
                ref="textEditor"
                v-model="textEditor.value"
                class="canvas-text-editor"
                :style="textEditorStyle"
                @keydown.ctrl.enter.prevent="commitText"
                @keydown.meta.enter.prevent="commitText"
            ></textarea>
            <div v-if="textEditor.visible" class="text-actions" :style="textActionsStyle">
                <button @click="commitText" class="tool-btn primary">确定</button>
                <button @click="cancelText" class="tool-btn">取消</button>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            tools: [
                { label: '画笔', value: 'pen' },
                { label: '矩形', value: 'rect' },
                { label: '圆形', value: 'circle' },
                { label: '文字', value: 'text' }
            ],
            currentTool: 'pen',
            penColor: '#000000',
            penSize: 3,
            textSize: 24,
            textValue: '双击编辑文字',
            textEditor: {
                visible: false,
                x: 0,
                y: 0,
                value: ''
            },
            isDrawing: false,
            ctx: null,
            startPoint: null,
            previewSnapshot: null,
            historyStack: []
        }
    },
    computed: {
        currentSize() {
            return this.currentTool === 'text' ? this.textSize : this.penSize
        },
        textEditorStyle() {
            return {
                left: this.textEditor.x + 'px',
                top: this.textEditor.y + 'px',
                color: this.penColor,
                fontSize: this.textSize + 'px',
                lineHeight: Math.max(this.textSize * 1.35, 18) + 'px',
                minWidth: Math.max(this.textSize * 8, 120) + 'px',
                minHeight: Math.max(this.textSize * 2.4, 48) + 'px'
            }
        },
        textActionsStyle() {
            return {
                left: this.textEditor.x + 'px',
                top: this.textEditor.y + Math.max(this.textSize * 2.4, 48) + 8 + 'px'
            }
        }
    },
    mounted() {
        this.initCanvas()
        window.addEventListener('resize', this.initCanvas)
    },
    beforeUnmount() {
        window.removeEventListener('resize', this.initCanvas)
    },
    methods: {
        initCanvas() {
            const canvas = this.$refs.canvas
            const wrapper = canvas.parentElement
            const savedData = this.ctx ? canvas.toDataURL() : null

            canvas.width = wrapper.clientWidth
            canvas.height = wrapper.clientHeight
            this.ctx = canvas.getContext('2d')

            this.ctx.fillStyle = '#ffffff'
            this.ctx.fillRect(0, 0, canvas.width, canvas.height)

            if (savedData) {
                const img = new Image()
                img.onload = () => {
                    this.ctx.drawImage(img, 0, 0)
                }
                img.src = savedData
            }
        },
        selectTool(tool) {
            this.cancelText()
            this.currentTool = tool
        },
        getPos(e) {
            const canvas = this.$refs.canvas
            const rect = canvas.getBoundingClientRect()
            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            }
        },
        startDraw(e) {
            if (this.textEditor.visible) return
            if (this.currentTool === 'text') {
                this.openTextEditor(this.getPos(e))
                return
            }

            this.isDrawing = true
            const pos = this.getPos(e)
            this.startPoint = pos
            this.ctx.beginPath()
            this.ctx.moveTo(pos.x, pos.y)
            this.ctx.strokeStyle = this.penColor
            this.ctx.lineWidth = this.penSize
            this.ctx.lineCap = 'round'
            this.ctx.lineJoin = 'round'
            this.ctx.setLineDash([])

            if (this.currentTool !== 'pen') {
                this.previewSnapshot = this.ctx.getImageData(0, 0, this.$refs.canvas.width, this.$refs.canvas.height)
            }
        },
        drawing(e) {
            if (!this.isDrawing) return
            const pos = this.getPos(e)
            if (this.currentTool === 'pen') {
                this.ctx.lineTo(pos.x, pos.y)
                this.ctx.stroke()
                return
            }

            this.ctx.putImageData(this.previewSnapshot, 0, 0)
            this.drawShape(pos, e.shiftKey)
        },
        endDraw() {
            if (!this.isDrawing) return
            this.isDrawing = false
            this.ctx.closePath()
            this.previewSnapshot = null
            this.startPoint = null
            this.historyStack.push(this.$refs.canvas.toDataURL())
        },
        drawShape(endPoint, isConstrained = false) {
            if (!this.startPoint) return

            const x = this.startPoint.x
            const y = this.startPoint.y
            let width = endPoint.x - x
            let height = endPoint.y - y

            if (isConstrained) {
                const size = Math.min(Math.abs(width), Math.abs(height))
                width = Math.sign(width || 1) * size
                height = Math.sign(height || 1) * size
            }

            this.ctx.strokeStyle = this.penColor
            this.ctx.lineWidth = this.penSize
            this.ctx.lineCap = 'round'
            this.ctx.lineJoin = 'round'
            this.ctx.beginPath()

            if (this.currentTool === 'rect') {
                this.ctx.strokeRect(x, y, width, height)
            }

            if (this.currentTool === 'circle') {
                const centerX = x + width / 2
                const centerY = y + height / 2
                this.ctx.ellipse(centerX, centerY, Math.abs(width / 2), Math.abs(height / 2), 0, 0, Math.PI * 2)
                this.ctx.stroke()
            }

            this.ctx.closePath()
        },
        openTextEditor(pos) {
            this.textEditor = {
                visible: true,
                x: pos.x,
                y: pos.y,
                value: this.textValue
            }
            this.$nextTick(() => {
                this.$refs.textEditor.focus()
                this.$refs.textEditor.select()
            })
        },
        focusCanvasText() {
            if (this.currentTool !== 'text') return
            this.$refs.canvas.focus()
        },
        commitText() {
            if (!this.textEditor.visible) return
            const text = this.textEditor.value.trim()
            if (!text) {
                this.cancelText()
                return
            }

            this.ctx.fillStyle = this.penColor
            this.ctx.font = `${this.textSize}px Arial, "Microsoft YaHei", sans-serif`
            this.ctx.textBaseline = 'top'
            const lineHeight = Math.max(this.textSize * 1.35, 18)
            text.split('\n').forEach((line, index) => {
                this.ctx.fillText(line, this.textEditor.x, this.textEditor.y + index * lineHeight)
            })
            this.textValue = text
            this.historyStack.push(this.$refs.canvas.toDataURL())
            this.cancelText()
        },
        cancelText() {
            if (!this.textEditor.visible) return
            this.textEditor.visible = false
        },
        touchStart(e) {
            const touch = e.touches[0]
            this.startDraw({ clientX: touch.clientX, clientY: touch.clientY })
        },
        touchMove(e) {
            const touch = e.touches[0]
            this.drawing({ clientX: touch.clientX, clientY: touch.clientY })
        },
        undo() {
            if (this.historyStack.length === 0) return
            this.historyStack.pop()
            const canvas = this.$refs.canvas
            const ctx = this.ctx

            if (this.historyStack.length === 0) {
                ctx.fillStyle = '#ffffff'
                ctx.fillRect(0, 0, canvas.width, canvas.height)
            } else {
                const img = new Image()
                img.onload = () => {
                    ctx.clearRect(0, 0, canvas.width, canvas.height)
                    ctx.drawImage(img, 0, 0)
                }
                img.src = this.historyStack[this.historyStack.length - 1]
            }
        },
        clearCanvas() {
            const canvas = this.$refs.canvas
            this.ctx.fillStyle = '#ffffff'
            this.ctx.fillRect(0, 0, canvas.width, canvas.height)
            this.historyStack = []
            this.cancelText()
            this.$toast.success('画板已清空')
        },
        saveImage() {
            this.commitText()
            const link = document.createElement('a')
            link.download = '涂鸦画板_' + Date.now() + '.png'
            link.href = this.$refs.canvas.toDataURL('image/png')
            link.click()
            this.$toast.success('图片已保存')
        }
    }
}
</script>

<style scoped>
.doodle-board {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.page-title {
    margin: 0 0 15px 0;
    font-size: 22px;
    color: #333;
}

.toolbar {
    display: flex;
    align-items: center;
    gap: 20px;
    flex-wrap: wrap;
    margin-bottom: 15px;
    padding: 12px 16px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.tool-group {
    display: flex;
    align-items: center;
    gap: 8px;
}

.tool-label {
    font-size: 14px;
    color: #555;
    white-space: nowrap;
}

.color-input {
    width: 36px;
    height: 36px;
    border: 2px solid #ddd;
    border-radius: 6px;
    cursor: pointer;
    padding: 2px;
}

.size-slider {
    width: 120px;
    accent-color: #0065a0;
}

.size-value {
    font-size: 13px;
    color: #888;
    min-width: 36px;
}

.tool-tabs {
    display: flex;
    gap: 4px;
    padding: 3px;
    background: #f2f5f7;
    border-radius: 6px;
}

.tool-tab {
    padding: 5px 12px;
    border: 0;
    border-radius: 4px;
    background: transparent;
    color: #555;
    font-size: 14px;
    cursor: pointer;
}

.tool-tab.active {
    background: #0065a0;
    color: #fff;
}

.text-input {
    width: 170px;
    height: 32px;
    padding: 0 10px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 14px;
}

.tool-btn {
    padding: 6px 16px;
    border: 1px solid #ddd;
    border-radius: 6px;
    background: #fff;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
}

.tool-btn:hover:not(:disabled) {
    background: #f0f0f0;
}

.tool-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.tool-btn.danger {
    color: #e74c3c;
    border-color: #e74c3c;
}

.tool-btn.danger:hover:not(:disabled) {
    background: #e74c3c;
    color: #fff;
}

.tool-btn.primary {
    background: #0065a0;
    color: #fff;
    border-color: #0065a0;
}

.tool-btn.primary:hover {
    background: #005080;
}

.canvas-wrapper {
    flex: 1;
    position: relative;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
    overflow: hidden;
}

canvas {
    display: block;
    cursor: crosshair;
}

.canvas-text-editor {
    position: absolute;
    z-index: 2;
    padding: 6px 8px;
    border: 1px dashed #0065a0;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.92);
    resize: both;
    outline: none;
    font-family: Arial, "Microsoft YaHei", sans-serif;
}

.text-actions {
    position: absolute;
    z-index: 3;
    display: flex;
    gap: 6px;
}
</style>
