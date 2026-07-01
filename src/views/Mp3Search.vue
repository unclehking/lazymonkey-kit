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
            <button
                type="button"
                class="random-btn"
                :disabled="loading || randomLoading"
                @click="randomListen"
            >
                {{ randomLoading ? '随机中...' : '随机听歌' }}
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
                <div class="player-header">
                    <div class="playing-label">正在播放</div>
                    <button
                        type="button"
                        class="switch-btn loop-btn"
                        :class="{ active: singleLoopEnabled }"
                        :aria-pressed="singleLoopEnabled ? 'true' : 'false'"
                        @click="toggleSingleLoop"
                    >
                        <span>单曲循环</span>
                        <span class="switch-track">
                            <span class="switch-thumb"></span>
                        </span>
                    </button>
                </div>
                <h2>{{ currentSong.title }}</h2>
                <audio
                    ref="audioPlayer"
                    :src="currentSong.audioUrl"
                    :loop="singleLoopEnabled"
                    controls
                    autoplay
                    @timeupdate="updateLyricIndex"
                    @seeked="updateLyricIndex"
                    @play="syncLyricTitle"
                    @ended="handleSongEnded"
                ></audio>
            </div>
        </div>

        <div v-if="currentSong" class="lyrics-panel">
            <div class="lyrics-title">歌词</div>
            <div v-if="lyricsLoading" class="lyrics-state">歌词加载中...</div>
            <div v-else-if="!lyrics.length" class="lyrics-state">{{ lyricsMessage || '暂无歌词' }}</div>
            <div v-else ref="lyricsList" class="lyrics-list">
                <div
                    v-for="(line, index) in lyrics"
                    :key="`${line.time}-${index}`"
                    :class="['lyric-line', { active: index === activeLyricIndex }]"
                >
                    {{ line.text }}
                </div>
            </div>
        </div>

        <div class="result-header">
            <h2>{{ hasSearched ? '搜索结果' : '热门推荐' }}</h2>
            <div class="result-actions">
                <button
                    class="switch-btn sequence-btn"
                    type="button"
                    :class="{ active: sequenceEnabled }"
                    :disabled="!results.length"
                    :aria-pressed="sequenceEnabled ? 'true' : 'false'"
                    @click="toggleSequencePlay"
                >
                    <span>顺序播放</span>
                    <span class="switch-track">
                        <span class="switch-thumb"></span>
                    </span>
                </button>
                <button class="plain-btn" type="button" :disabled="loading" @click="loadHomeSongs">
                    换一批推荐
                </button>
            </div>
        </div>

        <div v-if="results.length" class="song-list">
            <div v-for="song in results" :key="song.url" class="song-item">
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
                    <span v-else>{{ song.loading ? '加载...' : '播放' }}</span>
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
const CACHE_KEYS = {
    keyword: 'lazy-monkey-mp3-keyword',
    sequenceEnabled: 'lazy-monkey-mp3-sequence-enabled'
}

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
            pendingRandom: false,
            randomLoading: false,
            hasSearched: false,
            lyrics: [],
            lyricsLoading: false,
            lyricsMessage: '',
            activeLyricIndex: -1,
            sequenceEnabled: false,
            singleLoopEnabled: false,
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
        this.resetPageTitle()
    },
    watch: {
        keyword(value) {
            window.localStorage.setItem(CACHE_KEYS.keyword, value)
        },
        sequenceEnabled(value) {
            window.localStorage.setItem(CACHE_KEYS.sequenceEnabled, value ? '1' : '0')
        }
    },
    methods: {
        restoreCachedSettings() {
            this.keyword = window.localStorage.getItem(CACHE_KEYS.keyword) || ''
            this.sequenceEnabled = window.localStorage.getItem(CACHE_KEYS.sequenceEnabled) === '1'
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
        toggleSingleLoop() {
            this.singleLoopEnabled = !this.singleLoopEnabled
            if (this.singleLoopEnabled) {
                this.sequenceEnabled = false
            }
        },
        toggleSequencePlay() {
            this.sequenceEnabled = !this.sequenceEnabled
            if (this.sequenceEnabled) {
                this.singleLoopEnabled = false
            }
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
        async randomListen() {
            this.pendingRandom = true
            this.randomLoading = true
            this.message = ''

            try {
                let songs = this.results
                if (!songs.length || this.needVerify) {
                    this.hasSearched = false
                    songs = await this.fetchSongList(`${SOURCE_PROXY}/`, '随机听歌失败，请稍后重试。') || []
                }

                if (this.needVerify) {
                    this.showMessage('来源站需要安全验证，验证完成后会继续随机播放。', 'error')
                    return
                }

                this.pendingRandom = false
                await this.playRandomSong(songs.length ? songs : this.results)
            } finally {
                this.randomLoading = false
            }
        },
        async playRandomSong(songs = this.results) {
            const playableSongs = songs.filter((song) => song.sourceId)
            if (!playableSongs.length) {
                this.showToast('暂无可随机播放的歌曲')
                return
            }

            const randomIndex = Math.floor(Math.random() * playableSongs.length)
            await this.playSong(playableSongs[randomIndex])
        },
        async handleSongEnded() {
            this.activeLyricIndex = -1
            if (this.singleLoopEnabled) {
                this.syncLyricTitle()
                return
            }
            if (!this.sequenceEnabled) {
                this.resetPageTitle()
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
                this.sequenceEnabled = false
                this.showMessage('当前列表已播放完毕。')
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
                let songs = []
                if (this.lastRequest) {
                    songs = await this.fetchSongList(this.lastRequest.url, this.lastRequest.errorText) || []
                } else {
                    songs = await this.loadHomeSongs() || []
                }

                if (this.pendingRandom && !this.needVerify) {
                    this.pendingRandom = false
                    await this.playRandomSong(songs.length ? songs : this.results)
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

.source-link,
.plain-btn,
.switch-btn,
.search-box button,
.song-item > button {
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
.song-item > button {
    background: #0065a0;
    color: #fff;
    padding: 0 22px;
}

.search-box .random-btn {
    background: #1f7a5b;
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

.player-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 6px;
}

.playing-label {
    color: #0065a0;
    font-size: 13px;
}

.switch-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: transparent;
    color: #23627a;
    font-size: 13px;
    padding: 4px 0;
}

.switch-btn.active {
    color: #1f7a5b;
    font-weight: 600;
}

.switch-track {
    display: inline-flex;
    align-items: center;
    width: 38px;
    height: 22px;
    border-radius: 999px;
    background: #c8d2dc;
    padding: 2px;
    transition: background-color 0.2s;
}

.switch-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 3px rgba(31, 45, 61, 0.24);
    transition: transform 0.2s;
}

.switch-btn.active .switch-track {
    background: #1f7a5b;
}

.switch-btn.active .switch-thumb {
    transform: translateX(16px);
}

.switch-btn:disabled {
    cursor: not-allowed;
}

.switch-btn:disabled .switch-track {
    opacity: 0.55;
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

.lyrics-panel {
    margin-top: 12px;
    padding: 16px;
}

.lyrics-title {
    color: #0065a0;
    font-size: 14px;
    margin-bottom: 10px;
}

.lyrics-state {
    color: #7b8590;
    padding: 18px 0;
    text-align: center;
}

.lyrics-list {
    max-height: 220px;
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
    padding: 0;
    text-align: left;
}

.singer-btn:hover {
    color: #0065a0;
    text-decoration: underline;
}

.song-item > button {
    height: 36px;
    min-width: 72px;
}

.song-item > button.playing-btn,
.song-item > button.playing-btn:disabled {
    background: #1f7a5b;
    cursor: not-allowed;
    opacity: 1;
}

.playing-bars {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 3px;
    height: 20px;
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

@media (max-width: 768px) {
    .toolbar,
    .player {
        align-items: flex-start;
        flex-direction: column;
    }

    .player-info {
        width: 100%;
    }

    .search-box {
        flex-direction: column;
    }

    .search-box button {
        height: 42px;
    }

    .result-header {
        align-items: flex-start;
        flex-direction: column;
    }

    .result-actions {
        justify-content: flex-start;
        width: 100%;
    }

    .song-item {
        grid-template-columns: 54px minmax(0, 1fr);
    }

    .song-item img {
        width: 54px;
        height: 54px;
    }

    .song-item > button {
        grid-column: 1 / -1;
    }

    .lyrics-list {
        max-height: 180px;
    }
}
</style>
