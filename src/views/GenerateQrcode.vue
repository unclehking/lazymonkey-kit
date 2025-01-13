<template>
    <div class="qrcode-generator">
        <h2>二维码生成</h2>

        <div class="generator-container">
            <div class="input-section">
                <label>输入文本：</label>
                <textarea 
                    v-model="inputText"
                    placeholder="请输入要生成二维码的文本或URL"
                    class="text-input"
                    @input="generateQRCode"
                ></textarea>
                
                <div class="options">
                    <div class="option-group">
                        <label>二维码大小：</label>
                        <select v-model="size" @change="generateQRCode">
                            <option value="128">128 x 128</option>
                            <option value="256">256 x 256</option>
                            <option value="512">512 x 512</option>
                        </select>
                    </div>
                    
                    <div class="option-group">
                        <label>容错级别：</label>
                        <select v-model="errorCorrectionLevel" @change="generateQRCode">
                            <option value="L">低 (7%)</option>
                            <option value="M">中 (15%)</option>
                            <option value="Q">较高 (25%)</option>
                            <option value="H">高 (30%)</option>
                        </select>
                    </div>
                </div>
            </div>

            <div class="preview-section">
                <label>预览：</label>
                <div class="qrcode-preview" ref="qrcodeContainer">
                    <canvas ref="qrcodeCanvas"></canvas>
                </div>
                <div class="button-group" v-if="qrcodeGenerated">
                    <button @click="downloadQRCode" class="action-btn">下载二维码</button>
                    <select v-model="downloadFormat" class="format-select">
                        <option value="png">PNG</option>
                        <option value="jpeg">JPEG</option>
                    </select>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import QRCode from 'qrcode'

export default {
    name: 'GenerateQrcode',
    data() {
        return {
            inputText: '',
            size: '256',
            errorCorrectionLevel: 'M',
            downloadFormat: 'png',
            qrcodeGenerated: false
        }
    },
    methods: {
        async generateQRCode() {
            if (!this.inputText.trim()) {
                this.qrcodeGenerated = false
                return
            }

            try {
                const canvas = this.$refs.qrcodeCanvas
                const options = {
                    errorCorrectionLevel: this.errorCorrectionLevel,
                    width: parseInt(this.size),
                    margin: 1,
                    color: {
                        dark: '#000000',
                        light: '#ffffff'
                    }
                }

                await QRCode.toCanvas(canvas, this.inputText, options)
                this.qrcodeGenerated = true
            } catch (err) {
                alert('生成二维码失败：' + err.message)
                this.qrcodeGenerated = false
            }
        },
        downloadQRCode() {
            const canvas = this.$refs.qrcodeCanvas
            const link = document.createElement('a')
            
            link.download = `qrcode.${this.downloadFormat}`
            link.href = canvas.toDataURL(`image/${this.downloadFormat}`)
            
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        }
    }
}
</script>

<style scoped>
.qrcode-generator {
    padding: 20px;
}

.generator-container {
    margin-top: 20px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
}

.text-input {
    width: 100%;
    height: 150px;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    resize: vertical;
    font-family: inherit;
    line-height: 1.5;
    margin: 8px 0;
}

.options {
    margin-top: 20px;
}

.option-group {
    margin: 10px 0;
    display: flex;
    align-items: center;
    gap: 10px;
}

.option-group select {
    padding: 6px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
}

.qrcode-preview {
    margin: 8px 0;
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: #fff;
    display: flex;
    justify-content: center;
    align-items: center;
}

.button-group {
    margin-top: 20px;
    display: flex;
    gap: 10px;
    align-items: center;
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

.format-select {
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
}

@media (max-width: 768px) {
    .generator-container {
        grid-template-columns: 1fr;
    }
}
</style> 