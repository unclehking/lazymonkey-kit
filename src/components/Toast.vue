<template>
    <transition name="toast">
        <div v-if="visible" class="toast" :class="type">
            {{ message }}
        </div>
    </transition>
</template>

<script>
export default {
    name: 'Toast',
    data() {
        return {
            visible: false,
            message: '',
            type: 'info',
            timer: null
        }
    },
    methods: {
        show(message, type = 'info', duration = 2000) {
            this.message = message
            this.type = type
            this.visible = true

            if (this.timer) {
                clearTimeout(this.timer)
            }

            this.timer = setTimeout(() => {
                this.visible = false
            }, duration)
        }
    },
    beforeUnmount() {
        if (this.timer) {
            clearTimeout(this.timer)
        }
    }
}
</script>

<style scoped>
.toast {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    padding: 10px 20px;
    border-radius: 4px;
    color: white;
    font-size: 14px;
    z-index: 10000;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.toast.info {
    background-color: #2c3e50;
}

.toast.success {
    background-color: #27ae60;
}

.toast.error {
    background-color: #e74c3c;
}

.toast-enter-active,
.toast-leave-active {
    transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
}
</style> 