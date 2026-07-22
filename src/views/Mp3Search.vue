<template>
    <div
        class="mp3-page"
        :class="{ 'has-mobile-now-playing': showMobileNowPlayingBar }"
        :inert="needVerify || disclaimerOpen"
        :aria-hidden="needVerify || disclaimerOpen ? 'true' : null"
    >
        <div class="toolbar">
            <div>
                <h2>
                    <router-link class="toolbox-home-link" to="/">懒猴工具箱</router-link>
                    <span aria-hidden="true"> - </span><span>听歌</span>
                </h2>
                <p class="source-row">
                    <span>
                        来源：
                        <a class="source-inline-link" href="https://www.thttt.com/" target="_blank" rel="noopener">thttt.com</a>
                    </span>
                    <button type="button" class="disclaimer-link" @click="disclaimerOpen = true">
                        《免责声明》
                    </button>
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

        <button
            v-if="showMobileNowPlayingBar"
            type="button"
            class="mobile-now-playing-bar"
            @click="openMobilePlayer"
        >
            <div class="mobile-now-playing-content">
                <span class="mobile-now-playing-bars" aria-label="正在播放">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                </span>
                <span class="title">{{ currentSongTitle }} - {{ currentSongArtist }}</span>
            </div>
            <span class="mobile-now-playing-arrow" aria-hidden="true"></span>
        </button>

        <div v-if="message && !needVerify" class="message" :class="{ error: messageType === 'error' }">
            {{ message }}
        </div>

        <Teleport to="body">
            <div v-if="disclaimerOpen" class="disclaimer-modal-layer" @click.self="closeDisclaimer">
                <section
                    ref="disclaimerDialog"
                    class="disclaimer-dialog"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="disclaimer-dialog-title"
                    tabindex="-1"
                    @keydown="handleDisclaimerKeydown"
                >
                    <div class="disclaimer-dialog-header">
                        <h2 id="disclaimer-dialog-title">免责声明</h2>
                        <button type="button" class="disclaimer-close-icon" aria-label="关闭免责声明" @click="closeDisclaimer">
                            <span aria-hidden="true">×</span>
                        </button>
                    </div>
                    <ol class="disclaimer-content">
                        <li>本网站所刊载的内容、资料来源于互联网公开渠道，相关版权归原作者所有。</li>
                        <li>本站转载内容仅为信息传播、学习交流之用，不代表本站认同其观点，亦不构成任何投资、法律、医疗等专业建议。</li>
                        <li>如原著作权人认为本站内容侵犯自身合法权益，请及时联系我方，我方核实后将第一时间删除相关内容。</li>
                        <li>访问者依据本站内容自行作出的任何行为，风险由访问者自行承担，本网站不承担由此产生的一切法律责任。</li>
                    </ol>
                    <div class="disclaimer-actions">
                        <button type="button" @click="closeDisclaimer">我知道了</button>
                    </div>
                </section>
            </div>
        </Teleport>

        <Teleport to="body">
            <div v-if="needVerify" class="verify-modal-layer">
                <div
                    ref="verifyDialog"
                    class="verify-dialog"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="verify-dialog-title"
                    aria-describedby="verify-dialog-description"
                    tabindex="-1"
                    @keydown="handleVerifyDialogKeydown"
                >
                    <div id="verify-dialog-title" class="verify-dialog-title">需要安全验证</div>
                    <div id="verify-dialog-description" class="verify-dialog-text">
                        来源站需要安全验证，请点击下方按钮在当前代理链路中完成验证。
                    </div>
                    <div class="verify-actions">
                        <button type="button" class="verify-cancel-btn" :disabled="verifying" @click="cancelVerify">
                            取消
                        </button>
                        <button
                            type="button"
                            class="verify-btn"
                            :disabled="loading || verifying"
                            @click="verifySource"
                        >
                            {{ verifying ? '验证中...' : '点击验证' }}
                        </button>
                    </div>
                </div>
            </div>
        </Teleport>

        <div v-if="currentSong" ref="playerHost" class="player-host">
        <div
            ref="player"
            class="player"
            :style="playerCoverStyle"
            :class="{
                'pip-player': isPlayerPip,
                'mobile-player-closed': !mobilePlayerOpen,
                'mobile-lyrics-fullscreen': mobileLyricsFullscreen
            }"
        >
            <div
                class="mobile-music-visualizer"
                aria-hidden="true"
            >
                <canvas ref="musicVisualizerCanvas"></canvas>
            </div>
            <div class="mobile-player-top">
                <button type="button" class="mobile-icon-btn" title="返回" @click="closeMobilePlayer">
                    <span class="mobile-back-icon" aria-hidden="true"></span>
                </button>
                <div class="mobile-now-title">
                    {{ currentSongTitle }}<span v-if="currentSongArtist"> - {{ currentSongArtist }}</span>
                </div>
                <button type="button" class="mobile-icon-btn" :title="`当前模式：${playModeLabel}`" @click="togglePlayMode">
                    <span class="mobile-mode-label">{{ playModeLabel }}</span>
                </button>
            </div>
            <div class="player-main">
            <div class="disc-controls">
                <button type="button" class="track-nav-btn" title="上一曲" @click="playPreviousSong">
                    <span class="prev-track-icon" aria-hidden="true"></span>
                </button>
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
                <button type="button" class="track-nav-btn" title="下一曲" @click="playNextSong">
                    <span class="next-track-icon" aria-hidden="true"></span>
                </button>
            </div>
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
                    <button
                        v-if="!isPlayerPip"
                        type="button"
                        class="pip-btn"
                        title="打开画中画"
                        @click="togglePlayerPip"
                    >
                        画中画
                    </button>
                </div>
                <audio
                    ref="audioPlayer"
                    class="native-audio"
                    :src="currentSong.audioUrl"
                    :loop="playMode === 'loop'"
                    @durationchange="updateAudioProgress"
                    @loadedmetadata="handleAudioLoadedMetadata"
                    @timeupdate="handleAudioTimeUpdate"
                    @seeked="handleAudioTimeUpdate"
                    @play="handleAudioPlay"
                    @pause="handleAudioPause"
                    @ended="handleSongEnded"
                ></audio>
                <div class="custom-player-controls">
                    <div class="progress-wrap">
                        <input
                            class="progress-slider"
                            type="range"
                            min="0"
                            :max="audioDuration || 0"
                            step="0.1"
                            :value="audioCurrentTime"
                            @input="seekAudio"
                        >
                        <div class="time-row">
                            <span>{{ formatAudioTime(audioCurrentTime) }}</span>
                            <span>{{ formatAudioTime(audioDuration) }}</span>
                        </div>
                    </div>
                </div>
            </div>
            </div>
            <div class="mobile-song-meta">
                <div
                    ref="mobileLyricsList"
                    class="mobile-lyrics"
                    role="button"
                    tabindex="0"
                    :title="mobileLyricsFullscreen ? '点击返回歌曲界面' : '点击全屏显示歌词'"
                    @click="toggleMobileLyricsFullscreen"
                    @keydown.enter.prevent="toggleMobileLyricsFullscreen"
                    @keydown.space.prevent="toggleMobileLyricsFullscreen"
                >
                    <div
                        v-for="line in displayedMobileLyricLines"
                        :key="`${line.index}-${line.time}`"
                        class="mobile-lyric-line"
                        :class="{ active: line.index === activeLyricIndex }"
                        :style="line.mobileStyle"
                    >
                        {{ line.text }}
                    </div>
                    <div v-if="!displayedMobileLyricLines.length" class="mobile-lyric-line active">暂无歌词</div>
                </div>
            </div>
            <div class="mobile-transport">
                <button type="button" class="mobile-nav-btn" title="上一曲" @click.stop="playPreviousSong">
                    <span class="prev-track-icon" aria-hidden="true"></span>
                </button>
                <button type="button" class="mobile-play-btn" :title="isAudioPlaying ? '暂停播放' : '播放音乐'" @click.stop="toggleAudioPlayback">
                    <span v-if="isAudioPlaying" class="pause-icon"></span>
                    <span v-else class="play-icon"></span>
                </button>
                <button type="button" class="mobile-nav-btn" title="下一曲" @click.stop="playNextSong">
                    <span class="next-track-icon" aria-hidden="true"></span>
                </button>
            </div>
            <div v-if="isPlayerPip" class="pip-lyric-line">
                {{ currentLyricText || '暂无歌词' }}
            </div>
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
                <button class="plain-btn" type="button" :disabled="loading" @click="loadRandomRecommendations">
                    随机推荐
                </button>
            </div>
        </div>

        <div v-if="results.length" class="song-list">
            <div
                v-for="song in results"
                :key="song.url"
                class="song-item"
                :class="{ playing: isCurrentSong(song) }"
                @click="playSongFromItem(song, $event)"
            >
                <img :src="song.pic || defaultCover" :alt="song.title" @error="setDefaultCover">
                <div class="song-info">
                    <h3>{{ song.title }}</h3>
                    <button
                        v-if="song.singer"
                        type="button"
                        class="singer-btn"
                        :title="`搜索 ${song.singer}`"
                        @click.stop="searchSinger(song.singer)"
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
                    @click.stop="playSong(song)"
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
        <div v-else-if="loading" class="song-list skeleton-list" role="status" aria-label="歌曲列表加载中">
            <div v-for="index in 6" :key="index" class="song-item song-skeleton" aria-hidden="true">
                <span class="skeleton-block skeleton-cover"></span>
                <span class="skeleton-copy">
                    <span class="skeleton-block skeleton-title"></span>
                    <span class="skeleton-block skeleton-meta"></span>
                </span>
                <span class="skeleton-block skeleton-action"></span>
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
const visualizerRuntime = new WeakMap()
const verifyModalState = new WeakMap()
const disclaimerModalState = new WeakMap()
const CACHE_KEYS = {
    keyword: 'lazy-monkey-mp3-keyword',
    playMode: 'lazy-monkey-mp3-play-mode',
    playback: 'lazy-monkey-mp3-playback'
}

