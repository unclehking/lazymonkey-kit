<template>
    <div class="json-format">
        <h2>JSON字符串格式化</h2>

        <div class="format-container">
            <div class="input-section">
                <div class="input-header">
                    <label>输入JSON字符串：</label>
                    <select v-model="indent" class="mode-select">
                        <option value="2">缩进2格</option>
                        <option value="4">缩进4格</option>
                        <option value="tab">Tab缩进</option>
                    </select>
                </div>
                <textarea
                    v-model="inputText"
                    placeholder="请输入要格式化的JSON字符串"
                    class="text-area"
                ></textarea>
                <div class="button-group">
                    <button @click="formatJson" class="action-btn">格式化</button>
                    <button @click="compressJson" class="action-btn">压缩</button>
                    <button @click="clearAll" class="action-btn clear">清空</button>
                </div>
            </div>

            <div class="output-section">
                <label>格式化结果：</label>
                <div class="tree-container" v-if="parsedData !== null">
                    <div class="tree-toolbar">
                        <button @click="expandAll" class="toolbar-btn">全部展开</button>
                        <button @click="collapseAll" class="toolbar-btn">全部收缩</button>
                        <button @click="copyToClipboard" class="toolbar-btn">复制</button>
                    </div>
                    <div class="tree-view">
                        <div
                            v-for="(item, index) in flatNodes"
                            :key="index"
                            class="node-line"
                            :style="{ paddingLeft: item.depth > 0 ? item.depth * 24 + 'px' : '0' }"
                            @click="item.path && togglePath(item.path)"
                        >
                            <template v-if="item.type === 'close'">
                                <span class="toggle-placeholder"></span>
                                <span class="json-bracket">{{ item.isArray ? ']' : '}' }}</span>
                            </template>
                            <template v-else>
                                <span
                                    v-if="item.expandable"
                                    class="toggle-icon"
                                    :class="{ rotated: !isCollapsed(item.path) }"
                                >&#9654;</span>
                                <span v-else class="toggle-placeholder"></span>

                                <span v-if="item.keyName !== null" class="json-key">"{{ item.keyName }}"</span>
                                <span v-if="item.keyName !== null" class="json-colon">: </span>

                                <template v-if="item.expandable">
                                    <span class="json-bracket">{{ item.isArray ? '[' : '{' }}</span>
                                    <span v-if="isCollapsed(item.path)" class="json-ellipsis">
                                        {{ item.count }} {{ item.isArray ? 'items' : 'keys' }}
                                        {{ item.isArray ? ']' : '}' }}
                                    </span>
                                </template>
                                <span v-else :class="item.cls">{{ item.text }}</span>
                            </template>
                        </div>
                    </div>
                </div>
                <div v-else class="tree-container empty">
                    <div class="empty-text">格式化结果将显示在这里</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'JsonFormat',
    data() {
        return {
            inputText: '',
            outputText: '',
            parsedData: null,
            indent: '2',
            collapsedPaths: {}
        }
    },
    computed: {
        flatNodes() {
            if (this.parsedData === null) return []
            const nodes = []
            const walk = (val, path, depth, keyName) => {
                const isObj = val !== null && typeof val === 'object'
                const item = { depth, keyName, expandable: isObj }
                if (isObj) {
                    const isArray = Array.isArray(val)
                    item.isArray = isArray
                    item.count = Object.keys(val).length
                    item.path = path
                    nodes.push(item)
                    if (!this.collapsedPaths[path]) {
                        const keys = Object.keys(val)
                        keys.forEach((k, i) => {
                            walk(val[k], path + '.' + k, depth + 1, isArray ? null : k)
                        })
                        nodes.push({ type: 'close', depth: depth + 1, isArray })
                    }
                } else {
                    if (val === null) { item.cls = 'json-null'; item.text = 'null' }
                    else if (typeof val === 'boolean') { item.cls = 'json-boolean'; item.text = String(val) }
                    else if (typeof val === 'number') { item.cls = 'json-number'; item.text = String(val) }
                    else { item.cls = 'json-string'; item.text = '"' + val + '"' }
                    nodes.push(item)
                }
            }
            walk(this.parsedData, 'root', 0, null)
            return nodes
        }
    },
    methods: {
        isCollapsed(path) {
            return !!this.collapsedPaths[path]
        },
        togglePath(path) {
            if (this.collapsedPaths[path]) {
                delete this.collapsedPaths[path]
            } else {
                this.collapsedPaths[path] = true
            }
        },
        formatJson() {
            if (!this.inputText.trim()) {
                this.$toast.error('请输入JSON字符串')
                return
            }
            try {
                this.parsedData = JSON.parse(this.inputText.trim())
                const space = this.indent === 'tab' ? '\t' : Number(this.indent)
                this.outputText = JSON.stringify(this.parsedData, null, space)
                this.$toast.success('格式化成功')
            } catch (e) {
                this.$toast.error('JSON格式错误：' + e.message)
            }
        },
        compressJson() {
            if (!this.inputText.trim()) {
                this.$toast.error('请输入JSON字符串')
                return
            }
            try {
                this.parsedData = JSON.parse(this.inputText.trim())
                this.outputText = JSON.stringify(this.parsedData)
                this.$toast.success('压缩成功')
            } catch (e) {
                this.$toast.error('JSON格式错误：' + e.message)
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
            this.parsedData = null
            this.collapsedPaths = {}
        },
        expandAll() {
            this.collapsedPaths = {}
        },
        collapseAll() {
            const map = {}
            const walk = (data, path) => {
                if (data !== null && typeof data === 'object') {
                    map[path] = true
                    Object.keys(data).forEach(key => walk(data[key], path + '.' + key))
                }
            }
            walk(this.parsedData, 'root')
            this.collapsedPaths = map
        }
    }
}
</script>

