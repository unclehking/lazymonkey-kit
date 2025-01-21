import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import toast from './plugins/toast'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(toast)
app.mount('#app') 