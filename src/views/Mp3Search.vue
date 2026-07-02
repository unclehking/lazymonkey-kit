<template>
    <div class="mp3-page">
        <div class="toolbar">
            <div>
                <h1>听歌</h1>
                <p>
                    来源：好听音乐网
                    <a class="source-inline-link" href="https://www.thttt.com/" target="_blank" rel="noopener">thttt.com</a>
                </p>
            </div>
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
                {{ verifying ? '验证中...' : '点击验证' }}
            </button>
        </div>

        <div v-if="currentSong" class="player">
            <button
                type="button"
                class="disc-button"
                :class="{ playing: isAudioPlaying }"
                :title="isAudioPlaying ? '暂停播放' : '播放音乐'"
                @click="toggleAudioPlayback"
            >
                <img
                    class="disc-cover"
                    :src="currentSong.pic || defaultCover"
                    :alt="currentSong.title"
                    @error="setDefaultCover"
                >
                <span class="disc-center" aria-hidden="true">
                    <span v-if="isAudioPlaying" class="pause-icon"></span>
                    <span v-else class="play-icon"></span>
                </span>
            </button>
            <div class="player-info">
                <div class="player-header">
                    <h2>{{ currentSong.title }}</h2>
                    <button
                        type="button"
                        class="mode-btn"
                        :title="`当前模式：${playModeLabel}，点击切换`"
                        @click="togglePlayMode"
                    >
                        {{ playModeLabel }}
                    </button>
                </div>
                <audio
                    ref="audioPlayer"
                    :src="currentSong.audioUrl"
                    :loop="playMode === 'loop'"
                    controls
                    autoplay
                    @timeupdate="updateLyricIndex"
                    @seeked="updateLyricIndex"
                    @play="handleAudioPlay"
                    @pause="handleAudioPause"
                    @ended="handleSongEnded"
                ></audio>
            </div>
        </div>

        <div v-if="currentSong" class="lyrics-panel">
            <div class="lyrics-title">歌词</div>
            <div v-if="lyricsLoading" class="lyrics-state">歌词加载中...</div>
            <div v-else-if="!lyrics.length" class="lyrics-state">{{ lyricsMessage || '暂无歌词' }}</div>
            <template v-else>
                <div ref="lyricsList" class="lyrics-list" :style="{ height: `${lyricsListHeight}px` }">
                    <div
                        v-for="(line, index) in lyrics"
                        :key="`${line.time}-${index}`"
                        :class="['lyric-line', { active: index === activeLyricIndex }]"
                    >
                        {{ line.text }}
                    </div>
                </div>
                <div
                    class="lyrics-resize-handle"
                    title="拖动调整歌词高度"
                    @pointerdown="startLyricsResize"
                ></div>
            </template>
        </div>

        <div class="result-header">
            <h2>{{ hasSearched ? '搜索结果' : '热门推荐' }}</h2>
            <div class="result-actions">
                <button class="plain-btn" type="button" :disabled="loading" @click="loadHomeSongs">
                    换一批推荐
                </button>
            </div>
        </div>

        <div v-if="results.length" class="song-list">
            <div
                v-for="song in results"
                :key="song.url"
                class="song-item"
                :class="{ playing: isCurrentSong(song) }"
            >
                <img :src="song.pic || defaultCover" :alt="song.title" @error="setDefaultCover">
                <div class="song-info">
                    <h3>{{ song.title }}</h3>
                    <button
                        v-if="song.singer"
                        type="button"
                        class="singer-btn"
                        :title="`搜索 ${song.singer}`"
                        @click="searchSinger(song.singer)"
                    >
                        {{ song.singer }}
                    </button>
                    <p v-else>未知歌手</p>
                    <span v-if="song.duration">{{ song.duration }}</span>
                </div>
                <button
                    type="button"
                    :class="{ 'playing-btn': isCurrentSong(song) }"
                    :disabled="song.loading || isCurrentSong(song)"
                    :title="isCurrentSong(song) ? '正在播放' : '播放'"
                    @click="playSong(song)"
                >
                    <span v-if="isCurrentSong(song)" class="playing-bars" aria-label="正在播放">
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                    </span>
                    <span v-else-if="song.loading" class="play-loading" aria-label="加载中"></span>
                    <span v-else class="play-icon" aria-label="播放"></span>
                </button>
            </div>
        </div>

        <div v-if="loadingMore" class="load-more-state">加载更多中...</div>
        <div v-else-if="hasSearched && results.length && !hasMoreResults" class="load-more-state">
            没有更多歌曲了
        </div>

        <div v-if="!results.length && !loading" class="empty">
            暂无歌曲，换个关键词试试。
        </div>
    </div>