<style scoped>
.json-format {
    padding: 20px;
    height: 100%;
    display: flex;
    flex-direction: column;
}

.format-container {
    margin-top: 20px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    flex: 1;
    min-height: 0;
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
    flex: 1;
    min-height: 0;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    resize: none;
    font-family: monospace;
    font-size: 13px;
    line-height: 1.5;
    box-sizing: border-box;
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

.tree-container {
    border: 1px solid #ddd;
    border-radius: 4px;
    overflow: auto;
    flex: 1;
    min-height: 0;
    background: #fff;
}

.tree-container.empty {
    display: flex;
    align-items: center;
    justify-content: center;
}

.empty-text {
    color: #aaa;
}

.tree-toolbar {
    display: flex;
    gap: 8px;
    padding: 8px 12px;
    border-bottom: 1px solid #eee;
    background: #fafafa;
    position: sticky;
    top: 0;
    z-index: 1;
}

.toolbar-btn {
    padding: 4px 12px;
    font-size: 12px;
    background: #2c3e50;
    color: #fff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.toolbar-btn:hover {
    background: #34495e;
}

.tree-view {
    padding: 8px 0;
    font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
    font-size: 13px;
    line-height: 1.8;
}

.node-line {
    display: flex;
    align-items: center;
    white-space: nowrap;
    padding: 0 4px;
    cursor: default;
}

.node-line:hover {
    background-color: #f0f7ff;
}

.toggle-icon {
    display: inline-block;
    width: 16px;
    font-size: 10px;
    color: #555;
    cursor: pointer;
    flex-shrink: 0;
    transition: transform 0.15s;
}

.toggle-icon.rotated {
    transform: rotate(90deg);
}

.toggle-placeholder {
    display: inline-block;
    width: 16px;
    flex-shrink: 0;
}

.json-key {
    color: #881391;
}

.json-colon {
    color: #333;
}

.json-string {
    color: #0a3069;
}

.json-number {
    color: #1c02bf;
}

.json-boolean {
    color: #c92a2a;
}

.json-null {
    color: #c92a2a;
    font-style: italic;
}

.json-bracket {
    color: #333;
}

.json-ellipsis {
    color: #888;
    font-style: italic;
}

@media (max-width: 768px) {
    .format-container {
        grid-template-columns: 1fr;
    }

    .tree-container {
        min-height: 200px;
    }
}
</style>