export default {
    name: 'Mp3Search',
    data() {
        return {
            keyword: '',
            results: [],
            currentSong: null,
            isAudioPlaying: false,
            audioCurrentTime: 0,
            audioDuration: 0,
            loading: false,
            message: '',
            messageType: 'info',
            disclaimerOpen: false,
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
            pipWindow: null,
            isPlayerPip: false,
            mobilePlayerOpen: true,
            mobileLyricsFullscreen: false,
            mobileLyricsHistoryActive: false,
            mobilePlayerHistoryActive: false,
            isCurrentSongOutOfView: false,
            playMode: 'sequence',
            mobileLyricVisibleCount: 3,
            currentPage: 1,
            nextPageUrl: '',
            hasMoreResults: false,
            loadingMore: false,
            scrollContainer: null,
            originalTitle: '',
            titleScrollTimer: null,
            titleScrollIndex: 0,
            currentTitleLyric: '',
            pendingRestoreTime: null,
            resumePlaybackRequested: false,
            lastPlaybackPersistedAt: 0,
            playbackRequestVersion: 0,
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
        window.addEventListener('keydown', this.handlePlayerKeydown)
        window.addEventListener('car-media-command', this.handleCarMediaCommand)
        window.__carMediaCommandHandled = true
        this.exposeAppPlayerApi()
        window.addEventListener('resize', this.updateMobileLyricVisibleCount, { passive: true })
        window.addEventListener('popstate', this.handleMobilePlayerPopState)
        window.addEventListener('pagehide', this.handlePageHide)
        this.setupMediaSession()
        this.updateMobileLyricVisibleCount()
        this.restorePlaybackState()
        if (this.keyword) {
            this.searchMusic()
        } else {
            this.loadHomeSongs()
        }
    },
    beforeUnmount() {
        this.playbackRequestVersion += 1
        this.persistPlaybackState()
        this.scrollContainer?.removeEventListener('scroll', this.handlePageScroll)
        window.removeEventListener('keydown', this.handlePlayerKeydown)
        window.removeEventListener('car-media-command', this.handleCarMediaCommand)
        window.__carMediaCommandHandled = false
        this.removeAppPlayerApi()
        window.removeEventListener('resize', this.updateMobileLyricVisibleCount)
        window.removeEventListener('popstate', this.handleMobilePlayerPopState)
        window.removeEventListener('pagehide', this.handlePageHide)
        this.clearMediaSession()
        this.closePlayerPip()
        this.destroyMusicVisualizer()
        this.stopLyricsResize()
        this.resetPageTitle()
        document.body.classList.remove('verify-modal-open')
        document.body.classList.remove('disclaimer-modal-open')
        verifyModalState.delete(this)
        disclaimerModalState.delete(this)
    },
    watch: {
        keyword(value) {
            window.localStorage.setItem(CACHE_KEYS.keyword, value)
        },
        playMode(value) {
            window.localStorage.setItem(CACHE_KEYS.playMode, value)
        },
        needVerify(isOpen) {
            if (isOpen) {
                const returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
                verifyModalState.set(this, { returnFocus })
                document.body.classList.add('verify-modal-open')
                this.$nextTick(() => {
                    const dialog = this.$refs.verifyDialog
                    const primaryAction = dialog?.querySelector('.verify-btn:not(:disabled)')
                    ;(primaryAction || dialog)?.focus()
                })
                return
            }

            document.body.classList.remove('verify-modal-open')
            const modalState = verifyModalState.get(this)
            verifyModalState.delete(this)
            this.$nextTick(() => {
                if (modalState?.returnFocus?.isConnected) modalState.returnFocus.focus()
            })
        },
        disclaimerOpen(isOpen) {
            if (isOpen) {
                const returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
                disclaimerModalState.set(this, { returnFocus })
                document.body.classList.add('disclaimer-modal-open')
                this.$nextTick(() => this.$refs.disclaimerDialog?.focus())
                return
            }

            document.body.classList.remove('disclaimer-modal-open')
            const modalState = disclaimerModalState.get(this)
            disclaimerModalState.delete(this)
            this.$nextTick(() => {
                if (modalState?.returnFocus?.isConnected) modalState.returnFocus.focus()
            })
        },
        results() {
            this.$nextTick(this.updateCurrentSongVisibility)
        }
    },
    computed: {
        playModeLabel() {
            return PLAY_MODE_LABELS[this.playMode] || PLAY_MODE_LABELS.sequence
        },
        currentLyricText() {
            return this.lyrics[this.activeLyricIndex]?.text || ''
        },
        mobileLyricLines() {
            if (!this.lyrics.length) return []

            const visibleCount = this.mobileLyricVisibleCount
            const activeIndex = Math.max(this.activeLyricIndex, 0)
            const activeOffset = Math.floor(visibleCount / 2)
            const startIndex = Math.max(0, Math.min(activeIndex - activeOffset, this.lyrics.length - visibleCount))

            return this.lyrics.slice(startIndex, startIndex + visibleCount).map((line, offset) => {
                const index = startIndex + offset
                const distance = Math.abs(index - activeIndex)

                return {
                    ...line,
                    index,
                    mobileStyle: {
                        '--mobile-lyric-font-size': `${Math.max(12, 18 - distance)}px`,
                        '--mobile-lyric-opacity': Math.max(0.16, 1 - distance * 0.16).toFixed(2)
                    }
                }
            })
        },
        displayedMobileLyricLines() {
            if (!this.mobileLyricsFullscreen) return this.mobileLyricLines

            return this.lyrics.map((line, index) => ({
                ...line,
                index,
                mobileStyle: null
            }))
        },
        currentSongTitle() {
            const parsed = this.parseTitle(this.currentSong?.title || '')
            return parsed.title || this.currentSong?.title || ''
        },
        currentSongArtist() {
            return this.parseTitle(this.currentSong?.title || '').singer
        },
        showMobileNowPlayingBar() {
            return Boolean(this.currentSong && !this.mobilePlayerOpen && this.isCurrentSongOutOfView)
        },
        visualizerSeed() {
            const identity = `${this.currentSong?.sourceId || ''}|${this.currentSong?.title || ''}`
            let hash = 2166136261
            for (let index = 0; index < identity.length; index++) {
                hash ^= identity.charCodeAt(index)
                hash = Math.imul(hash, 16777619)
            }
            return hash >>> 0
        },
        playerCoverStyle() {
            const cover = this.currentSong?.pic || this.defaultCover
            return {
                '--mobile-cover': `url(${JSON.stringify(cover)})`
            }
        }
    },
    methods: {
        closeDisclaimer() {
            this.disclaimerOpen = false
        },
        handleDisclaimerKeydown(event) {
            if (event.key === 'Escape') {
                this.closeDisclaimer()
                return
            }
            if (event.key !== 'Tab') return

            const dialog = this.$refs.disclaimerDialog
            if (!dialog) return
            const focusableElements = Array.from(dialog.querySelectorAll('button:not(:disabled), [href], [tabindex]:not([tabindex="-1"])'))
            if (!focusableElements.length) {
                event.preventDefault()
                dialog.focus()
                return
            }

            const firstElement = focusableElements[0]
            const lastElement = focusableElements[focusableElements.length - 1]
            if (event.shiftKey && (document.activeElement === firstElement || !dialog.contains(document.activeElement))) {
                event.preventDefault()
                lastElement.focus()
            } else if (!event.shiftKey && document.activeElement === lastElement) {
                event.preventDefault()
                firstElement.focus()
            }
        },
        exposeAppPlayerApi() {
            // 提供给 uni-app WebView 的稳定公开接口，不依赖页面按钮或 DOM 结构。
            window.LazyMonkeyPlayer = {
                version: 1,
                play: () => this.playAudio(),
                pause: () => this.pauseAudio(),
                previous: () => this.playPreviousSong(),
                next: () => this.playNextSong(),
                toggle: () => this.toggleAudioPlayback(),
                getState: () => ({
                    ready: Boolean(this.currentSong),
                    playing: Boolean(this.isAudioPlaying),
                    title: this.currentSong?.title || ''
                })
            }
            window.dispatchEvent(new CustomEvent('lazy-monkey-player-ready'))
        },
        removeAppPlayerApi() {
            if (window.LazyMonkeyPlayer?.version === 1) {
                delete window.LazyMonkeyPlayer
            }
        },
        updateMobileLyricVisibleCount() {
            const height = window.innerHeight || 0
            if (height >= 880) {
                this.mobileLyricVisibleCount = 7
            } else if (height >= 780) {
                this.mobileLyricVisibleCount = 5
            } else if (height >= 700) {
                this.mobileLyricVisibleCount = 4
            } else {
                this.mobileLyricVisibleCount = 3
            }

            if (this.isMobileViewport() && this.currentSong) {
                this.setPageTitle(this.currentSong.title)
            }
        },
        restoreCachedSettings() {
            this.keyword = window.localStorage.getItem(CACHE_KEYS.keyword) || ''
            const cachedMode = window.localStorage.getItem(CACHE_KEYS.playMode)
            if (PLAY_MODES.includes(cachedMode)) {
                this.playMode = cachedMode
                return
            }
            this.playMode = 'sequence'
        },
        async restorePlaybackState() {
            let cachedPlayback
            try {
                cachedPlayback = JSON.parse(window.localStorage.getItem(CACHE_KEYS.playback) || 'null')
            } catch (error) {
                window.localStorage.removeItem(CACHE_KEYS.playback)
                return
            }

            const cachedSong = cachedPlayback?.song
            if (!cachedSong?.sourceId || !cachedSong?.audioUrl) return

            const requestVersion = this.playbackRequestVersion
            const refreshedSong = await this.refreshCachedSong(cachedSong)
            if (requestVersion !== this.playbackRequestVersion) return
            this.currentSong = refreshedSong
            this.audioCurrentTime = Math.max(0, Number(cachedPlayback.currentTime) || 0)
            this.pendingRestoreTime = this.audioCurrentTime
            this.resumePlaybackRequested = Boolean(cachedPlayback.wasPlaying)
            this.updateMediaSessionMetadata()
            this.setPageTitle(refreshedSong.title)
            this.loadLyrics(refreshedSong.lrcUrl)
            this.$nextTick(() => {
                this.updateCurrentSongVisibility()
                this.openMobilePlayer()
            })
        },
        async refreshCachedSong(cachedSong) {
            const controller = new AbortController()
            const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT)
            try {
                const body = new URLSearchParams({
                    id: cachedSong.sourceId,
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
                if (!response.ok || !data.url) return cachedSong

                return {
                    ...cachedSong,
                    title: data.title || cachedSong.title,
                    pic: data.pic || cachedSong.pic,
                    audioUrl: this.proxyAudioUrl(data.url),
                    lrcUrl: data.lrc || cachedSong.lrcUrl || ''
                }
            } catch (error) {
                return cachedSong
            } finally {
                window.clearTimeout(timer)
            }
        },
        persistPlaybackState(wasPlaying = null) {
            if (!this.currentSong) return

            const audio = this.$refs.audioPlayer
            const currentTime = Number.isFinite(audio?.currentTime)
                ? audio.currentTime
                : this.audioCurrentTime
            const isPlaying = wasPlaying === null
                ? Boolean(this.isAudioPlaying || this.resumePlaybackRequested)
                : Boolean(wasPlaying)
            const song = {
                sourceId: this.currentSong.sourceId,
                title: this.currentSong.title,
                pic: this.currentSong.pic || '',
                audioUrl: this.currentSong.audioUrl,
                lrcUrl: this.currentSong.lrcUrl || ''
            }

            window.localStorage.setItem(CACHE_KEYS.playback, JSON.stringify({
                song,
                currentTime: Math.max(0, Number(currentTime) || 0),
                wasPlaying: isPlaying,
                savedAt: Date.now()
            }))
            this.lastPlaybackPersistedAt = Date.now()
        },
        handlePageHide() {
            const audio = this.$refs.audioPlayer
            this.persistPlaybackState(Boolean(audio && !audio.paused && !audio.ended))
        },
        async loadHomeSongs() {
            this.hasSearched = false
            this.resetPagination()
            return await this.fetchSongList(`${SOURCE_PROXY}/`, '推荐加载失败，请稍后重试。')
        },
        async loadRandomRecommendations() {
            this.keyword = ''
            return await this.loadHomeSongs()
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
        closeMobilePlayer() {
            if (this.mobilePlayerHistoryActive && this.isMobileViewport()) {
                window.history.back()
                return
            }

            this.mobileLyricsFullscreen = false
            this.mobilePlayerOpen = false
            this.$nextTick(this.updateCurrentSongVisibility)
        },
        openMobilePlayer() {
            this.mobilePlayerOpen = true
            this.$nextTick(() => {
                this.pushMobilePlayerHistory()
                this.updateCurrentSongVisibility()
            })
        },
        isMobileViewport() {
            return window.matchMedia?.('(max-width: 768px)').matches
        },
        toggleMobileLyricsFullscreen() {
            if (!this.isMobileViewport()) return

            if (this.mobileLyricsFullscreen) {
                if (this.mobileLyricsHistoryActive) {
                    window.history.back()
                    return
                }
                this.mobileLyricsFullscreen = false
                return
            }

            this.mobileLyricsFullscreen = true
            window.history.pushState({
                ...(window.history.state || {}),
                lazyMonkeyMobileLyrics: true
            }, '', window.location.href)
            this.mobileLyricsHistoryActive = true
            this.scrollActiveLyric('auto')
        },
        pushMobilePlayerHistory() {
            if (!this.isMobileViewport() || !this.currentSong || !this.mobilePlayerOpen || this.mobilePlayerHistoryActive) return

            window.history.pushState({
                ...(window.history.state || {}),
                lazyMonkeyMobilePlayer: true
            }, '', window.location.href)
            this.mobilePlayerHistoryActive = true
        },
        handleMobilePlayerPopState() {
            if (this.mobileLyricsHistoryActive) {
                this.mobileLyricsHistoryActive = false
                this.mobileLyricsFullscreen = false
                return
            }

            if (!this.mobilePlayerHistoryActive) return

            this.mobilePlayerHistoryActive = false
            if (this.mobilePlayerOpen) {
                this.mobileLyricsFullscreen = false
                this.mobilePlayerOpen = false
                this.$nextTick(this.updateCurrentSongVisibility)
            }
        },
        async togglePlayerPip() {
            if (this.isPlayerPip) {
                this.closePlayerPip()
                return
            }

            await this.openPlayerPip()
        },
        async openPlayerPip() {
            if (!this.currentSong || !this.$refs.player) return
            if (!('documentPictureInPicture' in window)) {
                this.showToast('当前浏览器不支持画中画')
                return
            }

            try {
                const pipWindow = await window.documentPictureInPicture.requestWindow({
                    width: 465,
                    height: 224
                })
                this.pipWindow = pipWindow
                this.isPlayerPip = true
                this.copyStylesToPipWindow(pipWindow)
                Object.assign(pipWindow.document.body.style, {
                    margin: '0',
                    padding: '12px',
                    background: '#f5f7fa',
                    boxSizing: 'border-box',
                    overflow: 'hidden'
                })
                pipWindow.document.body.append(this.$refs.player)
                pipWindow.addEventListener('pagehide', this.returnPlayerFromPip, { once: true })
            } catch (error) {
                if (error.name !== 'NotAllowedError') {
                    this.showToast('打开画中画失败', 'error')
                }
            }
        },
        closePlayerPip() {
            if (this.pipWindow && !this.pipWindow.closed) {
                this.pipWindow.close()
            } else {
                this.returnPlayerFromPip()
            }
        },
        returnPlayerFromPip() {
            if (this.$refs.playerHost && this.$refs.player && !this.$refs.playerHost.contains(this.$refs.player)) {
                this.$refs.playerHost.append(this.$refs.player)
            }
            this.isPlayerPip = false
            this.pipWindow = null
        },
        copyStylesToPipWindow(pipWindow) {
            const pipDocument = pipWindow.document
            Array.from(document.styleSheets).forEach((styleSheet) => {
                try {
                    const cssRules = Array.from(styleSheet.cssRules).map((rule) => rule.cssText).join('')
                    const style = pipDocument.createElement('style')
                    style.textContent = cssRules
                    pipDocument.head.append(style)
                } catch (error) {
                    if (styleSheet.href) {
                        const link = pipDocument.createElement('link')
                        link.rel = 'stylesheet'
                        link.href = styleSheet.href
                        pipDocument.head.append(link)
                    }
                }
            })
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
            this.resumePlaybackRequested = false
            this.startMusicVisualizer()
            this.updateMediaSessionPlaybackState('playing')
            this.syncLyricTitle()
            this.persistPlaybackState(true)
        },
        handleAudioPause() {
            this.isAudioPlaying = false
            this.resumePlaybackRequested = false
            this.stopMusicVisualizer()
            this.updateMediaSessionPlaybackState('paused')
            this.persistPlaybackState(false)
        },
        async startMusicVisualizer() {
            if (!this.isMobileViewport() || !this.$refs.audioPlayer) return

            let runtime = visualizerRuntime.get(this)
            if (!runtime) {
                runtime = this.createMusicVisualizerRuntime()
                if (!runtime) return
                visualizerRuntime.set(this, runtime)
            }

            if (runtime.isDecaying && runtime.animationFrame) {
                window.cancelAnimationFrame(runtime.animationFrame)
                runtime.animationFrame = 0
                runtime.isDecaying = false
            }

            try {
                await runtime.audioContext.resume()
            } catch (error) {
                return
            }

            if (!runtime.animationFrame) {
                this.drawMusicVisualizerFrame(runtime)
            }
        },
        createMusicVisualizerRuntime() {
            const audio = this.$refs.audioPlayer
            const AudioContextClass = window.AudioContext || window.webkitAudioContext
            if (!audio || !AudioContextClass) return null

            const audioContext = new AudioContextClass()
            const analyser = audioContext.createAnalyser()
            analyser.fftSize = 256
            analyser.smoothingTimeConstant = 0.68
            analyser.minDecibels = -90
            analyser.maxDecibels = -10

            try {
                const audioUrl = new URL(audio.currentSrc || audio.src, window.location.href)
                if (audioUrl.origin !== window.location.origin) {
                    audioContext.close()
                    return null
                }

                // 音频已经由本站代理为同源资源。直接绑定媒体元素比 captureStream
                // 在移动端 WebView 中稳定，后者可能在 play 事件发生时仍没有音轨。
                const source = audioContext.createMediaElementSource(audio)
                source.connect(analyser)
                analyser.connect(audioContext.destination)

                return {
                    audioContext,
                    analyser,
                    source,
                    frequencyData: new Uint8Array(analyser.frequencyBinCount),
                    peaks: new Array(50).fill(4),
                    isDecaying: false,
                    animationFrame: 0
                }
            } catch (error) {
                audioContext.close()
                return null
            }
        },
        drawMusicVisualizerFrame(runtime) {
            runtime.animationFrame = window.requestAnimationFrame(() => {
                runtime.animationFrame = 0
                if (!this.isAudioPlaying) return

                runtime.isDecaying = false
                runtime.analyser.getByteFrequencyData(runtime.frequencyData)
                this.paintMusicVisualizer(runtime)
                this.drawMusicVisualizerFrame(runtime)
            })
        },
        drawMusicVisualizerDecayFrame(runtime) {
            runtime.isDecaying = true
            runtime.animationFrame = window.requestAnimationFrame(() => {
                runtime.animationFrame = 0
                if (this.isAudioPlaying) {
                    runtime.isDecaying = false
                    this.drawMusicVisualizerFrame(runtime)
                    return
                }

                let barsAtRest = true
                for (let index = 0; index < runtime.frequencyData.length; index++) {
                    const nextValue = runtime.frequencyData[index] * 0.9
                    runtime.frequencyData[index] = nextValue < 1 ? 0 : nextValue
                    if (runtime.frequencyData[index] > 0) barsAtRest = false
                }

                this.paintMusicVisualizer(runtime)
                const peakFloor = runtime.peakFloor || 4
                const peaksAtRest = runtime.peaks.every((peak) => peak <= peakFloor)
                if (barsAtRest && peaksAtRest) {
                    runtime.isDecaying = false
                    runtime.frequencyData.fill(0)
                    runtime.peaks.fill(0)
                    this.clearMusicVisualizer()
                    return
                }
                this.drawMusicVisualizerDecayFrame(runtime)
            })
        },
        paintMusicVisualizer(runtime) {
            const canvas = this.$refs.musicVisualizerCanvas
            const context = canvas?.getContext('2d')
            if (!canvas || !context) return

            const rect = canvas.getBoundingClientRect()
            const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
            const width = Math.max(1, Math.round(rect.width * pixelRatio))
            const height = Math.max(1, Math.round(rect.height * pixelRatio))
            if (canvas.width !== width || canvas.height !== height) {
                canvas.width = width
                canvas.height = height
            }

            context.clearRect(0, 0, width, height)
            const barCount = Math.min(50, runtime.frequencyData.length)
            const gap = 2 * pixelRatio
            const barWidth = Math.max(pixelRatio, (width - gap * (barCount - 1)) / barCount)
            const floatHeight = 4 * pixelRatio
            const dropDistance = 1 * pixelRatio
            runtime.peakFloor = floatHeight
            const amplitudeScale = Math.max(0.55, (height - floatHeight) / 255)
            const hue = this.visualizerSeed % 360
            const gradient = context.createLinearGradient(0, height * 0.15, 0, height)
            gradient.addColorStop(0, `hsla(${(hue + 52) % 360}, 96%, 78%, 0.96)`)
            gradient.addColorStop(0.5, `hsla(${hue}, 88%, 62%, 0.86)`)
            gradient.addColorStop(1, `hsla(${(hue + 20) % 360}, 92%, 52%, 0.7)`)

            for (let index = 0; index < barCount; index++) {
                const x = index * (barWidth + gap)
                const barHeight = runtime.frequencyData[index] * amplitudeScale
                runtime.peaks[index] = Math.max(barHeight + floatHeight, runtime.peaks[index] - dropDistance)

                context.fillStyle = gradient
                context.fillRect(x, height - barHeight, barWidth, barHeight)
                const peakHasNotLanded = !runtime.isDecaying || runtime.peaks[index] > floatHeight
                if (peakHasNotLanded) {
                    context.fillStyle = `hsla(${(hue + 52) % 360}, 96%, 84%, 0.96)`
                    context.fillRect(x, height - runtime.peaks[index], barWidth, floatHeight)
                }
            }
        },
        clearMusicVisualizer() {
            const canvas = this.$refs.musicVisualizerCanvas
            const context = canvas?.getContext('2d')
            if (canvas && context) context.clearRect(0, 0, canvas.width, canvas.height)
        },
        stopMusicVisualizer() {
            const runtime = visualizerRuntime.get(this)
            if (!runtime) return

            if (runtime.animationFrame) {
                window.cancelAnimationFrame(runtime.animationFrame)
                runtime.animationFrame = 0
            }
            runtime.audioContext.suspend().catch(() => {})
            this.drawMusicVisualizerDecayFrame(runtime)
        },
        destroyMusicVisualizer() {
            const runtime = visualizerRuntime.get(this)
            if (!runtime) return

            if (runtime.animationFrame) {
                window.cancelAnimationFrame(runtime.animationFrame)
            }
            runtime.audioContext.close().catch(() => {})
            visualizerRuntime.delete(this)
            this.clearMusicVisualizer()
        },
        handleCarMediaCommand(event) {
            const command = event?.detail?.command
            if (command === 'previous') {
                this.playPreviousSong()
            } else if (command === 'next') {
                this.playNextSong()
            } else if (command === 'play') {
                this.playAudio()
            } else if (command === 'pause') {
                this.pauseAudio()
            }
        },
        playAudio() {
            const audio = this.$refs.audioPlayer
            if (!audio || !audio.paused) return
            audio.play().catch(() => {
                this.showMessage('浏览器拦截了播放，请稍后再试。')
            })
        },
        pauseAudio() {
            const audio = this.$refs.audioPlayer
            if (audio && !audio.paused) audio.pause()
        },
        setupMediaSession() {
            if (!('mediaSession' in navigator)) return

            const handlers = {
                play: () => this.playAudio(),
                pause: () => this.pauseAudio(),
                previoustrack: () => this.playPreviousSong(),
                nexttrack: () => this.playNextSong()
            }
            Object.entries(handlers).forEach(([action, handler]) => {
                try {
                    navigator.mediaSession.setActionHandler(action, handler)
                } catch (error) {
                    console.warn(`Media Session 不支持 ${action}`, error)
                }
            })
            this.updateMediaSessionPlaybackState('none')
        },
        clearMediaSession() {
            if (!('mediaSession' in navigator)) return
            ;['play', 'pause', 'previoustrack', 'nexttrack'].forEach((action) => {
                try {
                    navigator.mediaSession.setActionHandler(action, null)
                } catch (error) {
                    console.warn(`清理 Media Session ${action} 失败`, error)
                }
            })
            this.updateMediaSessionPlaybackState('none')
        },
        updateMediaSessionPlaybackState(state) {
            if (!('mediaSession' in navigator)) return
            try {
                navigator.mediaSession.playbackState = state
            } catch (error) {
                console.warn('更新 Media Session 播放状态失败', error)
            }
        },
        updateMediaSessionMetadata() {
            if (!('mediaSession' in navigator) || !this.currentSong) return
            const titleParts = String(this.currentSong.title || '').split(' - ')
            try {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: titleParts.slice(1).join(' - ') || titleParts[0] || '正在播放',
                    artist: titleParts.length > 1 ? titleParts[0] : '',
                    album: '懒猴音乐',
                    artwork: this.currentSong.pic ? [{ src: this.currentSong.pic }] : []
                })
            } catch (error) {
                console.warn('更新 Media Session 歌曲信息失败', error)
            }
        },
        handlePlayerKeydown(event) {
            if (!this.currentSong) return

            const target = event.target
            const tagName = target?.tagName?.toLowerCase()
            const isEditing = target?.isContentEditable || ['input', 'textarea', 'select'].includes(tagName)
            if (isEditing || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return

            if (event.key === 'ArrowRight') {
                event.preventDefault()
                this.playNextSong()
            } else if (event.key === 'ArrowLeft') {
                event.preventDefault()
                this.playPreviousSong()
            }
        },
        updateAudioProgress() {
            const audio = this.$refs.audioPlayer
            if (!audio) return

            this.audioCurrentTime = Number.isFinite(audio.currentTime) ? audio.currentTime : 0
            this.audioDuration = Number.isFinite(audio.duration) ? audio.duration : 0
        },
        handleAudioLoadedMetadata() {
            const audio = this.$refs.audioPlayer
            if (!audio) return

            this.updateAudioProgress()
            if (this.pendingRestoreTime !== null) {
                const maxTime = Number.isFinite(audio.duration)
                    ? Math.max(0, audio.duration - 0.1)
                    : this.pendingRestoreTime
                audio.currentTime = Math.min(this.pendingRestoreTime, maxTime)
                this.audioCurrentTime = audio.currentTime
                this.pendingRestoreTime = null
                this.updateLyricIndex()
            }

            if (!this.resumePlaybackRequested) return
            audio.play().catch(() => {
                this.resumePlaybackRequested = false
                this.persistPlaybackState(false)
                this.showMessage('已恢复上次播放进度；浏览器阻止了自动播放，请点击播放继续。')
            })
        },
        handleAudioTimeUpdate() {
            this.updateAudioProgress()
            this.updateLyricIndex()
            if (Date.now() - this.lastPlaybackPersistedAt >= 1000) {
                this.persistPlaybackState()
            }
        },
        seekAudio(event) {
            const audio = this.$refs.audioPlayer
            if (!audio) return

            const nextTime = Number(event.target.value)
            if (!Number.isFinite(nextTime)) return

            audio.currentTime = nextTime
            this.audioCurrentTime = nextTime
            this.updateLyricIndex()
            this.persistPlaybackState()
        },
        formatAudioTime(value) {
            const totalSeconds = Math.max(0, Math.floor(Number(value) || 0))
            const minutes = Math.floor(totalSeconds / 60)
            const seconds = totalSeconds % 60
            return `${minutes}:${String(seconds).padStart(2, '0')}`
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
                    if (!this.needVerify) {
                        this.showMessage('来源站需要安全验证，但没有解析到验证令牌，请稍后重试。', 'error')
                    }
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
            this.updateCurrentSongVisibility()
            if (!this.hasSearched || !this.results.length || !this.hasMoreResults || this.loading || this.loadingMore) return

            const target = this.scrollContainer === window ? document.documentElement : this.scrollContainer
            const scrollTop = this.scrollContainer === window ? window.scrollY : target.scrollTop
            const clientHeight = this.scrollContainer === window ? window.innerHeight : target.clientHeight
            const scrollHeight = target.scrollHeight
            if (scrollHeight - scrollTop - clientHeight < 240) {
                this.loadMoreSongs()
            }
        },
        updateCurrentSongVisibility() {
            const isMobile = window.matchMedia?.('(max-width: 768px)').matches
            if (!isMobile || !this.currentSong) {
                this.isCurrentSongOutOfView = false
                return
            }

            const currentItem = this.$el.querySelector('.song-item.playing')
            if (!currentItem) {
                this.isCurrentSongOutOfView = true
                return
            }

            const rect = currentItem.getBoundingClientRect()
            const topLimit = this.showMobileNowPlayingBar ? 120 : 74
            const bottomLimit = window.innerHeight || document.documentElement.clientHeight
            this.isCurrentSongOutOfView = rect.bottom <= topLimit || rect.top >= bottomLimit
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
            this.resumePlaybackRequested = false
            this.activeLyricIndex = -1
            if (this.playMode === 'loop') {
                this.syncLyricTitle()
                return
            }
            this.persistPlaybackState(false)
            if (this.playMode === 'random') {
                await this.playRandomSong()
                return
            }

            await this.playNextSong()
        },
        async playNextSong() {
            if (this.playMode === 'random') {
                await this.playRandomSong(this.results)
                return
            }

            let playableSongs = this.results.filter((song) => song.sourceId)
            if (!playableSongs.length) {
                this.showToast('当前列表没有可顺序播放的歌曲')
                return
            }

            let currentIndex = playableSongs.findIndex((song) => this.isCurrentSong(song))
            let nextSong = playableSongs[currentIndex + 1]
            const isLastLoadedSong = currentIndex === playableSongs.length - 1

            if (!nextSong && isLastLoadedSong && this.hasSearched && this.hasMoreResults) {
                await this.loadMoreSongs()
                playableSongs = this.results.filter((song) => song.sourceId)
                currentIndex = playableSongs.findIndex((song) => this.isCurrentSong(song))
                nextSong = playableSongs[currentIndex + 1]
            }

            if (!nextSong) {
                this.showToast('暂无下一曲')
                this.resetPageTitle()
                return
            }

            await this.playSong(nextSong)
        },
        async playPreviousSong() {
            const playableSongs = this.results.filter((song) => song.sourceId)
            if (!playableSongs.length) {
                this.showToast('当前列表没有可播放的歌曲')
                return
            }

            const currentIndex = playableSongs.findIndex((song) => this.isCurrentSong(song))
            const previousSong = playableSongs[currentIndex - 1]
            if (!previousSong) {
                this.showToast('已经是第一首了')
                return
            }

            await this.playSong(previousSong)
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
        cancelVerify() {
            this.needVerify = false
            this.verifyToken = ''
            this.message = ''
        },
        handleVerifyDialogKeydown(event) {
            if (event.key === 'Escape') {
                if (!this.verifying) this.cancelVerify()
                return
            }
            if (event.key !== 'Tab') return

            const dialog = this.$refs.verifyDialog
            if (!dialog) return
            const focusableElements = Array.from(dialog.querySelectorAll('button:not(:disabled), [href], input:not(:disabled), [tabindex]:not([tabindex="-1"])'))
            if (!focusableElements.length) {
                event.preventDefault()
                dialog.focus()
                return
            }

            const firstElement = focusableElements[0]
            const lastElement = focusableElements[focusableElements.length - 1]
            if (event.shiftKey && (document.activeElement === firstElement || !dialog.contains(document.activeElement))) {
                event.preventDefault()
                lastElement.focus()
            } else if (!event.shiftKey && document.activeElement === lastElement) {
                event.preventDefault()
                firstElement.focus()
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
        proxyAudioUrl(url) {
            if (!url) return ''

            try {
                const target = new URL(url, window.location.href)
                if (target.origin === window.location.origin) return target.href
                return `/audio-proxy?url=${encodeURIComponent(target.href)}`
            } catch (error) {
                return url
            }
        },
        playSongFromItem(song, event) {
            const isMobile = window.matchMedia?.('(max-width: 768px)').matches
            if (!isMobile || song.loading || event.target.closest('button')) return
            if (this.isCurrentSong(song)) {
                this.openMobilePlayer()
                return
            }

            this.playSong(song)
        },
        async playSong(song) {
            if (!song.sourceId) {
                this.showToast('没有找到歌曲ID')
                return
            }

            this.playbackRequestVersion += 1
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
                this.audioCurrentTime = 0
                this.audioDuration = 0
                this.currentSong = {
                    sourceId: song.sourceId,
                    title: data.title || `${song.singer} - ${song.title}`,
                    pic: data.pic || song.pic,
                    audioUrl: this.proxyAudioUrl(data.url),
                    lrcUrl: data.lrc || ''
                }
                this.resumePlaybackRequested = true
                this.persistPlaybackState(true)
                this.updateMediaSessionMetadata()
                this.openMobilePlayer()
                this.setPageTitle(this.currentSong.title)
                this.loadLyrics(this.currentSong.lrcUrl)
                this.$nextTick(() => {
                    this.updateCurrentSongVisibility()
                    this.$refs.audioPlayer?.play?.().catch(() => {
                        this.resumePlaybackRequested = false
                        this.persistPlaybackState(false)
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
            if (this.isMobileViewport()) return

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
            if (cleanText.length <= scrollThreshold || this.isMobileViewport()) {
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
        isMobileViewport() {
            return window.matchMedia?.('(max-width: 768px)').matches || window.innerWidth <= 768
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
                if (list && activeLine) {
                    const listRect = list.getBoundingClientRect()
                    const activeRect = activeLine.getBoundingClientRect()
                    const currentOffset = activeRect.top - listRect.top
                    const targetTop = list.scrollTop + currentOffset - (list.clientHeight - activeLine.clientHeight) / 2
                    const maxTop = Math.max(0, list.scrollHeight - list.clientHeight)

                    list.scrollTo({
                        top: Math.min(Math.max(targetTop, 0), maxTop),
                        behavior
                    })
                }

                const mobileList = this.$refs.mobileLyricsList
                const activeMobileLine = mobileList?.querySelector('.mobile-lyric-line.active')
                if (this.mobileLyricsFullscreen && mobileList && activeMobileLine) {
                    activeMobileLine.scrollIntoView({ block: 'center', behavior })
                }
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
    position: relative;
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
    padding: 12px;
}

.toolbar > div {
    width: 100%;
}

.toolbar h2,
.toolbar p,
.player h2,
.song-info h3,
.song-info p {
    margin: 0;
}

.toolbar h2 {
    font-size: 18px;
}

.toolbox-home-link {
    border-radius: 4px;
    color: inherit;
    text-decoration: none;
}

.toolbox-home-link:hover {
    color: #0065a0;
}

.toolbox-home-link:focus-visible {
    outline: 2px solid #0065a0;
    outline-offset: 3px;
}

.toolbar p {
    margin-top: 8px;
    color: #77808a;
}

.source-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
}

.disclaimer-link {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    gap: 5px;
    padding: 2px 0;
    border: 0;
    border-bottom: 1px solid transparent;
    background: transparent;
    color: #0065a0;
    cursor: pointer;
    font: inherit;
    font-size: 14px;
    font-weight: 400;
    line-height: 1.2;
    transition: color 0.2s, border-color 0.2s;
}

.disclaimer-link:hover {
    border-bottom-color: currentColor;
    color: #004f7e;
}

.disclaimer-link:focus-visible {
    border-radius: 3px;
    outline: 2px solid #0065a0;
    outline-offset: 3px;
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

:global(body.disclaimer-modal-open) {
    overflow: hidden;
}

.disclaimer-modal-layer {
    position: fixed;
    inset: 0;
    z-index: 1300;
    display: grid;
    place-items: center;
    box-sizing: border-box;
    padding: 24px;
    background: rgba(20, 27, 38, 0.52);
    backdrop-filter: blur(3px);
    -webkit-backdrop-filter: blur(3px);
}

.disclaimer-dialog {
    width: min(600px, 100%);
    max-height: min(680px, calc(100vh - 48px));
    overflow: auto;
    box-sizing: border-box;
    padding: 24px;
    border: 1px solid #dfe5eb;
    border-radius: 12px;
    background: #fff;
    box-shadow: 0 22px 54px rgba(14, 22, 34, 0.3);
    color: #2c3e50;
}

.disclaimer-dialog:focus {
    outline: none;
}

.disclaimer-dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    padding-bottom: 14px;
    border-bottom: 1px solid #e7eaee;
}

.disclaimer-dialog-header h2 {
    margin: 0;
    font-size: 20px;
}

.disclaimer-close-icon {
    display: grid;
    flex: 0 0 32px;
    width: 32px;
    height: 32px;
    padding: 0;
    place-items: center;
    border: 0;
    border-radius: 6px;
    background: #ffffff;
    color: #5f6973;
    cursor: pointer;
    font-size: 24px;
    line-height: 1;
}

.disclaimer-close-icon:hover {
    background: #e0e6ed;
    color: #2c3e50;
}

.disclaimer-content {
    margin: 20px 0 0;
    padding-left: 24px;
    color: #4e5965;
    font-size: 15px;
    line-height: 1.75;
}

.disclaimer-content li + li {
    margin-top: 12px;
}

.disclaimer-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 22px;
}

.disclaimer-actions button {
    padding: 9px 18px;
    border: 0;
    border-radius: 6px;
    background: #0065a0;
    color: #fff;
    cursor: pointer;
    font-size: 14px;
}

.disclaimer-actions button:hover {
    background: #005486;
}

.disclaimer-dialog button:focus-visible {
    outline: 3px solid rgba(0, 101, 160, 0.34);
    outline-offset: 3px;
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

.verify-dialog {
    position: fixed;
    top: 50%;
    left: 50%;
    z-index: 40;
    width: min(320px, calc(100vw - 32px));
    padding: 16px;
    border: 1px solid #ffd5d5;
    border-radius: 8px;
    background: #fff;
    box-shadow: 0 12px 34px rgba(31, 45, 61, 0.2);
    color: #2c3e50;
    transform: translate(-50%, -50%);
}

.verify-dialog-title {
    color: #b23b3b;
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 8px;
}

.verify-dialog-text {
    color: #5f6973;
    font-size: 14px;
    line-height: 1.6;
}

.verify-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 10px;
}

.verify-btn,
.verify-cancel-btn {
    border: none;
    border-radius: 6px;
    cursor: pointer;
    padding: 9px 12px;
}

.verify-btn {
    background: #b23b3b;
    color: #fff;
}

.verify-cancel-btn {
    background: #eef2f6;
    color: #2c3e50;
}

.verify-btn:hover {
    opacity: 0.9;
}

.verify-cancel-btn:hover {
    background: #e0e6ed;
}

.player-host {
    display: contents;
}

.mobile-player-top,
.mobile-song-meta,
.mobile-transport,
.mobile-music-visualizer {
    display: none;
}

.player {
    position: fixed;
    bottom: -1px;
    left: calc(50vw + 67px);
    transform: translateX(-50%);
    z-index: 999;
    width: 980px;
    max-width: none;
    margin: 0 auto;
    padding: 16px;
    border: 1px solid #2c3e50;
    border-radius: 8px 8px 0 0;
    box-shadow: 0 10px 30px rgba(31, 45, 61, 0.18);
}

.player-main {
    display: flex;
    align-items: center;
    gap: 18px;
}

.player.pip-player {
    display: flex;
    flex-direction: column;
    gap: 10px;
    position: static;
    left: auto;
    right: auto;
    bottom: auto;
    width: 100%;
    max-width: none;
    margin: 0;
    box-sizing: border-box;
    border-radius: 8px;
    box-shadow: none;
}

.player.pip-player .player-main {
    width: 100%;
}

.player.pip-player .player-info {
    display: flex;
    flex-direction: column;
    min-height: 0;
}

.disc-controls {
    display: grid;
    grid-template-columns: 34px 92px 34px;
    align-items: center;
    gap: 10px;
    flex: 0 0 auto;
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
    animation: disc-spin 8s linear infinite;
    animation-play-state: paused;
}

.disc-button.playing .disc-cover {
    animation-play-state: running;
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

.pip-btn {
    flex: 0 0 auto;
    border: none;
    border-radius: 999px;
    background: #2c3e50;
    color: #fff;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    padding: 6px 12px;
    white-space: nowrap;
    transition: opacity 0.2s;
}

.pip-btn:hover {
    opacity: 0.9;
}

.player h2 {
    flex: 1 1 auto;
    font-size: 18px;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.native-audio {
    display: none;
}

.custom-player-controls {
    display: block;
}

.track-nav-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border: 1px solid #c8d2dc;
    border-radius: 50%;
    background: #eef7fb;
    color: #0065a0;
    cursor: pointer;
    transition: background-color 0.2s, border-color 0.2s, color 0.2s;
}

.track-nav-btn:hover {
    background: #d9edf6;
    color: #2c3e50;
}

.track-nav-btn:active {
    border-color: #0065a0;
}

.prev-track-icon,
.next-track-icon {
    position: relative;
    display: inline-block;
    width: 16px;
    height: 16px;
}

.prev-track-icon::before,
.prev-track-icon::after,
.next-track-icon::before,
.next-track-icon::after {
    content: '';
    position: absolute;
    top: 3px;
}

.prev-track-icon::before {
    left: 2px;
    width: 2px;
    height: 10px;
    border-radius: 2px;
    background: currentColor;
}

.prev-track-icon::after {
    left: 5px;
    width: 0;
    height: 0;
    border-top: 5px solid transparent;
    border-bottom: 5px solid transparent;
    border-right: 8px solid currentColor;
}

.next-track-icon::before {
    right: 5px;
    width: 0;
    height: 0;
    border-top: 5px solid transparent;
    border-bottom: 5px solid transparent;
    border-left: 8px solid currentColor;
}

.next-track-icon::after {
    right: 2px;
    width: 2px;
    height: 10px;
    border-radius: 2px;
    background: currentColor;
}

.progress-wrap {
    min-width: 0;
}

.progress-slider {
    width: 100%;
    height: 20px;
    margin: 0;
    accent-color: #0065a0;
    cursor: pointer;
}

.time-row {
    display: flex;
    justify-content: space-between;
    color: #7b8590;
    font-size: 12px;
    line-height: 1;
    margin-top: 2px;
}

.pip-lyric-line {
    display: block;
    width: 100%;
    box-sizing: border-box;
    margin-top: 0;
    padding: 8px 10px;
    border-radius: 6px;
    background: #eef7fb;
    color: #0065a0;
    font-size: 14px;
    font-weight: 500;
    line-height: 1.4;
    overflow: hidden;
    text-align: center;
    text-overflow: ellipsis;
    white-space: nowrap;
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
    border-color: #0065a0;
}

.song-skeleton {
    pointer-events: none;
}

.skeleton-block {
    display: block;
    background: linear-gradient(90deg, #e7ecf1 24%, #f7f9fb 42%, #e7ecf1 64%);
    background-size: 300% 100%;
    animation: skeleton-shimmer 1.45s ease-in-out infinite;
}

.skeleton-cover {
    width: 56px;
    height: 56px;
    border-radius: 6px;
}

.skeleton-copy {
    display: grid;
    gap: 9px;
    min-width: 0;
}

.skeleton-title {
    width: min(84%, 180px);
    height: 15px;
    border-radius: 4px;
}

.skeleton-meta {
    width: min(56%, 112px);
    height: 11px;
    border-radius: 4px;
}

.skeleton-action {
    width: 30px;
    height: 30px;
    border-radius: 50%;
}

@keyframes skeleton-shimmer {
    from {
        background-position: 100% 0;
    }

    to {
        background-position: 0 0;
    }
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
    background: #0065a0;
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
    :global(body.verify-modal-open) {
        overflow: hidden;
        overscroll-behavior: none;
    }

    .verify-modal-layer {
        position: fixed;
        inset: 0;
        z-index: 1200;
        display: grid;
        place-items: center;
        box-sizing: border-box;
        padding: max(20px, env(safe-area-inset-top)) 20px max(20px, env(safe-area-inset-bottom));
        background: rgba(20, 27, 38, 0.52);
        backdrop-filter: blur(3px);
        -webkit-backdrop-filter: blur(3px);
    }

    .verify-modal-layer .verify-dialog {
        position: relative;
        top: auto;
        left: auto;
        z-index: auto;
        width: min(340px, 100%);
        box-sizing: border-box;
        padding: 20px;
        border-radius: 12px;
        transform: none;
        box-shadow: 0 22px 54px rgba(14, 22, 34, 0.3);
    }

    .verify-modal-layer button:focus-visible {
        outline: 3px solid rgba(0, 101, 160, 0.34);
        outline-offset: 3px;
    }

    button {
        -webkit-tap-highlight-color: transparent;
    }

    button:active,
    button:focus {
        box-shadow: none;
        outline: none;
    }

    .toolbar {
        align-items: flex-start;
        flex-direction: column;
    }

    .mp3-page {
        padding-top: 74px;
        padding-bottom: 0;
    }

    .mp3-page.has-mobile-now-playing {
        padding-top: 118px;
    }

    .search-box {
        position: fixed;
        top: 0;
        right: 0;
        left: 0;
        z-index: 18;
        box-sizing: border-box;
        margin-top: 0;
        border-radius: 0;
        background: #f5f7fa;
        box-shadow: 0 6px 18px rgba(31, 45, 61, 0.08);
    }

    .mobile-now-playing-bar {
        position: fixed;
        top: 66px;
        right: 0;
        left: 0;
        z-index: 17;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        width: 100%;
        height: 44px;
        padding: 0 16px;
        border: none;
        border-radius: 0;
        background: #fff;
        color: #2c3e50;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
        font-size: 14px;
        text-align: left;
        border: 1px solid #e7eaee;
        background: #f5f7fa;
        z-index: 99;
        border-top: none;
        margin-top: -8px;
    }
    .mobile-now-playing-content {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
    }

    .mobile-now-playing-bars {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 2px;
        flex: 0 0 auto;
        width: 18px;
        height: 18px;
    }

    .mobile-now-playing-bars span {
        width: 3px;
        height: 7px;
        border-radius: 2px;
        background: #0065a0;
        animation: musicBar 1.0s ease-in-out infinite;
    }

    .mobile-now-playing-bars span:nth-child(2) {
        animation-delay: 0.12s;
    }

    .mobile-now-playing-bars span:nth-child(3) {
        animation-delay: 0.24s;
    }

    .mobile-now-playing-bars span:nth-child(4) {
        animation-delay: 0.36s;
    }

    .mobile-now-playing-bar .title {
        color: #0065a0;
    }

    .mobile-now-playing-content .title {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .mobile-now-playing-arrow {
        flex: 0 0 auto;
        width: 10px;
        height: 10px;
        border-top: 1px solid currentColor;
        border-right: 1px solid currentColor;
        transform: rotate(45deg) scale(0.9);
    }

    .player {
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        display: flex;
        flex-direction: column;
        gap: 20px;
        width: 100vw;
        height: 100vh;
        height: 100dvh;
        max-width: none;
        padding: 24px 24px 30px;
        border: none;
        border-radius: 0;
        color: #fff;
        overflow: hidden;
        box-shadow: none;
        background: #251f30;
        transform: none;
    }

    .player.mobile-player-closed {
        display: none;
    }

    .player::before {
        content: '';
        position: absolute;
        inset: 0;
        z-index: -2;
        background-image:
            linear-gradient(rgba(30, 25, 42, 0.48), rgba(30, 25, 42, 0.86)),
            var(--mobile-cover);
        background-position: center;
        background-size: cover;
        filter: blur(20px);
        transform: scale(1.12);
    }

    .player::after {
        content: '';
        position: absolute;
        inset: 0;
        z-index: -1;
        background: radial-gradient(circle at 50% 18%, rgba(255, 255, 255, 0.14), transparent 28%),
            linear-gradient(180deg, rgba(36, 28, 45, 0.18), rgba(24, 23, 34, 0.72));
    }

    .mobile-music-visualizer {
        position: absolute;
        right: 0;
        bottom: 0;
        left: 0;
        z-index: 0;
        display: block;
        height: 32%;
        opacity: 0.25;
        overflow: hidden;
        pointer-events: none;
        -webkit-mask-image: linear-gradient(to bottom, transparent, #000 30%, #000);
        mask-image: linear-gradient(to bottom, transparent, #000 30%, #000);
    }

    .mobile-music-visualizer,
    .mobile-music-visualizer * {
        pointer-events: none !important;
    }

    .mobile-music-visualizer canvas {
        display: block;
        width: 100%;
        height: 100%;
    }

    .mobile-player-top,
    .disc-controls,
    .mobile-song-meta,
    .player-info,
    .mobile-transport {
        z-index: 1;
    }

    @keyframes mobileMusicPulse {
        0% {
            transform: scaleY(var(--visualizer-low-scale));
        }
        55% {
            transform: scaleY(1);
        }
        100% {
            transform: scaleY(0.46);
        }
    }

    .mobile-player-top {
        order: 1;
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        align-items: center;
        flex: 0 0 auto;
        min-height: 44px;
    }

    .mobile-now-title {
        font-size: 18px;
        font-weight: 700;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        text-align: center;
    }

    .mobile-now-title span {
        color: rgba(255, 255, 255, 0.68);
        font-weight: 600;
    }

    .mobile-icon-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 42px;
        height: 42px;
        border: 1px solid rgba(255, 255, 255, 0.32);
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.08);
        color: #fff;
        padding: 0 12px;
    }

    .mobile-player-top .mobile-icon-btn:first-child {
        border: none;
        background: transparent;
        padding: 0;
    }

    .mobile-player-top .mobile-icon-btn:last-child {
        min-width: auto;
        height: 32px;
        padding: 0 10px;
    }

    .mobile-mode-label {
        display: block;
        max-width: none;
        overflow: visible;
        color: rgba(255, 255, 255, 0.9);
        font-size: 12px;
        font-weight: 700;
        white-space: nowrap;
    }

    .mobile-back-icon {
        width: 24px;
        height: 24px;
        border-left: 3px solid currentColor;
        border-bottom: 3px solid currentColor;
        transform: rotate(45deg);
    }

    .player-main {
        display: contents;
    }

    .disc-controls {
        order: 2;
        display: flex;
        align-items: center;
        justify-content: center;
        flex: 1 1 0;
        min-height: 150px;
        margin: 0;
    }

    .disc-controls > .track-nav-btn {
        display: none;
    }

    .disc-button {
        width: auto;
        height: min(100%, 42vh, 360px);
        height: min(100%, 42dvh, 360px);
        aspect-ratio: 1;
        flex-basis: auto;
        box-sizing: border-box;
        padding: 10px;
        border: 1px solid rgba(255, 255, 255, 0.24);
        border-radius: 50%;
        background:
            radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.9) 0 8%, rgba(255, 255, 255, 0.18) 9% 14%, transparent 15%),
            repeating-radial-gradient(circle, rgba(255, 255, 255, 0.2) 0 1px, transparent 1px 18px),
            conic-gradient(from 130deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.24), rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.2));
        box-shadow: 0 18px 42px rgba(0, 0, 0, 0.32);
        overflow: visible;
    }

    .disc-cover {
        position: relative;
        z-index: 1;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        opacity: 0.82;
        box-shadow: inset 0 0 0 18px rgba(0, 0, 0, 0.12);
    }

    .disc-button::before,
    .disc-button::after {
        content: '';
        position: absolute;
        pointer-events: none;
        border-radius: 50%;
    }

    .disc-button::before {
        inset: 10px;
        z-index: 2;
        background:
            radial-gradient(circle at 50% 50%, transparent 0 16%, rgba(255, 255, 255, 0.24) 17% 18%, transparent 19%),
            linear-gradient(135deg, rgba(255, 255, 255, 0.22), transparent 34%, rgba(255, 255, 255, 0.14) 56%, transparent 72%);
        mix-blend-mode: screen;
    }

    .disc-button::after {
        top: 50%;
        left: 50%;
        z-index: 3;
        width: 58px;
        height: 58px;
        background:
            radial-gradient(circle, rgba(37, 31, 48, 0.96) 0 28%, rgba(255, 255, 255, 0.88) 30% 48%, rgba(37, 31, 48, 0.9) 50% 100%);
        transform: translate(-50%, -50%);
        box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.26), 0 6px 16px rgba(0, 0, 0, 0.28);
    }

    .disc-center {
        display: none;
    }

    .mobile-song-meta {
        order: 3;
        display: block;
        flex: 0 1 auto;
        min-height: 0;
        margin-top: 0;
        text-align: center;
    }

    .mobile-lyrics {
        display: grid;
        gap: 8px;
        align-content: center;
        max-height: 100%;
        overflow: hidden;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
    }

    .mobile-lyrics:focus-visible {
        outline: 2px solid rgba(159, 177, 255, 0.9);
        outline-offset: 4px;
    }

    .player.mobile-lyrics-fullscreen {
        gap: 0;
        padding: 0;
    }

    .player.mobile-lyrics-fullscreen .mobile-player-top,
    .player.mobile-lyrics-fullscreen .player-main,
    .player.mobile-lyrics-fullscreen .mobile-transport {
        display: none;
    }

    .player.mobile-lyrics-fullscreen .mobile-song-meta {
        display: block;
        flex: 1 1 100%;
        width: 100%;
        height: 100%;
        margin: 0;
    }

    .player.mobile-lyrics-fullscreen .mobile-lyrics {
        display: block;
        width: 100%;
        height: 100%;
        max-height: none;
        padding: 50vh 24px;
        padding: 50dvh 24px;
        overflow-y: auto;
        overscroll-behavior: contain;
        scrollbar-width: none;
    }

    .player.mobile-lyrics-fullscreen .mobile-lyrics::-webkit-scrollbar {
        display: none;
    }

    .player.mobile-lyrics-fullscreen .mobile-lyric-line {
        padding: 10px 0;
        color: rgba(255, 255, 255, 0.72);
        font-size: 17px;
        line-height: 1.55;
        opacity: 0.56;
        overflow: visible;
        text-overflow: clip;
        white-space: normal;
    }

    .player.mobile-lyrics-fullscreen .mobile-lyric-line.active {
        color: #9fb1ff;
        font-size: 22px;
        opacity: 1;
    }

    .mobile-lyric-line {
        color: #fff;
        font-size: var(--mobile-lyric-font-size, 16px);
        font-weight: 600;
        line-height: 1.35;
        opacity: var(--mobile-lyric-opacity, 0.54);
        overflow: hidden;
        text-overflow: ellipsis;
        transition: color 0.25s ease, font-size 0.25s ease, opacity 0.25s ease;
        white-space: nowrap;
    }

    .mobile-lyric-line.active {
        color: #9fb1ff;
        font-size: 18px;
        font-weight: 800;
        opacity: 1;
    }

    .lyrics-panel {
        display: none;
    }

    .player-info {
        order: 4;
        flex: 0 0 auto;
        width: 100%;
        margin-top: 0;
        padding-bottom: 120px;
    }

    .player-header {
        display: none;
    }

    .custom-player-controls {
        margin-top: 0;
    }

    .progress-wrap {
        margin-right: 20px;
        margin-left: 20px;
    }

    .progress-slider {
        height: 26px;
        accent-color: #8197ff;
    }

    .time-row {
        color: rgba(255, 255, 255, 0.76);
        font-size: 16px;
        font-weight: 600;
        margin-top: 0;
    }

    .mobile-transport {
        order: 5;
        display: grid;
        grid-template-columns: 52px 76px 52px;
        align-items: center;
        justify-content: center;
        gap: 44px;
        flex: 0 0 auto;
        position: absolute;
        right: 0;
        bottom: 30px;
        left: 0;
        z-index: 20;
        margin-top: 0;
        pointer-events: auto;
    }

    .mobile-nav-btn,
    .mobile-play-btn {
        position: relative;
        z-index: 1;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.08);
        color: #fff;
        padding: 0;
        pointer-events: auto;
        touch-action: manipulation;
    }

    .mobile-nav-btn:active {
        border-color: rgba(255, 255, 255, 0.88);
    }

    .mobile-nav-btn {
        width: 52px;
        height: 52px;
        font-size: 28px;
    }

    .mobile-play-btn {
        width: 76px;
        height: 76px;
        background: rgba(130, 143, 205, 0.72);
        box-shadow: 0 10px 28px rgba(0, 0, 0, 0.24);
    }

    .mobile-play-btn:active {
        border-color: rgba(255, 255, 255, 0.95);
        box-shadow: 0 0 0 3px rgba(159, 177, 255, 0.42), 0 10px 28px rgba(0, 0, 0, 0.24);
    }

    .mobile-play-btn .play-icon {
        width: 0;
        height: 0;
        margin-left: 5px;
        border-top: 17px solid transparent;
        border-bottom: 17px solid transparent;
        border-left: 26px solid #fff;
    }

    .mobile-play-btn .pause-icon {
        width: 20px;
        height: 30px;
        border-left: 6px solid #fff;
        border-right: 6px solid #fff;
    }

    .mobile-nav-btn .prev-track-icon,
    .mobile-nav-btn .next-track-icon {
        position: relative;
        width: 28px;
        height: 28px;
        transform: scale(1.5);
    }

    .mobile-nav-btn .prev-track-icon::before,
    .mobile-nav-btn .prev-track-icon::after,
    .mobile-nav-btn .next-track-icon::before,
    .mobile-nav-btn .next-track-icon::after {
        top: 50%;
    }

    .mobile-nav-btn .prev-track-icon::before {
        left: 6px;
        transform: translateY(-50%);
    }

    .mobile-nav-btn .prev-track-icon::after {
        left: 10px;
        transform: translateY(-50%);
    }

    .mobile-nav-btn .next-track-icon::before {
        right: 10px;
        transform: translateY(-50%);
    }

    .mobile-nav-btn .next-track-icon::after {
        right: 6px;
        transform: translateY(-50%);
    }

    .player.pip-player {
        position: static;
        inset: auto;
        display: flex;
        flex-direction: column;
        gap: 10px;
        width: 100%;
        height: auto;
        max-width: none;
        margin: 0;
        padding: 16px;
        border: 1px solid #2c3e50;
        border-radius: 8px;
        color: #2c3e50;
        overflow: hidden;
        background: #fff;
        box-shadow: none;
    }

    .player.pip-player::before,
    .player.pip-player::after {
        content: none;
    }

    .player.pip-player .mobile-player-top,
    .player.pip-player .mobile-song-meta,
    .player.pip-player .mobile-transport,
    .player.pip-player .mobile-music-visualizer {
        display: none;
    }

    @media (prefers-reduced-motion: reduce) {
        .mobile-music-visualizer {
            display: none;
        }
    }

    .player.pip-player .player-main {
        display: flex;
        align-items: center;
        gap: 18px;
        width: 100%;
    }

    .player.pip-player .disc-controls {
        order: initial;
        display: grid;
        grid-template-columns: 34px 92px 34px;
        align-items: center;
        justify-content: initial;
        gap: 10px;
        flex: 0 0 auto;
        margin: 0;
    }

    .player.pip-player .disc-controls > .track-nav-btn {
        display: inline-flex;
    }

    .player.pip-player .disc-button {
        width: 92px;
        height: 92px;
        flex: 0 0 92px;
        padding: 0;
        border: none;
        background: #111827;
        overflow: hidden;
        box-shadow: 0 4px 14px rgba(31, 45, 61, 0.22);
    }

    .player.pip-player .disc-button::before,
    .player.pip-player .disc-button::after {
        content: none;
    }

    .player.pip-player .disc-cover {
        position: static;
        z-index: auto;
        width: 92px;
        height: 92px;
        opacity: 1;
        box-shadow: none;
    }

    .player.pip-player .disc-center {
        display: flex;
        z-index: 2;
    }

    .player.pip-player .player-info {
        order: initial;
        display: flex;
        flex: 1 1 auto;
        flex-direction: column;
        min-width: 0;
        min-height: 0;
        width: auto;
        margin-top: 0;
        padding-bottom: 0;
    }

    .player.pip-player .player-header {
        display: flex;
    }

    .player.pip-player .custom-player-controls {
        margin-top: 10px;
    }

    .player.pip-player .progress-slider {
        height: auto;
        accent-color: auto;
    }

    .player.pip-player .time-row {
        color: #7b8590;
        font-size: 12px;
        font-weight: 400;
        margin-top: 4px;
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
        cursor: pointer;
    }

    .song-item img {
        width: 54px;
        height: 54px;
    }

    .skeleton-cover {
        width: 54px;
        height: 54px;
    }

}

@media (max-width: 768px) and (max-height: 700px) {
    .player {
        padding: 18px 24px 30px;
    }

    .disc-controls {
        min-height: 120px;
    }

    .disc-button {
        height: min(100%, 39vh, 292px);
        height: min(100%, 39dvh, 292px);
    }

    .mobile-song-meta {
        margin-top: 0;
    }

    .player-info {
        margin-top: 0;
        padding-bottom: 120px;
    }

    .time-row {
        font-size: 15px;
        margin-top: 0;
    }

    .mobile-transport {
        gap: 36px;
    }

    .mobile-nav-btn {
        width: 48px;
        height: 48px;
    }

    .mobile-play-btn {
        width: 68px;
        height: 68px;
    }

    .mobile-play-btn .play-icon {
        border-top-width: 15px;
        border-bottom-width: 15px;
        border-left-width: 23px;
    }

    .mobile-play-btn .pause-icon {
        width: 18px;
        height: 28px;
    }
}

@media (max-width: 420px) {
    .player-header {
        gap: 8px;
    }

    .player h2 {
        font-size: 16px;
    }

    .custom-player-controls {
        grid-template-columns: 30px minmax(0, 1fr) 30px;
        gap: 8px;
    }

    .track-nav-btn {
        width: 30px;
        height: 30px;
    }

    .pip-btn {
        display: none;
    }
}

@media (prefers-reduced-motion: reduce) {
    .skeleton-block {
        animation: none;
    }
}
</style>