</template>

<script>
const SOURCE_PROXY = '/thttt'
const SOURCE_HOST = 'https://www.thttt.com'
const REQUEST_TIMEOUT = 12000
const PLAY_MODES = ['sequence', 'random', 'loop']
const PLAY_MODE_LABELS = {
    sequence: '顺序播放',
    random: '随机播放',
    loop: '单曲循环'
}
const CACHE_KEYS = {
    keyword: 'lazy-monkey-mp3-keyword',
    playMode: 'lazy-monkey-mp3-play-mode'
}

export default {
    name: 'Mp3Search',
    data() {
        return {
            keyword: '',
            results: [],
            currentSong: null,
            isAudioPlaying: false,
            loading: false,
            message: '',
            messageType: 'info',
            needVerify: false,
            verifyToken: '',
            verifying: false,
            lastRequest: null,
            hasSearched: false,
            lyrics: [],
            lyricsLoading: false,
            lyricsMessage: '',
            activeLyricIndex: -1,
            lyricsListHeight: 220,
            lyricsResizeStartY: 0,
            lyricsResizeStartHeight: 220,
            isResizingLyrics: false,
            playMode: 'sequence',
            currentPage: 1,
            nextPageUrl: '',
            hasMoreResults: false,
            loadingMore: false,
            scrollContainer: null,
            originalTitle: '',
            titleScrollTimer: null,
            titleScrollIndex: 0,
            currentTitleLyric: '',
            defaultCover: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" fill="%232c3e50"/><path d="M75 26v48.5A14.5 14.5 0 1 1 68 62V39l-28 6v37.5A14.5 14.5 0 1 1 33 70V38l42-9z" fill="%23fff"/></svg>'
        }
    },
    mounted() {
        this.originalTitle = document.title
        this.restoreCachedSettings()
        this.$nextTick(() => {
            this.scrollContainer = this.$el.closest('.content') || window
            this.scrollContainer.addEventListener('scroll', this.handlePageScroll, { passive: true })
        })
        if (this.keyword) {
            this.searchMusic()
        } else {
            this.loadHomeSongs()
        }
    },
    beforeUnmount() {
        this.scrollContainer?.removeEventListener('scroll', this.handlePageScroll)
        this.stopLyricsResize()
        this.resetPageTitle()
    },
    watch: {
        keyword(value) {
            window.localStorage.setItem(CACHE_KEYS.keyword, value)
        },
        playMode(value) {
            window.localStorage.setItem(CACHE_KEYS.playMode, value)
        }
    },
    computed: {
        playModeLabel() {
            return PLAY_MODE_LABELS[this.playMode] || PLAY_MODE_LABELS.sequence
        }
    },
    methods: {
        restoreCachedSettings() {
            this.keyword = window.localStorage.getItem(CACHE_KEYS.keyword) || ''
            const cachedMode = window.localStorage.getItem(CACHE_KEYS.playMode)
            if (PLAY_MODES.includes(cachedMode)) {
                this.playMode = cachedMode
                return
            }
            this.playMode = 'sequence'
        },
        async loadHomeSongs() {
            this.hasSearched = false
            this.resetPagination()
            return await this.fetchSongList(`${SOURCE_PROXY}/`, '推荐加载失败，请稍后重试。')
        },
        async searchMusic() {
            if (!this.keyword) {
                this.showToast('请输入搜索关键词')
                return
            }
            this.hasSearched = true
            this.resetPagination()
            const url = `${SOURCE_PROXY}/so/${encodeURIComponent(this.keyword)}.html`
            return await this.fetchSongList(url, '搜索失败，可能是来源站限制访问或代理未配置。', {
                page: 1
            })
        },
        async searchSinger(singer) {
            const keyword = singer?.trim()
            if (!keyword) return

            this.keyword = keyword
            await this.searchMusic()
        },
        togglePlayMode() {
            const currentIndex = PLAY_MODES.indexOf(this.playMode)
            this.playMode = PLAY_MODES[(currentIndex + 1) % PLAY_MODES.length]
        },
        toggleAudioPlayback() {
            const audio = this.$refs.audioPlayer
            if (!audio) return

            if (audio.paused || audio.ended) {
                audio.play().catch(() => {
                    this.showMessage('浏览器拦截了播放，请稍后再试。')
                })
            } else {
                audio.pause()
            }
        },
        handleAudioPlay() {
            this.isAudioPlaying = true
            this.syncLyricTitle()
        },
        handleAudioPause() {
            this.isAudioPlaying = false
        },
        resetPagination() {
            this.currentPage = 1
            this.nextPageUrl = ''
            this.hasMoreResults = false
            this.loadingMore = false
        },
        async fetchSongList(url, errorText, options = {}) {
            const { append = false, page = 1 } = options
            if (append) {
                this.loadingMore = true
            } else {
                this.loading = true
            }
            this.message = ''
            this.needVerify = false
            if (!append) {
                this.lastRequest = { url, errorText }
            }
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
                    if (!append) {
                        this.results = []
                    }
                    this.verifyToken = this.getVerifyToken(html)
                    this.needVerify = Boolean(this.verifyToken)
                    this.hasMoreResults = false
                    this.showMessage(
                        this.needVerify
                            ? '来源站需要安全验证，请点击下方按钮在当前代理链路中完成验证。'
                            : '来源站需要安全验证，但没有解析到验证令牌，请稍后重试。',
                        'error'
                    )
                    return null
                }

                const songs = this.parseSongs(html)
                const pagination = this.parsePagination(html, url, page)
                if (append) {
                    this.results = this.mergeSongs(this.results, songs)
                } else {
                    this.results = songs
                }
                this.currentPage = page
                this.nextPageUrl = pagination.nextPageUrl
                this.hasMoreResults = this.hasSearched && Boolean(this.nextPageUrl)
                this.needVerify = false
                this.verifyToken = ''
                if (!append && !songs.length) {
                    this.showMessage('没有解析到歌曲，来源站可能调整了页面结构。', 'error')
                } else if (append && !songs.length) {
                    this.hasMoreResults = false
                }
                return songs
            } catch (error) {
                if (!append) {
                    this.results = []
                } else {
                    this.hasMoreResults = false
                }
                const reason = error.name === 'AbortError' ? '请求超时' : error.message
                this.showMessage(`${errorText}${reason ? `（${reason}）` : ''}`, 'error')
                return null
            } finally {
                window.clearTimeout(timer)
                if (append) {
                    this.loadingMore = false
                } else {
                    this.loading = false
                }
            }
        },
        async loadMoreSongs() {
            if (!this.hasSearched || this.loading || this.loadingMore || !this.hasMoreResults) return

            const nextUrl = this.nextPageUrl || this.getSearchPageUrl(this.currentPage + 1)
            if (!nextUrl) {
                this.hasMoreResults = false
                return
            }

            await this.fetchSongList(nextUrl, '加载更多失败，请稍后重试。', {
                append: true,
                page: this.currentPage + 1
            })
        },
        handlePageScroll() {
            if (!this.hasSearched || !this.results.length || !this.hasMoreResults || this.loading || this.loadingMore) return

            const target = this.scrollContainer === window ? document.documentElement : this.scrollContainer
            const scrollTop = this.scrollContainer === window ? window.scrollY : target.scrollTop
            const clientHeight = this.scrollContainer === window ? window.innerHeight : target.clientHeight
            const scrollHeight = target.scrollHeight
            if (scrollHeight - scrollTop - clientHeight < 240) {
                this.loadMoreSongs()
            }
        },
        async playRandomSong(songs = this.results) {
            const playableSongs = songs.filter((song) => song.sourceId)
            if (!playableSongs.length) {
                this.showToast('暂无可随机播放的歌曲')
                return
            }

            const candidateSongs = playableSongs.length > 1
                ? playableSongs.filter((song) => !this.isCurrentSong(song))
                : playableSongs
            const randomIndex = Math.floor(Math.random() * candidateSongs.length)
            await this.playSong(candidateSongs[randomIndex])
        },
        async handleSongEnded() {
            this.isAudioPlaying = false
            this.activeLyricIndex = -1
            if (this.playMode === 'loop') {
                this.syncLyricTitle()
                return
            }
            if (this.playMode === 'random') {
                await this.playRandomSong()
                return
            }

            await this.playNextSong()
        },
        async playNextSong() {
            const playableSongs = this.results.filter((song) => song.sourceId)
            if (!playableSongs.length) {
                this.showToast('当前列表没有可顺序播放的歌曲')
                return
            }

            const currentIndex = playableSongs.findIndex((song) => this.isCurrentSong(song))
            const nextSong = playableSongs[currentIndex + 1]
            if (!nextSong) {
                this.showMessage('当前列表已播放完毕。')
                this.resetPageTitle()
                return
            }

            await this.playSong(nextSong)
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
        mergeSongs(currentSongs, nextSongs) {
            const songMap = new Map()
            ;[...currentSongs, ...nextSongs].forEach((song) => {
                if (!songMap.has(song.url)) {
                    songMap.set(song.url, song)
                }
            })
            return Array.from(songMap.values())
        },
        parsePagination(html, currentUrl, page) {
            const document = new DOMParser().parseFromString(html, 'text/html')
            const pageLinks = Array.from(document.querySelectorAll('a[href]'))
            const nextLink = pageLinks.find((link) => {
                const text = link.textContent.replace(/\s+/g, '')
                const href = link.getAttribute('href') || ''
                return href && (text.includes('下一页') || text === '下一页' || text === '下页' || text === '>')
            })
            const nextPageUrl = nextLink
                ? this.normalizeProxyUrl(nextLink.getAttribute('href'), currentUrl)
                : this.getSearchPageUrl(page + 1)

            return {
                nextPageUrl: nextPageUrl && nextPageUrl !== currentUrl ? nextPageUrl : ''
            }
        },
        getSearchPageUrl(page) {
            if (!this.hasSearched || !this.keyword || page <= 1) return ''
            const encodedKeyword = encodeURIComponent(this.keyword)
            return `${SOURCE_PROXY}/so/${encodedKeyword}-${page}.html`
        },
        normalizeProxyUrl(url, currentUrl = '') {
            if (!url) return ''
            if (url.startsWith(SOURCE_PROXY)) return url
            if (url.startsWith(`//${new URL(SOURCE_HOST).host}`)) return url.replace(`//${new URL(SOURCE_HOST).host}`, SOURCE_PROXY)
            if (url.startsWith(SOURCE_HOST)) return url.replace(SOURCE_HOST, SOURCE_PROXY)
            if (url.startsWith('/')) return `${SOURCE_PROXY}${url}`
            if (url.startsWith('http')) return url

            const basePath = currentUrl.substring(0, currentUrl.lastIndexOf('/') + 1) || `${SOURCE_PROXY}/`
            return `${basePath}${url}`
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

                this.isAudioPlaying = false
                this.currentSong = {
                    sourceId: song.sourceId,
                    title: data.title || `${song.singer} - ${song.title}`,
                    pic: data.pic || song.pic,
                    audioUrl: data.url,
                    lrcUrl: data.lrc || ''
                }
                this.setPageTitle(this.currentSong.title)
                this.loadLyrics(this.currentSong.lrcUrl)
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
        async loadLyrics(lrcUrl) {
            this.lyrics = []
            this.lyricsMessage = ''
            this.activeLyricIndex = -1
            this.currentTitleLyric = ''

            if (!lrcUrl) {
                this.lyricsMessage = '暂无歌词'
                return
            }

            this.lyricsLoading = true
            const controller = new AbortController()
            const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT)
            try {
                const response = await fetch(lrcUrl, { signal: controller.signal })
                const text = await response.text()

                if (!response.ok) {
                    throw new Error(`请求失败：${response.status}`)
                }

                this.lyrics = this.parseLyrics(this.getLrcContent(text))
                if (!this.lyrics.length) {
                    this.lyricsMessage = '暂无可显示歌词'
                } else {
                    this.activeLyricIndex = 0
                    this.scrollActiveLyric('auto')
                    this.syncLyricTitle()
                }
            } catch (error) {
                this.lyricsMessage = error.name === 'AbortError' ? '歌词加载超时' : '歌词加载失败'
            } finally {
                window.clearTimeout(timer)
                this.lyricsLoading = false
            }
        },
        getLrcContent(text) {
            try {
                const data = JSON.parse(text)
                return data.lrc || text
            } catch (error) {
                return text
            }
        },
        parseLyrics(text) {
            const timeReg = /\[(\d{1,2}):(\d{1,2})(?:\.(\d{1,3}))?\]/g
            const lines = []

            text.split(/\r?\n/).forEach((line) => {
                const times = [...line.matchAll(timeReg)]
                const content = line.replace(timeReg, '').trim()

                if (!times.length || !content) return
                times.forEach((match) => {
                    const minute = Number(match[1])
                    const second = Number(match[2])
                    const millisecond = Number((match[3] || '0').padEnd(3, '0'))
                    lines.push({
                        time: minute * 60 + second + millisecond / 1000,
                        text: content
                    })
                })
            })

            return lines.sort((a, b) => a.time - b.time)
        },
        updateLyricIndex() {
            if (!this.lyrics.length || !this.$refs.audioPlayer) return

            const currentTime = this.$refs.audioPlayer.currentTime
            let nextIndex = -1

            for (let i = 0; i < this.lyrics.length; i++) {
                if (this.lyrics[i].time <= currentTime + 0.2) {
                    nextIndex = i
                } else {
                    break
                }
            }

            if (nextIndex !== this.activeLyricIndex) {
                this.activeLyricIndex = nextIndex
                this.scrollActiveLyric()
                this.syncLyricTitle()
            }
        },
        syncLyricTitle() {
            const audio = this.$refs.audioPlayer
            const lyric = this.lyrics[this.activeLyricIndex]?.text
            if (!lyric || !audio || audio.paused || audio.ended) return

            this.setPageTitle(lyric)
        },
        setPageTitle(text) {
            const cleanText = String(text || '').replace(/\s+/g, ' ').trim()
            if (!cleanText || cleanText === this.currentTitleLyric) return

            this.stopTitleScroll()
            this.currentTitleLyric = cleanText
            const scrollThreshold = 10
            if (cleanText.length <= scrollThreshold) {
                document.title = cleanText
                return
            }

            this.titleScrollIndex = 0
            document.title = cleanText
            this.titleScrollTimer = window.setInterval(() => {
                this.titleScrollIndex = (this.titleScrollIndex + 1) % cleanText.length
                document.title = cleanText.slice(this.titleScrollIndex) || cleanText
            }, 450)
        },
        stopTitleScroll() {
            if (this.titleScrollTimer) {
                window.clearInterval(this.titleScrollTimer)
                this.titleScrollTimer = null
            }
        },
        resetPageTitle() {
            this.stopTitleScroll()
            this.currentTitleLyric = ''
            document.title = this.originalTitle || '懒猴工具站-免费便捷在线工具站'
        },
        startLyricsResize(event) {
            this.isResizingLyrics = true
            this.lyricsResizeStartY = event.clientY
            this.lyricsResizeStartHeight = this.lyricsListHeight
            document.body.style.cursor = 'ns-resize'
            document.body.style.userSelect = 'none'
            window.addEventListener('pointermove', this.handleLyricsResize)
            window.addEventListener('pointerup', this.stopLyricsResize)
            window.addEventListener('pointercancel', this.stopLyricsResize)
            event.preventDefault()
        },
        handleLyricsResize(event) {
            if (!this.isResizingLyrics) return

            const minHeight = 120
            const maxHeight = Math.min(520, Math.max(220, window.innerHeight - 260))
            const nextHeight = this.lyricsResizeStartHeight + event.clientY - this.lyricsResizeStartY
            this.lyricsListHeight = Math.min(Math.max(nextHeight, minHeight), maxHeight)
        },
        stopLyricsResize() {
            if (!this.isResizingLyrics) return

            this.isResizingLyrics = false
            document.body.style.cursor = ''
            document.body.style.userSelect = ''
            window.removeEventListener('pointermove', this.handleLyricsResize)
            window.removeEventListener('pointerup', this.stopLyricsResize)
            window.removeEventListener('pointercancel', this.stopLyricsResize)
        },
        scrollActiveLyric(behavior = 'smooth') {
            this.$nextTick(() => {
                const list = this.$refs.lyricsList
                const activeLine = list?.querySelector('.lyric-line.active')
                if (!list || !activeLine) return

                const listRect = list.getBoundingClientRect()
                const activeRect = activeLine.getBoundingClientRect()
                const currentOffset = activeRect.top - listRect.top
                const targetTop = list.scrollTop + currentOffset - (list.clientHeight - activeLine.clientHeight) / 2
                const maxTop = Math.max(0, list.scrollHeight - list.clientHeight)

                list.scrollTo({
                    top: Math.min(Math.max(targetTop, 0), maxTop),
                    behavior
                })
            })
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
        isCurrentSong(song) {
            return Boolean(this.currentSong?.sourceId && song.sourceId === this.currentSong.sourceId)
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
    padding-bottom: 142px;
}

.toolbar,
.search-box,
.player,
.lyrics-panel,
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

.plain-btn,
.search-box button,
.song-item > button {
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: opacity 0.2s, background-color 0.2s;
}

.source-inline-link {
    color: #0065a0;
    font-weight: 600;
    text-decoration: none;
}

.source-inline-link:hover {
    text-decoration: underline;
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
.song-item > button {
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
    position: fixed;
    right: 20px;
    bottom: -1px;
    left: 156px;
    z-index: 20;
    width: min(980px, calc(100vw - 230px));
    max-width: none;
    margin: 0 auto;
    padding: 16px;
    border: 1px solid #2c3e50;
    border-radius: 8px 8px 0 0;
    box-shadow: 0 10px 30px rgba(31, 45, 61, 0.18);
}

.disc-button {
    position: relative;
    width: 92px;
    height: 92px;
    flex: 0 0 92px;
    padding: 0;
    border-radius: 50%;
    background: #111827;
    overflow: hidden;
    box-shadow: 0 4px 14px rgba(31, 45, 61, 0.22);
}

.disc-cover {
    width: 92px;
    height: 92px;
    border-radius: 50%;
    object-fit: cover;
    display: block;
}

.disc-button.playing .disc-cover {
    animation: disc-spin 8s linear infinite;
}

.disc-center {
    position: absolute;
    top: 50%;
    left: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.82);
    transform: translate(-50%, -50%);
    box-shadow: 0 2px 10px rgba(31, 45, 61, 0.22);
}

.disc-center .play-icon {
    width: 0;
    height: 0;
    margin-left: 3px;
    border-top: 8px solid transparent;
    border-bottom: 8px solid transparent;
    border-left: 12px solid #2c3e50;
}

.disc-center .pause-icon {
    width: 12px;
    height: 16px;
    border-left: 4px solid #2c3e50;
    border-right: 4px solid #2c3e50;
}

@keyframes disc-spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

.player-info {
    flex: 1;
    min-width: 0;
}

.player-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
}

.mode-btn {
    flex: 0 0 auto;
    border: none;
    border-radius: 999px;
    background: #eef7fb;
    color: #0065a0;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    padding: 6px 12px;
    white-space: nowrap;
    transition: background-color 0.2s, color 0.2s;
}

.mode-btn:hover {
    background: #d9edf6;
}

.player h2 {
    flex: 1 1 auto;
    font-size: 18px;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

audio {
    width: 100%;
}

.lyrics-panel {
    margin-top: 12px;
    padding: 16px;
}

.lyrics-title {
    color: #0065a0;
    font-size: 14px;
    margin-bottom: 8px;
}

.lyrics-state {
    color: #7b8590;
    padding: 18px 0;
    text-align: center;
}

.lyrics-resize-handle {
    position: relative;
    height: 12px;
    margin-top: 4px;
    cursor: ns-resize;
    touch-action: none;
}

.lyrics-resize-handle::before {
    content: '';
    position: absolute;
    top: 5px;
    left: 50%;
    width: 56px;
    height: 3px;
    border-radius: 999px;
    background: #c8d2dc;
    transform: translateX(-50%);
}

.lyrics-resize-handle:hover::before {
    background: #0065a0;
}

.lyrics-list {
    overflow-y: auto;
    padding: 8px 0;
    scroll-behavior: smooth;
}

.lyric-line {
    color: #7b8590;
    font-size: 14px;
    line-height: 1.8;
    min-height: 25px;
    padding: 2px 8px;
    text-align: center;
    transition: color 0.2s, font-size 0.2s, background-color 0.2s;
}

.lyric-line.active {
    background: #eef7fb;
    border-radius: 6px;
    color: #0065a0;
    font-size: 16px;
    font-weight: 500;
}

.result-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin: 22px 0 12px;
}

.result-header h2 {
    margin: 0;
    font-size: 20px;
}

.result-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end;
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
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
}

