import { createApp } from 'vue'
import Toast from '../components/Toast.vue'

const toast = {
    install(app) {
        const container = document.createElement('div')
        document.body.appendChild(container)
        
        const toastInstance = createApp(Toast).mount(container)

        app.config.globalProperties.$toast = {
            show(message, type = 'info', duration = 2000) {
                toastInstance.show(message, type, duration)
            },
            info(message, duration) {
                this.show(message, 'info', duration)
            },
            success(message, duration) {
                this.show(message, 'success', duration)
            },
            error(message, duration) {
                this.show(message, 'error', duration)
            }
        }
    }
}

export default toast 