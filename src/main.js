import { createApp } from 'vue'
import { createPinia } from 'pinia'
import toast from './plugins/toast'

const isMusicSite = window.location.hostname.toLowerCase() === 'mp3.h5cssjs.com'
    || import.meta.env.VITE_APP_TARGET === 'music'

const bootstrap = async () => {
    const rootComponent = isMusicSite
        ? (await import('./MusicApp.vue')).default
        : (await import('./App.vue')).default
    const app = createApp(rootComponent)

    app.use(createPinia())
    if (!isMusicSite) {
        const router = (await import('./router')).default
        app.use(router)
    }
    app.use(toast)
    app.mount('#app')
}

bootstrap()
