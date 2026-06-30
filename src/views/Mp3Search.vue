<template>
    <div class="mp3-page">
        <div class="toolbar">
            <div>
                <h1>听歌</h1>
                <p>来源：好听音乐网 thttt.com</p>
            </div>
            <a class="source-link" href="https://www.thttt.com/" target="_blank" rel="noopener">打开来源站</a>
        </div>

        <form class="search-box" @submit.prevent="searchMusic">
            <input
                v-model.trim="keyword"
                type="search"
                placeholder="输入歌曲名、歌手名"
                :disabled="loading"
            />
            <button type="submit" :disabled="loading || !keyword">
                {{ loading ? '搜索中...' : '搜索' }}
            </button>
        </form>

        <div v-if="message" class="message" :class="{ error: messageType === 'error' }">
            {{ message }}
            <button
                v-if="needVerify"
                type="button"
                class="verify-btn"
                :disabled="loading || verifying"
                @click="verifySource"
            >
                {{ verifying ? '验证中...' : '在本页完成来源站验证' }}
            </button>
        </div>

        <div v-if="currentSong" class="player">
            <img v-if="currentSong.pic" :src="currentSong.pic" :alt="currentSong.title">
            <div class="player-info">
                <div class="playing-label">正在播放</div>
                <h2>{{ currentSong.title }}</h2>
                <audio ref="audioPlayer" :src="currentSong.audioUrl" controls autoplay></audio>
            </div>
        </div>

        <div class="result-header">
            <h2>{{ hasSearched ? '搜索结果' : '热门推荐' }}</h2>
            <button class="plain-btn" type="button" :disabled="loading" @click="loadHomeSongs">
                换一批推荐
            </button>
        </div>

        <div v-if="results.length" class="song-list">
            <div v-for="song in results" :key="song.url" class="song-item">
                <img :src="song.pic || defaultCover" :alt="song.title" @error="setDefaultCover">
                <div class="song-info">
                    <h3>{{ song.title }}</h3>
                    <p>{{ song.singer || '未知歌手' }}</p>
                    <span v-if="song.duration">{{ song.duration }}</span>
                </div>
                <button type="button" :disabled="song.loading" @click="playSong(song)">
                    {{ song.loading ? '加载...' : '播放' }}
                </button>
            </div>
        </div>

        <div v-else-if="!loading" class="empty">
            暂无歌曲，换个关键词试试。
        </div>
    </div>
</template>

<script>
const SOURCE_PROXY = '/thttt'
const SOURCE_HOST = 'https://www.thttt.com'
const REQUEST_TIMEOUT = 12000