.song-item {
    display: grid;
    grid-template-columns: 56px minmax(0, 1fr) 30px;
    align-items: center;
    gap: 12px;
    padding: 12px;
    transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
}

.song-item:hover {
    box-shadow: 0 8px 22px rgba(31, 45, 61, 0.12);
    transform: translateY(-1px);
}

.song-item.playing {
    border-color: #1f7a5b;
}

.song-item img {
    width: 56px;
    height: 56px;
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
.song-info span,
.singer-btn {
    display: block;
    color: #7b8590;
    margin-top: 5px;
    font-size: 13px;
}

.singer-btn {
    border: none;
    background: transparent;
    cursor: pointer;
    max-width: 100%;
    overflow: hidden;
    padding: 0;
    text-align: left;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.singer-btn:hover {
    color: #0065a0;
    text-decoration: underline;
}

.song-item > button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    min-width: 30px;
    border-radius: 50%;
    opacity: 0.7;
    padding: 0;
}

.song-item > button:hover {
    opacity: 1;
}

.song-item > button.playing-btn,
.song-item > button.playing-btn:disabled {
    background: #1f7a5b;
    cursor: not-allowed;
    opacity: 1;
}

.song-item > button .play-icon {
    width: 0;
    height: 0;
    border-top: 6px solid transparent;
    border-bottom: 6px solid transparent;
    border-left: 9px solid #fff;
    margin-left: 2px;
}

.play-loading {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.45);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spinPlay 0.8s linear infinite;
}

