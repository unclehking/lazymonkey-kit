<template>
    <main class="music-site">
        <Mp3Search />
    </main>
</template>

<script>
import Mp3Search from './views/Mp3Search.vue'

export default {
    name: 'MusicApp',
    components: {
        Mp3Search
    },
    mounted() {
        document.title = '懒猴音乐 - 在线听歌'
    }
}
</script>

<style scoped>
.music-site {
    min-height: 100vh;
    padding: 20px;
    background: #f5f5f5;
}

@media (max-width: 768px) {
    .music-site {
        padding: 14px;
    }
}
</style>
