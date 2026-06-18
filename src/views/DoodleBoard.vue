<template>
    <div class="doodle-board">
        <h2 class="page-title">涂鸦画板</h2>
        <div class="toolbar">
            <div class="tool-group">
                <label class="tool-label">画笔颜色</label>
                <input type="color" v-model="penColor" class="color-input" />
            </div>
            <div class="tool-group">
                <label class="tool-label">画笔粗细</label>
                <input type="range" v-model.number="penSize" min="1" max="50" class="size-slider" />
                <span class="size-value">{{ penSize }}px</span>
            </div>
            <div class="tool-group">
                <button @click="undo" class="tool-btn" :disabled="historyStack.length === 0">撤销</button>
                <button @click="clearCanvas" class="tool-btn danger">清空</button>
                <button @click="saveImage" class="tool-btn primary">保存图片</button>
            </div>
        </div>
        <div class="canvas-wrapper">
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
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            penColor: '#000000',
            penSize: 3,
            isDrawing: false,
            ctx: null,
            historyStack: []
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
        getPos(e) {
            const canvas = this.$refs.canvas
            const rect = canvas.getBoundingClientRect()
            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            }
        },
        startDraw(e) {
            this.isDrawing = true
            const pos = this.getPos(e)
            this.ctx.beginPath()
            this.ctx.moveTo(pos.x, pos.y)
            this.ctx.strokeStyle = this.penColor
            this.ctx.lineWidth = this.penSize
            this.ctx.lineCap = 'round'
            this.ctx.lineJoin = 'round'
            this.ctx.setLineDash([])
        },
        drawing(e) {
            if (!this.isDrawing) return
            const pos = this.getPos(e)
            this.ctx.lineTo(pos.x, pos.y)
            this.ctx.stroke()
        },
        endDraw() {
            if (!this.isDrawing) return
            this.isDrawing = false
            this.ctx.closePath()
            this.historyStack.push(this.$refs.canvas.toDataURL())
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
            this.$toast('画板已清空')
        },
        saveImage() {
            const link = document.createElement('a')
            link.download = '涂鸦画板_' + Date.now() + '.png'
            link.href = this.$refs.canvas.toDataURL('image/png')
            link.click()
            this.$toast('图片已保存')
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
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
    overflow: hidden;
}

canvas {
    display: block;
    cursor: crosshair;
}
</style>