.playing-bars {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 3px;
    height: 20px;
    transform: scale(0.5);
    transform-origin: center;
}

.playing-bars span {
    width: 4px;
    height: 8px;
    border-radius: 2px;
    background: #fff;
    animation: musicBar 0.8s ease-in-out infinite;
}

.playing-bars span:nth-child(2) {
    animation-delay: 0.12s;
}

.playing-bars span:nth-child(3) {
    animation-delay: 0.24s;
}

.playing-bars span:nth-child(4) {
    animation-delay: 0.36s;
}

@keyframes musicBar {
    0%,
    100% {
        height: 6px;
        opacity: 0.72;
    }

    50% {
        height: 18px;
        opacity: 1;
    }
}

@keyframes spinPlay {
    to {
        transform: rotate(360deg);
    }
}

.empty {
    text-align: center;
    color: #7b8590;
    padding: 38px 0;
}

.load-more-state {
    color: #7b8590;
    font-size: 14px;
    padding: 18px 0 6px;
    text-align: center;
}

@media (max-width: 1100px) {
    .song-list {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media (max-width: 768px) {
    .toolbar {
        align-items: flex-start;
        flex-direction: column;
    }

    .mp3-page {
        padding-bottom: 128px;
    }

    .player {
        align-items: center;
        right: 0;
        bottom: 0;
        left: 0;
        width: 100vw;
        max-width: none;
        gap: 12px;
        padding: 12px;
    }

    .disc-button {
        width: 64px;
        height: 64px;
        flex-basis: 64px;
    }

    .disc-cover {
        width: 64px;
        height: 64px;
    }

    .disc-center {
        width: 28px;
        height: 28px;
    }

    .disc-center .play-icon {
        border-top-width: 7px;
        border-bottom-width: 7px;
        border-left-width: 10px;
    }

    .disc-center .pause-icon {
        width: 10px;
        height: 14px;
        border-left-width: 3px;
        border-right-width: 3px;
    }

    .player-info {
        width: 100%;
    }

    .search-box {
        flex-direction: row;
        gap: 8px;
        padding: 12px;
    }

    .search-box input {
        flex: 1 1 auto;
        min-width: 0;
        height: 42px;
        padding: 0 10px;
    }

    .search-box button {
        flex: 0 0 auto;
        height: 42px;
        padding: 0 12px;
    }

    .result-header {
        align-items: center;
        flex-direction: row;
        gap: 8px;
    }

    .result-header h2 {
        flex: 0 0 auto;
        font-size: 18px;
        white-space: nowrap;
    }

    .result-actions {
        flex: 0 0 auto;
        flex-wrap: nowrap;
        justify-content: flex-end;
        gap: 6px;
        width: auto;
    }

    .result-actions .plain-btn {
        font-size: 12px;
    }

    .result-actions .plain-btn {
        padding: 6px 4px;
        white-space: nowrap;
    }

    .song-list {
        grid-template-columns: 1fr;
    }

    .song-item {
        grid-template-columns: 54px minmax(0, 1fr) 30px;
    }

    .song-item img {
        width: 54px;
        height: 54px;
    }

}

@media (max-width: 420px) {
    .player-header {
        gap: 8px;
    }

    .player h2 {
        font-size: 16px;
    }
}
</style>