export default {
    name: 'Mp3Search',
    data() {
        return {
            keyword: '',
            results: [],
            currentSong: null,
            loading: false,
            message: '',
            messageType: 'info',
            needVerify: false,
            verifyToken: '',
            verifying: false,
            lastRequest: null,
            hasSearched: false,
            defaultCover: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" fill="%232c3e50"/><path d="M75 26v48.5A14.5 14.5 0 1 1 68 62V39l-28 6v37.5A14.5 14.5 0 1 1 33 70V38l42-9z" fill="%23fff"/></svg>'
        }
    },
    mounted() {
        this.loadHomeSongs()
    },
    methods: {
        async loadHomeSongs() {
            this.hasSearched = false
            await this.fetchSongList(`${SOURCE_PROXY}/`, '推荐加载失败，请稍后重试。')
        },
        async searchMusic() {
            if (!this.keyword) {
                this.showToast('请输入搜索关键词')
                return
            }
            this.hasSearched = true
            const url = `${SOURCE_PROXY}/so/${encodeURIComponent(this.keyword)}.html`
            await this.fetchSongList(url, '搜索失败，可能是来源站限制访问或代理未配置。')
        },
        async fetchSongList(url, errorText) {
            this.loading = true
            this.message = ''
            this.needVerify = false
            this.lastRequest = { url, errorText }
            const controller = new AbortController()
            const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT)
            try {
                const response = await fetch(url, {
                    headers: {
                        'Accept': 'text/html,application/xhtml+xml'
                    },
                    signal: controller.signal
                })
                const html = await response.text()

                if (!response.ok) {
                    throw new Error(`请求失败：${response.status}`)
                }
                if (html.includes('安全人机验证')) {
                    this.results = []
                    this.verifyToken = this.getVerifyToken(html)
                    this.needVerify = Boolean(this.verifyToken)
                    this.showMessage(
                        this.needVerify
                            ? '来源站需要安全验证，请点击下方按钮在当前代理链路中完成验证。'
                            : '来源站需要安全验证，但没有解析到验证令牌，请稍后重试。',
                        'error'
                    )
                    return
                }

                const songs = this.parseSongs(html)
                this.results = songs
                this.needVerify = false
                this.verifyToken = ''
                if (!songs.length) {
                    this.showMessage('没有解析到歌曲，来源站可能调整了页面结构。', 'error')
                }
            } catch (error) {
                this.results = []
                const reason = error.name === 'AbortError' ? '请求超时' : error.message
                this.showMessage(`${errorText}${reason ? `（${reason}）` : ''}`, 'error')
            } finally {
                window.clearTimeout(timer)
                this.loading = false
            }
        },
        async verifySource() {
            if (!this.verifyToken) {
                this.showMessage('没有找到验证令牌，请刷新后再试。', 'error')
                return
            }

            this.verifying = true
            this.message = ''
            const controller = new AbortController()
            const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT)
            try {
                const body = new URLSearchParams({
                    csrf_token: this.verifyToken,
                    human_check: 'on'
                })
                const response = await fetch(`${SOURCE_PROXY}/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
                        'Accept': 'text/html,application/xhtml+xml'
                    },
                    body,
                    redirect: 'follow',
                    signal: controller.signal
                })
                const html = await response.text()

                if (!response.ok) {
                    throw new Error(`请求失败：${response.status}`)
                }
                if (html.includes('安全人机验证')) {
                    this.verifyToken = this.getVerifyToken(html)
                    this.needVerify = Boolean(this.verifyToken)
                    this.showMessage('验证没有通过，请再点一次验证按钮。', 'error')
                    return
                }

                this.needVerify = false
                this.verifyToken = ''
                this.showToast('验证完成，正在重新加载', 'success')
                if (this.lastRequest) {
                    await this.fetchSongList(this.lastRequest.url, this.lastRequest.errorText)
                } else {
                    await this.loadHomeSongs()
                }
            } catch (error) {
                const reason = error.name === 'AbortError' ? '请求超时' : error.message
                this.showMessage(`验证失败，请稍后重试。${reason ? `（${reason}）` : ''}`, 'error')
            } finally {
                window.clearTimeout(timer)
                this.verifying = false
            }
        },
        parseSongs(html) {
            const document = new DOMParser().parseFromString(html, 'text/html')
            const links = Array.from(document.querySelectorAll('a.url[href*="/mp3/"], .pic a[href*="/mp3/"]'))
            const songMap = new Map()

            links.forEach((link) => {
                const href = link.getAttribute('href')
                if (!href || !href.includes('/mp3/')) return

                const item = link.closest('li') || link.parentElement
                const titleText = link.getAttribute('title') || item?.querySelector('a.url')?.getAttribute('title') || item?.querySelector('img')?.getAttribute('alt') || link.textContent
                const parsed = this.parseTitle(titleText)
                const url = this.normalizeSourceUrl(href)
                const img = item?.querySelector('img')
                const singer = item?.querySelector('.singer')?.textContent?.trim()
                const duration = item?.querySelector('.playtime, .stime')?.textContent?.trim()

                if (!songMap.has(url) && parsed.title) {
                    songMap.set(url, {
                        title: parsed.title,
                        singer: singer || parsed.singer,
                        duration,
                        pic: img?.getAttribute('src') || '',
                        url,
                        sourceId: this.getMusicId(url),
                        loading: false
                    })
                }
            })

            return Array.from(songMap.values()).slice(0, 30)
        },
        parseTitle(text = '') {
            const cleanText = this.decodeHtml(text).replace(/\s+/g, ' ').trim()
            const parts = cleanText.split(' - ')
            if (parts.length >= 2) {
                return {
                    singer: parts.shift().trim(),
                    title: parts.join(' - ').trim()
                }
            }
            return {
                singer: '',
                title: cleanText
            }
        },
        async playSong(song) {
            if (!song.sourceId) {
                this.showToast('没有找到歌曲ID')
                return
            }

            song.loading = true
            this.message = ''
            const controller = new AbortController()
            const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT)
            try {
                const body = new URLSearchParams({
                    id: song.sourceId,
                    type: 'music'
                })
                const response = await fetch(`${SOURCE_PROXY}/js/play.php`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
                    },
                    body,
                    signal: controller.signal
                })
                const data = await response.json()

                if (!response.ok || !data.url) {
                    throw new Error('没有拿到播放地址')
                }

                this.currentSong = {
                    title: data.title || `${song.singer} - ${song.title}`,
                    pic: data.pic || song.pic,
                    audioUrl: data.url
                }
                this.$nextTick(() => {
                    this.$refs.audioPlayer?.play?.().catch(() => {
                        this.showMessage('浏览器拦截了自动播放，请手动点击播放器播放。')
                    })
                })
            } catch (error) {
                const reason = error.name === 'AbortError' ? '请求超时' : error.message
                this.showMessage(`播放地址获取失败，可能是来源站限制访问。${reason ? `（${reason}）` : ''}`, 'error')
            } finally {
                window.clearTimeout(timer)
                song.loading = false
            }
        },
        normalizeSourceUrl(url) {
            if (url.startsWith('http')) return url
            return `${SOURCE_HOST}${url.startsWith('/') ? url : `/${url}`}`
        },
        getMusicId(url) {
            const match = url.match(/\/mp3\/([a-zA-Z0-9]+)\.html/)
            return match ? match[1] : ''
        },
        getVerifyToken(html) {
            const document = new DOMParser().parseFromString(html, 'text/html')
            return document.querySelector('input[name="csrf_token"]')?.value || ''
        },
        decodeHtml(text) {
            const textarea = document.createElement('textarea')
            textarea.innerHTML = text
            return textarea.value
        },
        setDefaultCover(event) {
            event.target.src = this.defaultCover
        },
        showMessage(text, type = 'info') {
            this.message = text
            this.messageType = type
            if (type === 'error') {
                this.showToast(text, 'error')
            }
        },
        showToast(text, type = 'info') {
            if (this.$toast?.[type]) {
                this.$toast[type](text)
            } else if (this.$toast?.show) {
                this.$toast.show(text, type)
            }
        }
    }
}
</script>

<style scoped>
.mp3-page {
    max-width: 980px;
    margin: 0 auto;
    color: #2c3e50;
}

.toolbar,
.search-box,
.player,
.song-item {
    background: #fff;
    border-radius: 8px;
    border: 1px solid #e7eaee;
}

.toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 22px;
}

.toolbar h1,
.toolbar p,
.player h2,
.song-info h3,
.song-info p {
    margin: 0;
}

.toolbar h1 {
    font-size: 26px;
}

.toolbar p {
    margin-top: 8px;
    color: #77808a;
}

.source-link,
.plain-btn,
.search-box button,
.song-item button {
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: opacity 0.2s, background-color 0.2s;
}

.source-link {
    color: #fff;
    background: #2c3e50;
    padding: 10px 14px;
    text-decoration: none;
}

.search-box {
    display: flex;
    gap: 12px;
    padding: 16px;
    margin-top: 16px;
}

.search-box input {
    flex: 1;
    min-width: 0;
    border: 1px solid #d9dfe6;
    border-radius: 6px;
    padding: 0 14px;
    height: 42px;
    font-size: 15px;
}

.search-box button,
.song-item button {
    background: #0065a0;
    color: #fff;
    padding: 0 22px;
}

button:disabled {
    opacity: 0.55;
    cursor: not-allowed;
}

.message {
    margin-top: 14px;
    padding: 12px 14px;
    background: #eef7fb;
    border: 1px solid #cde9f3;
    border-radius: 6px;
    color: #23627a;
}

.message.error {
    background: #fff2f2;
    border-color: #ffd5d5;
    color: #b23b3b;
}

.verify-btn {
    display: block;
    margin-top: 10px;
    border: none;
    border-radius: 6px;
    background: #b23b3b;
    color: #fff;
    cursor: pointer;
    padding: 9px 12px;
}

.verify-btn:hover {
    opacity: 0.9;
}

.player {
    display: flex;
    align-items: center;
    gap: 18px;
    margin-top: 16px;
    padding: 16px;
}

.player img {
    width: 92px;
    height: 92px;
    border-radius: 6px;
    object-fit: cover;
}

.player-info {
    flex: 1;
    min-width: 0;
}

.playing-label {
    color: #0065a0;
    font-size: 13px;
    margin-bottom: 6px;
}

.player h2 {
    font-size: 18px;
    margin-bottom: 10px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

audio {
    width: 100%;
}

.result-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 22px 0 12px;
}

.result-header h2 {
    margin: 0;
    font-size: 20px;
}

.plain-btn {
    background: transparent;
    color: #0065a0;
    padding: 8px 10px;
}

.plain-btn:hover {
    background: #eaf4fb;
}

.song-list {
    display: grid;
    gap: 12px;
}

.song-item {
    display: grid;
    grid-template-columns: 64px minmax(0, 1fr) auto;
    align-items: center;
    gap: 14px;
    padding: 12px;
}

.song-item img {
    width: 64px;
    height: 64px;
    border-radius: 6px;
    object-fit: cover;
    background: #2c3e50;
}

.song-info {
    min-width: 0;
}

.song-info h3 {
    font-size: 16px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.song-info p,
.song-info span {
    display: block;
    color: #7b8590;
    margin-top: 5px;
    font-size: 13px;
}

.song-item button {
    height: 36px;
    min-width: 72px;
}

.empty {
    text-align: center;
    color: #7b8590;
    padding: 38px 0;
}

@media (max-width: 768px) {
    .toolbar,
    .player {
        align-items: flex-start;
        flex-direction: column;
    }

    .search-box {
        flex-direction: column;
    }

    .search-box button {
        height: 42px;
    }

    .song-item {
        grid-template-columns: 54px minmax(0, 1fr);
    }

    .song-item img {
        width: 54px;
        height: 54px;
    }

    .song-item button {
        grid-column: 1 / -1;
    }
}
</style>
